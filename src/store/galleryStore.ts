import { create } from "zustand";
import axios from "axios";
import { supabase } from "@/config/supabaseClient";

export interface GalleryImage {
  id: number;
  user_id: string;
  journal_entry_id: number | null;
  image_url: string;
  caption: string | null;
  created_at: string;
}

interface GalleryState {
  images: GalleryImage[];
  loading: boolean;
  error: string | null;
  lastModified?: string;

  entryImages: GalleryImage[];
  entryImagesLoading: boolean;
  fetchGallery: (entryId?: number) => Promise<void>;
  fetchEntryImages: (entryId: number) => Promise<void>;
  clearEntryImages: () => void;
  addImage: (payload: {
    image_url: string;
    caption: string;
    journal_entry_id: number;
  }) => Promise<GalleryImage>;
  deleteImage: (imageId: number) => Promise<void>;
  clearGallery: () => void;
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

const BUCKET = "journal-gallery";
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export async function uploadGalleryImage(
  file: File,
  userId: string
): Promise<string> {
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("File must be 5MB or less");
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Allowed types: JPEG, PNG, GIF, WebP");
  }
  const ext = file.name.split(".").pop() || "jpg";
  const name = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { data, error } = await supabase.storage.from(BUCKET).upload(name, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw error;
  if (!data?.path) throw new Error("Upload failed: no path returned");
  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  return publicUrl;
}

export async function getGalleryForEntry(
  entryId: number
): Promise<GalleryImage[]> {
  const res = await api.get<{ images: GalleryImage[] }>("/journal/gallery", {
    params: { entryId: String(entryId) },
  });
  return res.data.images ?? [];
}

export const useGalleryStore = create<GalleryState>((set, get) => ({
  images: [],
  loading: false,
  error: null,
  lastModified: undefined,
  entryImages: [],
  entryImagesLoading: false,

  fetchGallery: async (entryId) => {
    set({ loading: true, error: null });
    try {
      const params = entryId != null ? { entryId: String(entryId) } : {};
      const useConditional = entryId == null;
      const lastMod = useConditional ? get().lastModified ?? null : null;
      const res = await api.get<{ images: GalleryImage[] }>("/journal/gallery", {
        params,
        headers: lastMod ? { "If-Modified-Since": lastMod } : {},
        validateStatus: (status) =>
          (status >= 200 && status < 300) || status === 304,
      });
      if (res.status === 304) {
        set({ loading: false });
        return;
      }
      const newLastMod =
        useConditional && res.headers["last-modified"]
          ? res.headers["last-modified"]
          : undefined;
      set({
        images: res.data.images,
        loading: false,
        ...(newLastMod != null && useConditional
          ? { lastModified: newLastMod }
          : {}),
      });
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data
              ?.error
          : "Failed to fetch gallery";
      set({ error: message || "Failed to fetch gallery", loading: false });
      throw err;
    }
  },

  fetchEntryImages: async (entryId) => {
    set({ entryImagesLoading: true });
    try {
      const res = await api.get<{ images: GalleryImage[] }>(
        "/journal/gallery",
        { params: { entryId: String(entryId) } }
      );
      set({ entryImages: res.data.images, entryImagesLoading: false });
    } catch {
      set({ entryImages: [], entryImagesLoading: false });
    }
  },

  clearEntryImages: () =>
    set({ entryImages: [], entryImagesLoading: false }),

  addImage: async (payload) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post<{ image: GalleryImage }>("/journal/gallery", {
        image_url: payload.image_url,
        caption: payload.caption.trim(),
        journal_entry_id: payload.journal_entry_id,
      });
      const image = res.data.image;
      set((state) => ({
        images: [image, ...state.images],
        entryImages:
          image.journal_entry_id != null
            ? [image, ...state.entryImages]
            : state.entryImages,
        loading: false,
      }));
      return image;
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data
              ?.error
          : "Failed to add image";
      set({ error: message || "Failed to add image", loading: false });
      throw err;
    }
  },

  deleteImage: async (imageId) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/journal/gallery/${imageId}`);
      set((state) => ({
        images: state.images.filter((img) => img.id !== imageId),
        entryImages: state.entryImages.filter((img) => img.id !== imageId),
        loading: false,
      }));
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data
              ?.error
          : "Failed to delete image";
      set({ error: message || "Failed to delete image", loading: false });
      throw err;
    }
  },

  clearGallery: () =>
    set({
      images: [],
      loading: false,
      error: null,
      lastModified: undefined,
    }),
}));
