import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { User } from '@supabase/supabase-js';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  text: string;
  timestamp: string;
  read_by: string[] | null;
}

interface UseChatParams {
  user: User | null;
  otherUserId: string;
  onConnectionVerified: (isVerified: boolean) => void;
}

const getCanonicalChannelName = (userId1: string, userId2: string) => {
  return `chat:${[userId1, userId2].sort().join(':')}`;
};

export const useChat = ({ user, otherUserId, onConnectionVerified }: UseChatParams) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const markMessagesAsRead = useCallback(async (messageIds: string[]) => {
    if (!user || messageIds.length === 0) return;
    await supabase.rpc('mark_messages_as_read', { message_ids: messageIds, user_id: user.id });
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const channelName = getCanonicalChannelName(user.id, otherUserId);
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } }
    });

    const handleNewMessage = (payload: any) => {
      const newMessage = payload.new as Message;
      if (newMessage.sender_id === otherUserId) {
        setMessages(prev => [...prev, newMessage]);
        markMessagesAsRead([newMessage.id]);
      }
    };

    const handleMessageUpdate = (payload: any) => {
      const updatedMessage = payload.new as Message;
      setMessages(prev =>
        prev.map(msg => (msg.id === updatedMessage.id ? updatedMessage : msg))
      );
    };

    const handleTypingEvent = ({ payload }: any) => {
      if (payload.senderId === otherUserId) {
        setIsOtherUserTyping(payload.isTyping);
      }
    };

    const initializeChat = async () => {
      setIsLoading(true);

      const { data: connection } = await supabase
        .from('unlocked_contacts')
        .select('id')
        .or(`and(client_id.eq.${user.id},provider_id.eq.${otherUserId}),and(client_id.eq.${otherUserId},provider_id.eq.${user.id})`)
        .eq('feedback_submitted_for_this_unlock', false)
        .limit(1)
        .single();

      if (!connection) {
        onConnectionVerified(false);
        setIsLoading(false);
        return;
      }
      onConnectionVerified(true);

      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order('timestamp', { ascending: true });

      if (error) {
        showError("Error al cargar los mensajes.");
      } else {
        setMessages(messagesData as Message[]);
        const unreadMessageIds = messagesData
          .filter(msg => msg.receiver_id === user.id && !msg.read_by?.includes(user.id))
          .map(msg => msg.id);
        markMessagesAsRead(unreadMessageIds);
      }
      setIsLoading(false);

      channel
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` }, handleNewMessage)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `sender_id=eq.${user.id}` }, handleMessageUpdate)
        .on('broadcast', { event: 'typing' }, handleTypingEvent)
        .subscribe();
    };

    initializeChat();

    return () => {
      supabase.removeChannel(channel);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [user, otherUserId, onConnectionVerified, markMessagesAsRead]);

  const handleTyping = (text: string) => {
    setNewMessage(text);
    if (!user) return;

    const channelName = getCanonicalChannelName(user.id, otherUserId);
    const channel = supabase.channel(channelName);

    if (text) {
      channel.track({ event: 'typing', payload: { isTyping: true, senderId: user.id } });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      channel.track({ event: 'typing', payload: { isTyping: false, senderId: user.id } });
    }, 2000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const optimisticMessage: Message = {
      id: crypto.randomUUID(),
      sender_id: user.id,
      receiver_id: otherUserId,
      text: newMessage.trim(),
      timestamp: new Date().toISOString(),
      read_by: [user.id],
    };
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    const channelName = getCanonicalChannelName(user.id, otherUserId);
    const channel = supabase.channel(channelName);
    channel?.track({ event: 'typing', payload: { isTyping: false, senderId: user.id } });

    const { error } = await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: otherUserId,
      text: newMessage.trim(),
      read_by: [user.id], // <-- This is the fix!
    });

    if (error) {
      showError("Error al enviar el mensaje.");
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
    }
  };

  return {
    messages,
    newMessage,
    isLoading,
    isOtherUserTyping,
    handleTyping,
    handleSendMessage,
  };
};