"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@src/config/supabase";

// ---- Types ----
type ProfileData = {
  id: string;
  email: string;
  credits: number;
};

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  profile: ProfileData | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

// ---- Context ----
const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

// ---- Provider ----
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Lấy / tạo profile từ bảng `profiles` sau khi đăng nhập
  const fetchOrCreateProfile = useCallback(async (user: User) => {
    // Thử lấy profile đã tồn tại
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, credits")
      .eq("id", user.id)
      .single();

    if (data) {
      setProfile(data);
      return;
    }

    // New user: tạo profile mới với 100 credits mặc định
    if (error?.code === "PGRST116") {
      const { data: newProfile } = await supabase
        .from("profiles")
        .insert({ id: user.id, email: user.email ?? "", credits: 100 })
        .select("id, email, credits")
        .single();
      if (newProfile) setProfile(newProfile);
    }
  }, []);

  useEffect(() => {
    let profileSubscription: any = null;

    // Lấy session hiện tại khi app mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchOrCreateProfile(session.user);
        
        // Setup realtime subscription
        profileSubscription = supabase
          .channel(`public:profiles:id=eq.${session.user.id}`)
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "profiles",
              filter: `id=eq.${session.user.id}`,
            },
            (payload) => {
              setProfile(payload.new as ProfileData);
            }
          )
          .subscribe();
      }
      setLoading(false);
    });

    // Lắng nghe thay đổi Auth state (login / logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        
        // Cleanup old subscription
        if (profileSubscription) {
          supabase.removeChannel(profileSubscription);
          profileSubscription = null;
        }

        if (session?.user) {
          fetchOrCreateProfile(session.user);
          
          // Setup realtime subscription
          profileSubscription = supabase
            .channel(`public:profiles:id=eq.${session.user.id}`)
            .on(
              "postgres_changes",
              {
                event: "UPDATE",
                schema: "public",
                table: "profiles",
                filter: `id=eq.${session.user.id}`,
              },
              (payload) => {
                setProfile(payload.new as ProfileData);
              }
            )
            .subscribe();
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
      if (profileSubscription) supabase.removeChannel(profileSubscription);
    };
  }, [fetchOrCreateProfile]);

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        session,
        profile,
        loading,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
