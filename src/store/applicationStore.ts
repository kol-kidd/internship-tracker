import { create } from "zustand";
import { supabase } from "@/config/supabaseClient";
import { io, Socket } from "socket.io-client";
import { api, getApiErrorMessage } from "@/functions/data/apiClient";

export type ApplicationPriority = "low" | "normal" | "high";

export interface Application {
  id: number;
  user_id: string;
  company_name: string;
  company_address: string;
  date_applied: string;
  status: string;
  created_at: string;
  updated_at?: string;
  position?: string | null;
  notes?: string | null;
  stipend?: "paid" | "unpaid" | null;
  application_url?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  deadline_date?: string | null;
  interview_date?: string | null;
  follow_up_date?: string | null;
  priority?: ApplicationPriority;
  start_date?: string | null;
  end_date?: string | null;
  supervisor_name?: string | null;
  supervisor_email?: string | null;
  department?: string | null;
  checklist_seeded_at?: string | null;
}

export interface ApplicationChecklistItem {
  id: number;
  user_id: string;
  application_id: number;
  label: string;
  completed: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ApplicationPayload {
  companyName?: string;
  companyAddress?: string;
  position?: string;
  stipend?: "paid" | "unpaid" | "";
  applicationUrl?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  deadlineDate?: string | null;
  interviewDate?: string | null;
  followUpDate?: string | null;
  priority?: ApplicationPriority;
  startDate?: string | null;
  endDate?: string | null;
  supervisorName?: string | null;
  supervisorEmail?: string | null;
  department?: string | null;
}

interface AppState {
  applications: Application[];
  loading: boolean;
  error: string | null;
  socket: Socket | null;
  hasFetched: boolean;
  lastFetchedAt: number | null;
  checklistsByApplicationId: Record<number, ApplicationChecklistItem[]>;
  checklistLoadingByApplicationId: Record<number, boolean>;

  initSocket: () => void;

  fetchApplications: (options?: { force?: boolean; showLoading?: boolean }) => Promise<void>;
  addApplication: (data: ApplicationPayload & {
    companyName: string;
    companyAddress: string;
    status?: string;
    dateApplied?: string;
  }) => Promise<void>;
  updateApplication: (id: number, data: ApplicationPayload) => Promise<void>;
  updateApplicationStatus: (id: number, status: string) => Promise<void>;
  deleteApplication: (id: number) => Promise<void>;
  fetchChecklist: (applicationId: number, options?: { force?: boolean }) => Promise<ApplicationChecklistItem[]>;
  addChecklistItem: (applicationId: number, label: string) => Promise<ApplicationChecklistItem>;
  updateChecklistItem: (
    applicationId: number,
    itemId: number,
    patch: { label?: string; completed?: boolean; sortOrder?: number },
  ) => Promise<ApplicationChecklistItem>;
  deleteChecklistItem: (applicationId: number, itemId: number) => Promise<void>;
  clearApplications: () => void;
}

const APPLICATION_CACHE_MS = 5 * 60 * 1000;


export const useAppStore = create<AppState>((set, get) => ({
  applications: [],
  loading: false,
  error: null,
  socket: null, 
  hasFetched: false,
  lastFetchedAt: null,
  checklistsByApplicationId: {},
  checklistLoadingByApplicationId: {},

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
      throw err;
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
      throw err;
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
      throw err;
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
      throw err;
    }
  },

  fetchChecklist: async (applicationId, options = {}) => {
    const existing = get().checklistsByApplicationId[applicationId];
    if (!options.force && existing) return existing;

    set((state) => ({
      checklistLoadingByApplicationId: {
        ...state.checklistLoadingByApplicationId,
        [applicationId]: true,
      },
    }));

    try {
      const res = await api.get<{ items: ApplicationChecklistItem[] }>(
        `/applications/${applicationId}/checklist`,
      );
      const items = res.data.items ?? [];
      set((state) => ({
        checklistsByApplicationId: {
          ...state.checklistsByApplicationId,
          [applicationId]: items,
        },
        checklistLoadingByApplicationId: {
          ...state.checklistLoadingByApplicationId,
          [applicationId]: false,
        },
      }));
      return items;
    } catch (err: unknown) {
      set((state) => ({
        error: getApiErrorMessage(err, "Failed to fetch checklist"),
        checklistLoadingByApplicationId: {
          ...state.checklistLoadingByApplicationId,
          [applicationId]: false,
        },
      }));
      throw err;
    }
  },

  addChecklistItem: async (applicationId, label) => {
    const res = await api.post<{ item: ApplicationChecklistItem }>(
      `/applications/${applicationId}/checklist`,
      { label },
    );
    const item = res.data.item;
    set((state) => ({
      checklistsByApplicationId: {
        ...state.checklistsByApplicationId,
        [applicationId]: [
          ...(state.checklistsByApplicationId[applicationId] ?? []),
          item,
        ],
      },
    }));
    return item;
  },

  updateChecklistItem: async (applicationId, itemId, patch) => {
    const res = await api.patch<{ item: ApplicationChecklistItem }>(
      `/applications/${applicationId}/checklist/${itemId}`,
      patch,
    );
    const item = res.data.item;
    set((state) => ({
      checklistsByApplicationId: {
        ...state.checklistsByApplicationId,
        [applicationId]: (state.checklistsByApplicationId[applicationId] ?? []).map(
          (current) => (current.id === itemId ? item : current),
        ),
      },
    }));
    return item;
  },

  deleteChecklistItem: async (applicationId, itemId) => {
    await api.delete(`/applications/${applicationId}/checklist/${itemId}`);
    set((state) => ({
      checklistsByApplicationId: {
        ...state.checklistsByApplicationId,
        [applicationId]: (state.checklistsByApplicationId[applicationId] ?? []).filter(
          (item) => item.id !== itemId,
        ),
      },
    }));
  },

  // Clear all applications
  clearApplications: () => {
    set({
      applications: [],
      loading: false,
      error: null,
      hasFetched: false,
      lastFetchedAt: null,
      checklistsByApplicationId: {},
      checklistLoadingByApplicationId: {},
    });
  },
}));
