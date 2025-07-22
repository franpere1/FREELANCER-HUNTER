import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Send, ShieldAlert, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { showError } from '@/utils/toast';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  text: string;
  timestamp: string;
  read_by: string[] | null;
}

interface OtherUser {
  id: string;
  name: string;
  profile_image: string | null;
}

const getInitials = (name: string) => name ? name.split(' ').map((n) => n[0]).join('') : '';

const ChatPage = () => {
  const { otherUserId } = useParams<{ otherUserId: string }>();
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const preloadedOtherUser = location.state?.otherUser;

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState<OtherUser | null>(preloadedOtherUser ? {
    id: preloadedOtherUser.id,
    name: preloadedOtherUser.name,
    profile_image: preloadedOtherUser.profile_image || null,
  } : null);
  
  const [isVerifying, setIsVerifying] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [isConnectionActive, setIsConnectionActive] = useState(false);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight });
    }
  }, [messages]);

  useEffect(() => {
    if (authLoading || !user || !otherUserId) return;

    const initializeChat = async () => {
      setIsVerifying(true);
      setMessagesLoading(true);

      const { data: connection, error: connectionError } = await supabase
        .from('unlocked_contacts')
        .select('id')
        .or(`and(client_id.eq.${user.id},provider_id.eq.${otherUserId}),and(client_id.eq.${otherUserId},provider_id.eq.${user.id})`)
        .eq('feedback_submitted_for_this_unlock', false)
        .limit(1)
        .single();

      if (connectionError || !connection) {
        showError("No tienes permiso para chatear con este usuario. El contacto debe ser desbloqueado primero.");
        navigate('/dashboard');
        setIsVerifying(false);
        return;
      }
      
      setIsConnectionActive(true);
      setIsVerifying(false);

      const [otherUserResult, messagesResult] = await Promise.all([
        supabase.from('profiles').select('id, name, profile_image').eq('id', otherUserId).single(),
        supabase.from('messages').select('*').or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`).order('timestamp', { ascending: true })
      ]);

      const { data: otherUserData, error: otherUserError } = otherUserResult;
      if (otherUserError && !preloadedOtherUser) {
        showError("No se pudo cargar la información del otro usuario.");
        navigate(-1);
      } else if (otherUserData) {
        setOtherUser(otherUserData);
      }

      const { data: messagesData, error: messagesError } = messagesResult;
      if (messagesError) {
        console.error("Error fetching messages:", messagesError);
      } else {
        setMessages(messagesData as Message[]);
        const unreadMessageIds = messagesData
          .filter(msg => msg.receiver_id === user.id && !msg.read_by?.includes(user.id))
          .map(msg => msg.id);

        if (unreadMessageIds.length > 0) {
          supabase.rpc('mark_messages_as_read', { message_ids: unreadMessageIds, user_id: user.id })
            .then(({ error }) => {
              if (error) console.error("Error marking messages as read:", error);
              else refreshProfile();
            });
        }
      }
      setMessagesLoading(false);
    };

    initializeChat();

    const channel = supabase
      .channel(`chat:${user?.id}:${otherUserId}`, {
        config: { broadcast: { self: false } }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user?.id}` },
        (payload) => {
          if (payload.new.sender_id === otherUserId) {
            setMessages((prevMessages) => [...prevMessages, payload.new as Message]);
            supabase.rpc('mark_messages_as_read', { message_ids: [payload.new.id], user_id: user.id })
              .then(({ error }) => { if (error) console.error("Error marking new message as read:", error); });
          }
        }
      )
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        setIsOtherUserTyping(payload.isTyping);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, otherUserId, authLoading, navigate, refreshProfile]);

  const handleTyping = (text: string) => {
    setNewMessage(text);
    const channel = supabase.channel(`chat:${user?.id}:${otherUserId}`);
    if (!channel) return;

    if (text) {
      channel.track({ event: 'typing', payload: { isTyping: true } });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      channel.track({ event: 'typing', payload: { isTyping: false } });
    }, 2000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !otherUserId) return;

    const messageToSend = { sender_id: user.id, receiver_id: otherUserId, text: newMessage.trim() };
    const optimisticMessage: Message = { ...messageToSend, id: crypto.randomUUID(), timestamp: new Date().toISOString(), read_by: [user.id] };
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    const channel = supabase.channel(`chat:${user?.id}:${otherUserId}`);
    channel?.track({ event: 'typing', payload: { isTyping: false } });

    const { error } = await supabase.from('messages').insert(messageToSend);
    if (error) {
      console.error("Error sending message:", error);
      showError("Error al enviar el mensaje.");
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
    }
  };

  if (authLoading || isVerifying) {
    return <div className="flex items-center justify-center min-h-screen">Verificando conexión...</div>;
  }

  if (!isConnectionActive) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center p-4">
        <Card className="max-w-md">
          <CardHeader className="flex flex-row items-center justify-center space-x-2"><ShieldAlert className="h-6 w-6 text-red-500" /><CardTitle>Acceso Denegado</CardTitle></CardHeader>
          <CardContent className="space-y-4"><p>No tienes permiso para acceder a este chat.</p><Button onClick={() => navigate('/dashboard')}>Volver al Dashboard</Button></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto p-4 flex-grow">
        <Card className="h-full flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between border-b">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
              <Avatar><AvatarImage src={otherUser?.profile_image || undefined} /><AvatarFallback>{otherUser ? getInitials(otherUser.name) : '?'}</AvatarFallback></Avatar>
              <div>
                <CardTitle>{otherUser?.name || 'Chat'}</CardTitle>
                {isOtherUserTyping && (
                  <p className="text-sm text-green-500 animate-pulse h-5">escribiendo...</p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-grow p-0">
            <ScrollArea className="h-[calc(100vh-250px)]" ref={scrollAreaRef}>
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
              ) : (
                <div className="space-y-4 p-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className={cn("flex items-end gap-2", msg.sender_id === user?.id ? "justify-end" : "justify-start")}>
                      {msg.sender_id !== user?.id && (<Avatar className="h-8 w-8"><AvatarImage src={otherUser?.profile_image || undefined} /><AvatarFallback>{otherUser ? getInitials(otherUser.name) : '?'}</AvatarFallback></Avatar>)}
                      <div className={cn("max-w-xs rounded-lg px-4 py-2 text-sm md:max-w-md", msg.sender_id === user?.id ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-900")}>
                        <p>{msg.text}</p>
                        <p className={cn("text-xs mt-1", msg.sender_id === user?.id ? "text-blue-200" : "text-gray-500")}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      {msg.sender_id === user?.id && (<Avatar className="h-8 w-8"><AvatarImage src={profile?.profile_image || undefined} /><AvatarFallback>{profile ? getInitials(profile.name) : 'U'}</AvatarFallback></Avatar>)}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
          <CardFooter className="border-t pt-4">
            <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
              <Input value={newMessage} onChange={(e) => handleTyping(e.target.value)} placeholder="Escribe un mensaje..." autoComplete="off" />
              <Button type="submit" size="icon" disabled={!newMessage.trim()}><Send className="h-4 w-4" /><span className="sr-only">Enviar</span></Button>
            </form>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
};

export default ChatPage;