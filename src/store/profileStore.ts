import { create } from "zustand";
import { supabase } from "@/config/supabaseClient";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useAuthStore } from "@/store/authStore";
import {
  normalizeThemePreference,
  type ThemePreference,
} from "@/lib/theme";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  nickname: string | null;
  school: string | null;
  school_id: number | null;
  course: string | null;
  program: string | null;
  required_hours: number;
  total_hours: number;
  hours_completed_at: string | null;
  completion_emailed_at: string | null;
  theme_preference: ThemePreference;
}

export type ProfileUpdate = Partial<
  Pick<Profile, "full_name" | "nickname" | "school" | "school_id" | "course" | "program" | "required_hours" | "theme_preference">
>;

interface ProfileState {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  lastFetchedUserId: string | null;
  lastFetchedAt: number | null;
  fetchProfile: (
    userId?: string,
    options?: { showLoading?: boolean; force?: boolean },
  ) => Promise<Profile | null>;
  updateProfile: (patch: ProfileUpdate) => Promise<Profile | null>;
  subscribeToProfile: (userId: string) => () => void;
  clearProfile: () => void;
}

let profileChannel: RealtimeChannel | null = null;
let subscribedProfileUserId: string | null = null;
const PROFILE_CACHE_MS = 5 * 60 * 1000;

function stopProfileSubscription() {
  if (profileChannel) {
    void supabase.removeChannel(profileChannel);
    profileChannel = null;
    subscribedProfileUserId = null;
  }
}

function normalizeProfile(data: unknown): Profile | null {
  if (!data) return null;

  const profile = data as Profile;
  return {
    ...profile,
    theme_preference: normalizeThemePreference(profile.theme_preference),
  };
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  loading: false,
  error: null,
  lastFetchedUserId: null,
  lastFetchedAt: null,

  fetchProfile: async (userId, options = { showLoading: true }) => {
    const resolvedUserId =
      userId ??
      (await supabase.auth.getUser()).data.user?.id ??
      null;

    if (!resolvedUserId) {
      set({
        profile: null,
        loading: false,
        lastFetchedUserId: null,
        lastFetchedAt: null,
      });
      return null;
    }

    const current = get();
    const cacheIsFresh =
      current.profile?.id === resolvedUserId &&
      current.lastFetchedUserId === resolvedUserId &&
      current.lastFetchedAt != null &&
      Date.now() - current.lastFetchedAt < PROFILE_CACHE_MS;

    if (!options.force && cacheIsFresh) {
      return current.profile;
    }

    if (options.showLoading && !current.profile) {
      set({ loading: true, error: null });
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", resolvedUserId)
      .maybeSingle();

    if (error) {
      set({ error: error.message, loading: false });
      return null;
    }

    const profile = normalizeProfile(data);
    set({
      profile,
      loading: false,
      error: null,
      lastFetchedUserId: resolvedUserId,
      lastFetchedAt: Date.now(),
    });
    return profile;
  },

  updateProfile: async (patch) => {
    const current = get().profile;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    set({ loading: true, error: null });

    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(patch)) {
      if (key === "theme_preference") {
        cleaned[key] = normalizeThemePreference(value);
      } else {
        cleaned[key] =
          typeof value === "string" ? value.trim() || null : value;
      }
    }

    const { data, error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, email: user.email ?? current?.email ?? "", ...cleaned })
      .select()
      .single();

    if (error) {
      set({ error: error.message, loading: false });
      return null;
    }

    const profile = normalizeProfile(data);
    if (!profile) {
      set({ error: "Profile update returned no data", loading: false });
      return null;
    }
    if (patch.full_name !== undefined) {
      const { data: authUpdate, error: authError } =
        await supabase.auth.updateUser({
          data: { full_name: profile.full_name ?? null },
        });

      if (authError) {
        console.warn("Auth metadata full_name update failed:", authError.message);
      } else if (authUpdate.user) {
        useAuthStore.getState().setUser(authUpdate.user);
      }
    }

    set({
      profile,
      loading: false,
      error: null,
      lastFetchedUserId: profile.id,
      lastFetchedAt: Date.now(),
    });
    return profile;
  },

  subscribeToProfile: (userId) => {
    if (profileChannel && subscribedProfileUserId === userId) {
      return stopProfileSubscription;
    }

    stopProfileSubscription();
    subscribedProfileUserId = userId;

    profileChannel = supabase
      .channel(`profile:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            set({ profile: null, loading: false });
            return;
          }

          set({
            profile: normalizeProfile(payload.new),
            loading: false,
            error: null,
            lastFetchedUserId: userId,
            lastFetchedAt: Date.now(),
          });
        },
      )
      .subscribe();

    return stopProfileSubscription;
  },

  clearProfile: () => {
    stopProfileSubscription();
    set({
      profile: null,
      error: null,
      loading: false,
      lastFetchedUserId: null,
      lastFetchedAt: null,
    });
  },
}));
