import { create } from "zustand";
import { supabase } from "@/config/supabaseClient";
import type { User, Session } from "@supabase/supabase-js";

interface Application {
  id: string;
  user_id: string;
  company_name: string,
  company_address: string,
  date_applied: string,
  status: string;
  created_at: string;
}

interface AppState {
  user: User | null;
  session: Session | null;
  applications: Application[];
  loading: boolean;
  error: string | null;

  initApp: () => Promise<() => void>;
  fetchApplications: (userId: string) => Promise<void>;
  subscribeApplications: (userId: string) => () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  session: null,
  applications: [],
  loading: false,
  error: null,

  initApp: async () => {
    set({ loading: true, error: null });

    const { data } = await supabase.auth.getSession();

    if (!data.session) {
      set({
        user: null,
        session: null,
        applications: [],
        loading: false,
      });
      return () => {};
    }

    const user = data.session.user;

    set({
      user,
      session: data.session,
    });

    // Initial fetch
    await get().fetchApplications(user.id);

    // Realtime subscription
    const unsubscribe = get().subscribeApplications(user.id);

    set({ loading: false });

    return unsubscribe;
  },

  fetchApplications: async (userId: string) => {
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      set({ error: error.message });
      return;
    }

    set({ applications: data ?? [] });
  },

 subscribeApplications: (userId: string) => {
  console.log("Realtime subscription started for user:", userId);

  const channel = supabase
    .channel(`applications:${userId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "applications", filter: `user_id=eq.${userId}` },
      (payload) => {
        console.log("Realtime event:", payload.eventType, payload.new);
        set((state) => {
          let apps = [...state.applications];
          if (payload.eventType === "INSERT") apps.unshift(payload.new as Application); 
          if (payload.eventType === "UPDATE") {
            const index = apps.findIndex((a) => a.id === payload.new.id);
            if (index !== -1) apps[index] = payload.new as Application;
          }
          if (payload.eventType === "DELETE") apps = apps.filter((a) => a.id !== payload.old.id);
          return { applications: apps };
        });
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
},

}));
