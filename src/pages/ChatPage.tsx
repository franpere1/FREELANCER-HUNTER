import { useEffect, useState, useRef, useCallback } from 'react';
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
import { useChat } from '@/hooks/useChat';
import MessageStatus from '@/components/MessageStatus';

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
  const location = useLocation();
  const preloadedOtherUser = location.state?.otherUser;

  const [otherUser, setOtherUser] = useState<OtherUser | null>(preloadedOtherUser ? {
    id: preloadedOtherUser.id,
    name: preloadedOtherUser.name,
    profile_image: preloadedOtherUser.profile_image || null,
  } : null);
  
  const [isConnectionActive, setIsConnectionActive] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleConnectionVerified = useCallback((isVerified: boolean) => {
    setIsConnectionActive(isVerified);
    setIsVerifying(false);
    if (!isVerified) {
      showError("No tienes permiso para chatear con este usuario.");
      navigate('/dashboard');
    }
  }, [navigate]);

  const { messages, newMessage, isLoading: messagesLoading, isOtherUserTyping, handleTyping, handleSendMessage } = useChat({
    user,
    otherUserId: otherUserId!,
    onConnectionVerified: handleConnectionVerified,
  });

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (!preloadedOtherUser && otherUserId) {
      supabase.from('profiles').select('id, name, profile_image').eq('id', otherUserId).single()
        .then(({ data, error }) => {
          if (error) {
            showError("No se pudo cargar la información del otro usuario.");
            navigate(-1);
          } else {
            setOtherUser(data);
          }
        });
    }
  }, [preloadedOtherUser, otherUserId, navigate]);

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
                  {messages.map((msg) => {
                    const isSender = msg.sender_id === user?.id;
                    const isRead = msg.read_by ? msg.read_by.length > 1 : false;
                    return (
                      <div key={msg.id} className={cn("flex items-end gap-2", isSender ? "justify-end" : "justify-start")}>
                        {!isSender && (<Avatar className="h-8 w-8 self-end"><AvatarImage src={otherUser?.profile_image || undefined} /><AvatarFallback>{otherUser ? getInitials(otherUser.name) : '?'}</AvatarFallback></Avatar>)}
                        <div className={cn("max-w-xs rounded-lg px-3 py-2 text-sm md:max-w-md flex flex-col", isSender ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-900")}>
                          <p className="break-words">{msg.text}</p>
                          <div className="flex items-center gap-2 self-end mt-1">
                            <p className={cn("text-xs", isSender ? "text-blue-200" : "text-gray-500")}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            <MessageStatus isSender={isSender} isRead={isRead} />
                          </div>
                        </div>
                        {isSender && (<Avatar className="h-8 w-8 self-end"><AvatarImage src={profile?.profile_image || undefined} /><AvatarFallback>{profile ? getInitials(profile.name) : 'U'}</AvatarFallback></Avatar>)}
                      </div>
                    );
                  })}
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