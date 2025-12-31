import { create } from "zustand";
import { supabase } from "@/config/supabaseClient";

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
  subscribeEntries: (userId: string) => () => void;
  addEntry: (userId: string, entry: Omit<JournalEntry, "id" | "user_id" | "created_at" | "updated_at">) => Promise<{ error: any }>;
  updateEntry: (userId: string, entryId: number, entry: Partial<Omit<JournalEntry, "id" | "user_id" | "created_at">>) => Promise<{ error: any }>;
  deleteEntry: (userId: string, entryId: number) => Promise<{ error: any }>;
  clearEntries: () => void;
}

export const useJournalStore = create<JournalState>((set, get) => ({
  entries: [],
  loading: false,
  error: null,

  fetchEntries: async (userId: string) => {
    set({ loading: true });
    const { data, error } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false });

    if (error) {
      set({ error: error.message, loading: false });
      return;
    }

    set({ entries: data ?? [], loading: false });
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
              console.log("DELETE event - old.id:", (payload.old as any).id);
              const deletedId = (payload.old as any).id;
              entries = entries.filter((e) => e.id !== deletedId);
              console.log("Entries after delete:", entries.length);
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

  addEntry: async (userId: string, entry) => {
    const { error } = await supabase.from("journal_entries").insert({
      user_id: userId,
      ...entry,
    });

    if (error) {
      set({ error: error.message });
      return { error };
    }

    return { error: null };
  },

  updateEntry: async (userId: string, entryId: number, entry) => {
    const { error } = await supabase
      .from("journal_entries")
      .update({
        ...entry,
        updated_at: new Date().toISOString(),
      })
      .eq("id", entryId)
      .eq("user_id", userId);

    if (error) {
      set({ error: error.message });
      return { error };
    }

    return { error: null };
  },

  deleteEntry: async (userId: string, entryId: number) => {
    const { error } = await supabase
      .from("journal_entries")
      .delete()
      .eq("id", entryId)
      .eq("user_id", userId);

    if (error) {
      set({ error: error.message });
      return { error };
    }

    return { error: null };
  },

  clearEntries: () => {
    set({ entries: [], loading: false, error: null });
  },
}));