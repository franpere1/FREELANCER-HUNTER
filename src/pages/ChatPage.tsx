import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  text: string;
  timestamp: string;
}

interface OtherUser {
  id: string;
  name: string;
  profile_image: string | null;
}

const getInitials = (name: string) => name ? name.split(' ').map((n) => n[0]).join('') : '';

const ChatPage = () => {
  const { otherUserId } = useParams<{ otherUserId: string }>();
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [loading, setLoading] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchOtherUser = async () => {
      if (!otherUserId) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, profile_image')
        .eq('id', otherUserId)
        .single();
      
      if (error) {
        console.error("Error fetching other user:", error);
      } else {
        setOtherUser(data);
      }
    };
    fetchOtherUser();
  }, [otherUserId]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight });
    }
  }, [messages]);

  useEffect(() => {
    if (!user || !otherUserId) return;

    const fetchMessages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
      } else {
        setMessages(data as Message[]);
      }
      setLoading(false);
    };

    fetchMessages();

    const channel = supabase
      .channel(`chat:${user.id}:${otherUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          setMessages((prevMessages) => [...prevMessages, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, otherUserId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !otherUserId) return;

    const messageToSend = {
      sender_id: user.id,
      receiver_id: otherUserId,
      text: newMessage.trim(),
    };

    const { error } = await supabase.from('messages').insert(messageToSend);

    if (error) {
      console.error("Error sending message:", error);
    } else {
      // Optimistically update UI
      setMessages(prev => [...prev, { ...messageToSend, id: crypto.randomUUID(), timestamp: new Date().toISOString() }]);
      setNewMessage('');
    }
  };

  if (authLoading || loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando chat...</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto p-4 flex-grow">
        <Card className="h-full flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between border-b">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Avatar>
                <AvatarImage src={otherUser?.profile_image || undefined} />
                <AvatarFallback>{otherUser ? getInitials(otherUser.name) : '?'}</AvatarFallback>
              </Avatar>
              <CardTitle>{otherUser?.name || 'Chat'}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-grow p-0">
            <ScrollArea className="h-[calc(100vh-250px)] p-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex items-end gap-2",
                      msg.sender_id === user?.id ? "justify-end" : "justify-start"
                    )}
                  >
                    {msg.sender_id !== user?.id && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={otherUser?.profile_image || undefined} />
                        <AvatarFallback>{otherUser ? getInitials(otherUser.name) : '?'}</AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        "max-w-xs rounded-lg px-4 py-2 text-sm md:max-w-md",
                        msg.sender_id === user?.id
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-900"
                      )}
                    >
                      <p>{msg.text}</p>
                      <p className={cn("text-xs mt-1", msg.sender_id === user?.id ? "text-blue-200" : "text-gray-500")}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                     {msg.sender_id === user?.id && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile?.profile_image || undefined} />
                        <AvatarFallback>{profile ? getInitials(profile.name) : 'U'}</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="border-t pt-4">
            <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
                autoComplete="off"
              />
              <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                <Send className="h-4 w-4" />
                <span className="sr-only">Enviar</span>
              </Button>
            </form>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
};

export default ChatPage;