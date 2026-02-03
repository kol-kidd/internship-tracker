import { create } from "zustand";
import axios from "axios";
import { supabase } from "@/config/supabaseClient";

export interface JournalNote {
  id: number;
  user_id: string;
  content: string;
  date: string;
  time: string | null;
  created_at: string;
  updated_at: string;
}

interface NotesState {
  notes: JournalNote[];
  loading: boolean;
  error: string | null;
  lastModified?: string;

  fetchNotes: () => Promise<void>;
  addNote: (payload: {
    content: string;
    date?: string;
    time?: string;
  }) => Promise<JournalNote>;
  updateNote: (
    noteId: number,
    payload: { content?: string; date?: string; time?: string }
  ) => Promise<void>;
  deleteNote: (noteId: number) => Promise<void>;
  mergeNotes: (payload: {
    noteIds: number[];
    title?: string;
    date?: string;
    deleteNotesAfterMerge?: boolean;
  }) => Promise<{ entryId: number }>;
  clearNotes: () => void;
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

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  loading: false,
  error: null,
  lastModified: undefined,

  fetchNotes: async () => {
    set({ loading: true, error: null });
    try {
      const lastMod = get().lastModified ?? null;
      const res = await api.get<{ notes: JournalNote[] }>("/journal/notes", {
        headers: lastMod ? { "If-Modified-Since": lastMod } : {},
        validateStatus: (status) =>
          (status >= 200 && status < 300) || status === 304,
      });
      if (res.status === 304) {
        set({ loading: false });
        return;
      }
      const newLastMod = res.headers["last-modified"];
      set({
        notes: res.data.notes,
        loading: false,
        lastModified: newLastMod ?? undefined,
      });
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data
              ?.error
          : "Failed to fetch notes";
      set({ error: message || "Failed to fetch notes", loading: false });
      throw err;
    }
  },

  addNote: async (payload) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post<{ note: JournalNote }>("/journal/notes", {
        content: payload.content,
        date: payload.date,
        time: payload.time?.trim() || undefined,
      });
      const note = res.data.note;
      set((state) => ({
        notes: [note, ...state.notes],
        loading: false,
      }));
      return note;
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data
              ?.error
          : "Failed to add note";
      set({ error: message || "Failed to add note", loading: false });
      throw err;
    }
  },

  updateNote: async (noteId, payload) => {
    set({ loading: true, error: null });
    try {
      const body: { content?: string; date?: string; time?: string } = {};
      if (payload.content !== undefined) body.content = payload.content;
      if (payload.date !== undefined) body.date = payload.date;
      if (payload.time !== undefined) body.time = payload.time;
      const res = await api.put<{ note: JournalNote }>(
        `/journal/notes/${noteId}`,
        body
      );
      const updated = res.data.note;
      set((state) => ({
        notes: state.notes.map((n) => (n.id === noteId ? updated : n)),
        loading: false,
      }));
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data
              ?.error
          : "Failed to update note";
      set({ error: message || "Failed to update note", loading: false });
      throw err;
    }
  },

  deleteNote: async (noteId) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/journal/notes/${noteId}`);
      set((state) => ({
        notes: state.notes.filter((n) => n.id !== noteId),
        loading: false,
      }));
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data
              ?.error
          : "Failed to delete note";
      set({ error: message || "Failed to delete note", loading: false });
      throw err;
    }
  },

  mergeNotes: async (payload) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post<{ entry: { id: number } }>(
        "/journal/notes/merge",
        payload
      );
      set({ loading: false });
      return { entryId: res.data.entry.id };
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data
              ?.error
          : "Failed to merge notes";
      set({ error: message || "Failed to merge notes", loading: false });
      throw err;
    }
  },

  clearNotes: () =>
    set({ notes: [], loading: false, error: null, lastModified: undefined }),
}));
