import { createContext, useState, useEffect, useContext, ReactNode, useCallback, useMemo } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess } from '@/utils/toast';

interface Profile {
  id: string;
  name: string;
  email: string;
  state: string;
  phone: string;
  type: 'client' | 'provider';
  category: string | null;
  skill: string | null;
  service_description: string | null;
  profile_image: string | null;
  star_rating: number | null;
  service_image: string | null;
  rate: number | null;
  token_balance: number | null;
  feedback: any[] | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      setProfile(null);
    } else {
      setProfile(data as Profile);
    }
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    // Manually clear session to ensure immediate UI update and prevent flicker
    setSession(null);
    setUser(null);
    setProfile(null);
  }, []);

  // Effect for handling auth state changes
  useEffect(() => {
    setLoading(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Effect for fetching profile and subscribing to realtime updates
  useEffect(() => {
    if (user) {
      fetchProfile(user.id);

      const profileChannel = supabase
        .channel(`public:profiles:id=eq.${user.id}`)
        .on<Profile>(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`,
          },
          (payload) => {
            setProfile((currentProfile) => {
              const oldFeedbackCount = currentProfile?.feedback?.length ?? 0;
              const newFeedbackCount = (payload.new.feedback as any[])?.length ?? 0;

              if (newFeedbackCount > oldFeedbackCount) {
                  showSuccess('¡Has recibido un nuevo comentario!');
              }
              
              if (currentProfile) {
                return { ...currentProfile, ...payload.new };
              }
              return payload.new as Profile;
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(profileChannel);
      };
    } else {
      setProfile(null);
    }
  }, [user, fetchProfile]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  const value = useMemo(() => ({ session, user, profile, loading, refreshProfile, logout }), [session, user, profile, loading, refreshProfile, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};