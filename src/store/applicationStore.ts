import { create } from "zustand";
import { supabase } from "@/config/supabaseClient";

interface Application {
  id: string;
  user_id: string;
  company_name: string;
  company_address: string;
  date_applied: string;
  status: string;
  created_at: string;
}

interface AppState {
  applications: Application[];
  loading: boolean;
  error: string | null;

  fetchApplications: (userId: string) => Promise<void>;
  subscribeApplications: (userId: string) => () => void;
  clearApplications: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  applications: [],
  loading: false,
  error: null,

  fetchApplications: async (userId: string) => {
    set({ loading: true });
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      set({ error: error.message, loading: false });
      return;
    }

    set({ applications: data ?? [], loading: false });
  },

  subscribeApplications: (userId: string) => {
    console.log("Realtime subscription started for user:", userId);
    const channel = supabase
      .channel(`applications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "applications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("Realtime event:", payload.eventType, payload);
          set((state) => {
            let apps = [...state.applications];
            if (payload.eventType === "INSERT") {
              apps.unshift(payload.new as Application);
            }
            if (payload.eventType === "UPDATE") {
              const index = apps.findIndex((a) => a.id === (payload.new as Application).id);
              if (index !== -1) apps[index] = payload.new as Application;
            }
            if (payload.eventType === "DELETE") {
              apps = apps.filter((a) => a.id !== (payload.old as any).id);
            }
            return { applications: apps };
          });
        }
      )
      .subscribe();

    return () => {
      console.log("Unsubscribing from realtime");
      supabase.removeChannel(channel);
    };
  },

  clearApplications: () => {
    set({ applications: [], loading: false, error: null });
  },
}));