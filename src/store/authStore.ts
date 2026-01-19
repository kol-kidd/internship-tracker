import { create } from "zustand";
import { supabase } from "@/config/supabaseClient";
import type { User, Session } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  accessToken: string | null;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setSession: (session: Session | null) => void;
  setAccessToken: (token: string | null) => void;
  initAuth: () => () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  accessToken: null,
  loading: true,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session, accessToken: session?.access_token ?? null }),
  setAccessToken: (accessToken) => set({ accessToken }),
  setLoading: (loading) => set({ loading }),
  initAuth: () => {
    set({ loading: true });

    supabase.auth.getSession().then(({ data }) => {
      set({
        session: data.session,
        user: data.session?.user ?? null,
        accessToken: data.session?.access_token ?? null,
        loading: false,
      });
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      set({
        session,
        user: session?.user ?? null,
        accessToken: session?.access_token ?? null,
        loading: false,
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  },
}));