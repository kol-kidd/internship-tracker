import { create } from "zustand";
import axios from "axios";
import { supabase } from "@/config/supabaseClient";
import { io, Socket } from "socket.io-client";

interface JournalEntry {
  id: number;
  user_id: string;
  application_id: number | null;
  title: string;
  date: string;
  content: string;
  mood: string;
  tags: string[];
  time_in: string | null;
  time_out: string | null;
  break_time: number | null;
  created_at: string;
  updated_at: string;
}

interface JournalState {
  entries: JournalEntry[];
  loading: boolean;
  error: string | null;
  socket: Socket | null;
  lastModified?: string;

  initSocket: () => void;
  fetchEntries: () => Promise<void>;
  addEntry: (entry: Omit<JournalEntry, "id" | "user_id" | "created_at" | "updated_at">) => Promise<JournalEntry>;
  updateEntry: (entryId: number, entry: Partial<Omit<JournalEntry, "id" | "user_id" | "created_at">>) => Promise<void>;
  bulkAssignEntries: (entryIds: number[], applicationId: number | null) => Promise<void>;
  deleteEntry: (entryId: number) => Promise<void>;
  clearEntries: () => void;
}

type ApiErrorResponse = {
  error?: string;
};

function getApiErrorMessage(error: unknown, fallback = "Request failed") {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.error ?? error.message ?? fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const token = session?.access_token;
  if (token && config.headers) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }

  return config;
});

export const useJournalStore = create<JournalState>((set, get) => ({
  entries: [],
  loading: false,
  error: null,
  socket: null,
  lastModified: undefined,

  initSocket: async () => {
    if (get().socket) return;

    const socket = io(import.meta.env.VITE_API_URL as string, {
      auth: async (cb) => {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        cb({ token: session?.access_token });
      },
    });

    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    if (userId) {
      socket.emit("join-room", userId);
    }

    socket.on("journal-entry-added", (entry: JournalEntry) => {
      set((state) => ({
        entries: [entry, ...state.entries],
      }));
    });

    socket.on("journal-entry-updated", (entry: JournalEntry) => {
      set((state) => ({
        entries: state.entries.map((e) =>
          e.id === entry.id ? entry : e
        ),
      }));
    });

    socket.on("journal-entry-deleted", (deletedEntry: JournalEntry) => {
      set((state) => ({
        entries: state.entries.filter((e) => e.id !== deletedEntry.id),
      }));
    });

    // Server signals that the user just crossed their required-hours goal.
    // Decoupled via a window event so Layout can fire confetti + certificate
    // without the journal store importing UI concerns.
    socket.on("hours-completed", (payload: { hours_completed_at: string }) => {
      window.dispatchEvent(
        new CustomEvent("internpal:hours-completed", { detail: payload }),
      );
    });

    set({ socket });
  },

  fetchEntries: async () => {
    set({ loading: true, error: null });
    try {
      const lastMod = get().lastModified ?? null;
      const res = await api.get("/journal", {
        headers: lastMod ? { "If-Modified-Since": lastMod } : {},
        validateStatus: (status) => (status >= 200 && status < 300) || status === 304,
      });
      if (res.status === 304) {
        set({ loading: false });
        return;
      }
      const newLastMod = res.headers["last-modified"];
      set({
        entries: res.data.entries,
        loading: false,
        lastModified: newLastMod ?? undefined,
      });
    } catch (err: unknown) {
      set({
        error: getApiErrorMessage(err, "Failed to fetch entries"),
        loading: false,
      });
      throw err;
    }
  },

  addEntry: async (entry) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post("/journal", entry);
      const created = res.data.entry as JournalEntry;
      set((state) => ({
        entries: [created, ...state.entries],
        loading: false,
      }));
      return created;
    } catch (err: unknown) {
      set({ error: getApiErrorMessage(err), loading: false });
      throw err;
    }
  },

  updateEntry: async (entryId, entry) => {
    set({ loading: true, error: null });
    try {
      const res = await api.put(`/journal/${entryId}`, entry);
      set((state) => ({
        entries: state.entries.map((e) =>
          e.id === entryId ? res.data.entry : e
        ),
        loading: false,
      }));
    } catch (err: unknown) {
      set({ error: getApiErrorMessage(err), loading: false });
      throw err;
    }
  },

  bulkAssignEntries: async (entryIds, applicationId) => {
    if (entryIds.length === 0) return;

    set({ loading: true, error: null });
    try {
      const res = await api.patch("/journal/bulk-assign", {
        entryIds,
        application_id: applicationId,
      });
      const updatedEntries = (res.data.entries ?? []) as JournalEntry[];
      const updatedById = new Map(
        updatedEntries.map((entry) => [entry.id, entry]),
      );
      const latestUpdatedAt = updatedEntries.reduce<string | undefined>(
        (latest, entry) =>
          !latest || entry.updated_at > latest ? entry.updated_at : latest,
        undefined,
      );

      set((state) => ({
        entries: state.entries.map((entry) =>
          updatedById.get(entry.id) ?? entry
        ),
        loading: false,
        lastModified: latestUpdatedAt ?? state.lastModified,
      }));
    } catch (err: unknown) {
      set({ error: getApiErrorMessage(err), loading: false });
      throw err;
    }
  },

  deleteEntry: async (entryId) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/journal/${entryId}`);
      set((state) => ({
        entries: state.entries.filter((e) => e.id !== entryId),
        loading: false,
      }));
    } catch (err: unknown) {
      set({ error: getApiErrorMessage(err), loading: false });
      throw err;
    }
  },

  clearEntries: () => {
    set({
      entries: [],
      loading: false,
      error: null,
      socket: null,
      lastModified: undefined,
    });
  },
}));
