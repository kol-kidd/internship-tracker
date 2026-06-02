import type { Profile } from "@/store/profileStore";

function clean(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed || null;
}

function firstWord(value?: string | null) {
  return clean(value)?.split(/\s+/)[0] ?? null;
}

export function getProfileDisplayName(
  profile: Pick<Profile, "nickname" | "full_name" | "email"> | null,
  fallbackName?: string | null,
  fallback = "Intern",
) {
  return (
    clean(profile?.nickname) ??
    clean(profile?.full_name) ??
    clean(fallbackName) ??
    clean(profile?.email) ??
    fallback
  );
}

export function getProfileIndicator(
  profile: Pick<Profile, "nickname" | "full_name" | "email"> | null,
  fallbackName?: string | null,
  fallback = "there",
) {
  return (
    clean(profile?.nickname) ??
    firstWord(profile?.full_name) ??
    firstWord(fallbackName) ??
    clean(profile?.email)?.split("@")[0] ??
    fallback
  );
}

export function getInitial(value?: string | null) {
  return clean(value)?.[0]?.toUpperCase() ?? "?";
}
