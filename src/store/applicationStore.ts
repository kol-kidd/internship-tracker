import { create } from "zustand";
import { supabase } from "@/config/supabaseClient";
import { api } from "@/lib/api";
import { useAuthStore } from "./authStore";

interface Application {
  id: number;
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

  fetchApplications: () => Promise<void>;
  addApplication: (data: Omit<Application, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateApplication: (id: number, data: Partial<Pick<Application, 'company_name' | 'company_address'>>) => Promise<void>;
  updateApplicationStatus: (id: number, status: string) => Promise<void>;
  deleteApplication: (id: number) => Promise<void>;
  subscribeApplications: (userId: string) => () => void;
  clearApplications: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  applications: [],
  loading: false,
  error: null,

  fetchApplications: async () => {
    const token = useAuthStore.getState().accessToken;
    if (!token) {
      set({ error: 'No authentication token' });
      return;
    }

    set({ loading: true, error: null });
    try {
      const response: any = await api.getApplications(token);
      set({ applications: response.applications ?? [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  addApplication: async (data) => {
    const token = useAuthStore.getState().accessToken;
    if (!token) {
      set({ error: 'No authentication token' });
      return;
    }

    set({ loading: true, error: null });
    try {
      await api.addApplication(token, data);
      // Optimistically update or refetch
      await get().fetchApplications();
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateApplication: async (id, data) => {
    const token = useAuthStore.getState().accessToken;
    if (!token) {
      set({ error: 'No authentication token' });
      return;
    }

    set({ loading: true, error: null });
    try {
      await api.updateApplication(token, id, data);
      await get().fetchApplications();
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateApplicationStatus: async (id, status) => {
    const token = useAuthStore.getState().accessToken;
    if (!token) {
      set({ error: 'No authentication token' });
      return;
    }

    set({ loading: true, error: null });
    try {
      await api.updateApplicationStatus(token, id, status);
      await get().fetchApplications();
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteApplication: async (id) => {
    const token = useAuthStore.getState().accessToken;
    if (!token) {
      set({ error: 'No authentication token' });
      return;
    }

    set({ loading: true, error: null });
    try {
      await api.deleteApplication(token, id);
      // Optimistic update
      set((state) => ({
        applications: state.applications.filter((app) => app.id !== id),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
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
        },
        (payload) => {
          console.log("Realtime event:", payload.eventType, payload);

          set((state) => {
            let apps = [...state.applications];
            if (payload.eventType === "INSERT") {
              apps.unshift(payload.new as Application);
            }
            if (payload.eventType === "UPDATE") {
              const index = apps.findIndex(
                (a) => a.id === (payload.new as Application).id
              );
              if (index !== -1) apps[index] = payload.new as Application;
            }
            if (payload.eventType === "DELETE") {
              const deletedId = (payload.old as any).id;
              apps = apps.filter((a) => a.id !== deletedId);
            }
            return { applications: apps };
          });
        }
      )
      .subscribe((status) => {
        console.log("Subscription status:", status);
      });

    return () => {
      console.log("Unsubscribing from realtime");
      supabase.removeChannel(channel);
    };
  },

  clearApplications: () => {
    set({ applications: [], loading: false, error: null });
  },
}));