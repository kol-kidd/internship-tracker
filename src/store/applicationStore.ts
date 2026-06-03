import { create } from "zustand";
import axios from "axios";
import { supabase } from "@/config/supabaseClient";
import { io, Socket } from "socket.io-client";

export interface Application {
  id: number;
  user_id: string;
  company_name: string;
  company_address: string;
  date_applied: string;
  status: string;
  created_at: string;
  position?: string;
  notes?: string;
  stipend?: "paid" | "unpaid";
  start_date?: string;
}

// Separate interface for API updates (camelCase)
interface UpdateApplicationData {
  companyName?: string;
  companyAddress?: string;
  position?: string;
  stipend?: "paid" | "unpaid" | "";
}

interface AppState {
  applications: Application[];
  loading: boolean;
  error: string | null;
  socket: Socket | null;
  hasFetched: boolean;
  lastFetchedAt: number | null;

  initSocket: () => void;

  fetchApplications: (options?: { force?: boolean; showLoading?: boolean }) => Promise<void>;
  addApplication: (data: {
    companyName: string;
    companyAddress: string;
    position?: string;
    stipend?: "paid" | "unpaid" | "";
    status?: string;
    dateApplied?: string;
  }) => Promise<void>;
  updateApplication: (id: number, data: UpdateApplicationData) => Promise<void>;
  updateApplicationStatus: (id: number, status: string) => Promise<void>;
  deleteApplication: (id: number) => Promise<void>;
  clearApplications: () => void;
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

const APPLICATION_CACHE_MS = 5 * 60 * 1000;

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


export const useAppStore = create<AppState>((set, get) => ({
  applications: [],
  loading: false,
  error: null,
  socket: null, 
  hasFetched: false,
  lastFetchedAt: null,

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

    socket.on("application-added", (app: Application) => {
      set((state) => ({
        applications: [app, ...state.applications],
        hasFetched: true,
        lastFetchedAt: Date.now(),
      }));
    });

    socket.on("application-updated", (app: Application) => {
      set((state) => ({
        applications: state.applications.map((a) =>
          a.id === app.id ? app : a
        ),
        hasFetched: true,
        lastFetchedAt: Date.now(),
      }));
    });

    socket.on("application-status-updated", (app: Application) => {
      set((state) => ({
        applications: state.applications.map((a) =>
          a.id === app.id ? app : a
        ),
        hasFetched: true,
        lastFetchedAt: Date.now(),
      }));
    });

    socket.on("application-deleted", (id: number) => {
      set((state) => ({
        applications: state.applications.filter((a) => a.id !== id),
        hasFetched: true,
        lastFetchedAt: Date.now(),
      }));
    });

    set({ socket });
  },

  // Fetch all applications
  fetchApplications: async (options = {}) => {
    const state = get();
    const cacheIsFresh =
      state.hasFetched &&
      state.lastFetchedAt != null &&
      Date.now() - state.lastFetchedAt < APPLICATION_CACHE_MS;

    if (!options.force && cacheIsFresh) return;

    set({
      loading: options.showLoading ?? state.applications.length === 0,
      error: null,
    });
    try {
      const res = await api.get("/applications");
      set({
        applications: res.data.applications,
        loading: false,
        hasFetched: true,
        lastFetchedAt: Date.now(),
      });
    } catch (err: unknown) {
      set({ error: getApiErrorMessage(err), loading: false });
    }
  },

  // Add a new application
  addApplication: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post("/applications", data);
      set((state) => ({
        applications: [res.data.application, ...state.applications],
        loading: false,
        hasFetched: true,
        lastFetchedAt: Date.now(),
      }));
    } catch (err: unknown) {
      set({ error: getApiErrorMessage(err), loading: false });
    }
  },

  // Update an application
  updateApplication: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const res = await api.put(`/applications/${id}`, data);
      set((state) => ({
        applications: state.applications.map((a) =>
          a.id === id ? res.data.application : a
        ),
        loading: false,
        hasFetched: true,
        lastFetchedAt: Date.now(),
      }));
    } catch (err: unknown) {
      set({ error: getApiErrorMessage(err), loading: false });
    }
  },

  // Update status only
  updateApplicationStatus: async (id, status) => {
    set({ loading: true, error: null });
    try {
      const res = await api.patch(`/applications/${id}/status`, { status });
      
      set((state) => ({
        applications: state.applications.map((a) =>
          a.id === id ? res.data.application : a
        ),
        loading: false,
        hasFetched: true,
        lastFetchedAt: Date.now(),
      }));
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      set({ error: message, loading: false });
      console.log("Error updating status:", message);
    }
  },

  // Delete application
  deleteApplication: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/applications/${id}`);
      set((state) => ({
        applications: state.applications.filter((a) => a.id !== id),
        loading: false,
        hasFetched: true,
        lastFetchedAt: Date.now(),
      }));
    } catch (err: unknown) {
      set({ error: getApiErrorMessage(err), loading: false });
    }
  },

  // Clear all applications
  clearApplications: () => {
    set({
      applications: [],
      loading: false,
      error: null,
      hasFetched: false,
      lastFetchedAt: null,
    });
  },
}));
