import { create } from "zustand";
import { supabase } from "@/config/supabaseClient";
import type { RealtimeChannel } from "@supabase/supabase-js";

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
}

export type ProfileUpdate = Partial<
  Pick<Profile, "full_name" | "nickname" | "school" | "school_id" | "course" | "program" | "required_hours">
>;

interface ProfileState {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  fetchProfile: (userId?: string, options?: { showLoading?: boolean }) => Promise<Profile | null>;
  updateProfile: (patch: ProfileUpdate) => Promise<Profile | null>;
  subscribeToProfile: (userId: string) => () => void;
  clearProfile: () => void;
}

let profileChannel: RealtimeChannel | null = null;
let subscribedProfileUserId: string | null = null;

function stopProfileSubscription() {
  if (profileChannel) {
    void supabase.removeChannel(profileChannel);
    profileChannel = null;
    subscribedProfileUserId = null;
  }
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  loading: false,
  error: null,

  fetchProfile: async (userId, options = { showLoading: true }) => {
    if (options.showLoading) set({ loading: true, error: null });
    const resolvedUserId =
      userId ??
      (await supabase.auth.getUser()).data.user?.id ??
      null;

    if (!resolvedUserId) {
      set({ profile: null, loading: false });
      return null;
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

    const profile = data as Profile | null;
    set({ profile, loading: false, error: null });
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
      cleaned[key] =
        typeof value === "string" ? value.trim() || null : value;
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

    const profile = data as Profile;
    set({ profile, loading: false });
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
            profile: payload.new as Profile,
            loading: false,
            error: null,
          });
        },
      )
      .subscribe();

    return stopProfileSubscription;
  },

  clearProfile: () => {
    stopProfileSubscription();
    set({ profile: null, error: null, loading: false });
  },
}));
