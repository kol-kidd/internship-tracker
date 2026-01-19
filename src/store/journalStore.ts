import { create } from "zustand";
import { supabase } from "@/config/supabaseClient";
import { api } from "@/lib/api";
import { useAuthStore } from "./authStore";

interface JournalEntry {
  id: number;
  user_id: string;
  title: string;
  date: string;
  content: string;
  mood: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface JournalState {
  entries: JournalEntry[];
  loading: boolean;
  error: string | null;

  fetchEntries: (userId: string) => Promise<void>;
  addEntry: (
    userId: string,
    entry: Omit<JournalEntry, "id" | "user_id" | "created_at" | "updated_at">
  ) => Promise<{ error?: any }>;
  updateEntry: (
    userId: string,
    entryId: number,
    entry: Partial<Omit<JournalEntry, "id" | "user_id" | "created_at">>
  ) => Promise<{ error?: any }>;
  deleteEntry: (userId: string, entryId: number) => Promise<{ error?: any }>;
  subscribeEntries: (userId: string) => () => void;
  clearEntries: () => void;
}

export const useJournalStore = create<JournalState>((set, get) => ({
  entries: [],
  loading: false,
  error: null,

  fetchEntries: async (userId: string) => {
    const token = useAuthStore.getState().accessToken;
    if (!token) {
      set({ error: "No authentication token" });
      return;
    }

    set({ loading: true, error: null });
    try {
      const response: any = await api.getJournalEntries(token);
      set({ entries: response.entries ?? [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  addEntry: async (userId: string, entry) => {
    const token = useAuthStore.getState().accessToken;
    if (!token) {
      const error = new Error("No authentication token");
      set({ error: error.message });
      return { error };
    }

    set({ loading: true, error: null });
    try {
      await api.addJournalEntry(token, entry);
      await get().fetchEntries(userId);
      set({ loading: false });
      return {};
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return { error };
    }
  },

  updateEntry: async (userId: string, entryId: number, entry) => {
    const token = useAuthStore.getState().accessToken;
    if (!token) {
      const error = new Error("No authentication token");
      set({ error: error.message });
      return { error };
    }

    set({ loading: true, error: null });
    try {
      await api.updateJournalEntry(token, entryId, entry);
      await get().fetchEntries(userId);
      set({ loading: false });
      return {};
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return { error };
    }
  },

  deleteEntry: async (userId: string, entryId: number) => {
    const token = useAuthStore.getState().accessToken;
    if (!token) {
      const error = new Error("No authentication token");
      set({ error: error.message });
      return { error };
    }

    set({ loading: true, error: null });
    try {
      await api.deleteJournalEntry(token, entryId);
      // Optimistic update
      set((state) => ({
        entries: state.entries.filter((e) => e.id !== entryId),
        loading: false,
      }));
      return {};
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return { error };
    }
  },

  subscribeEntries: (userId: string) => {
    console.log("Realtime subscription started for user:", userId);
    const channel = supabase
      .channel(`journal_entries:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "journal_entries",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("Realtime event:", payload.eventType, payload);

          set((state) => {
            let entries = [...state.entries];
            if (payload.eventType === "INSERT") {
              entries.unshift(payload.new as JournalEntry);
            }
            if (payload.eventType === "UPDATE") {
              const index = entries.findIndex(
                (e) => e.id === (payload.new as JournalEntry).id
              );
              if (index !== -1) entries[index] = payload.new as JournalEntry;
            }
            if (payload.eventType === "DELETE") {
              const deletedId = (payload.old as any).id;
              entries = entries.filter((e) => e.id !== deletedId);
            }
            return { entries };
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

  clearEntries: () => {
    set({ entries: [], loading: false, error: null });
  },
}));