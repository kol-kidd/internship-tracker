import type { User } from "@supabase/supabase-js";
import { supabase } from "@/config/supabaseClient";

export interface ProfileAcademicFields {
  nickname?: string | null;
  school?: string | null;
  school_id?: number | null;
  course?: string | null;
  program?: string | null;
  required_hours?: number | null;
}

export async function createOrUpdateProfile(
  user: Pick<User, "id" | "email">,
  fullName?: string | null,
  academic?: ProfileAcademicFields,
) {
  const email = user.email ?? "";
  const trimmedName = fullName?.trim();

  const payload: Record<string, unknown> = {
    id: user.id,
    email,
    full_name: trimmedName ? trimmedName : email,
  };

  if (academic) {
    if (academic.nickname !== undefined) payload.nickname = academic.nickname?.trim() || null;
    if (academic.school !== undefined) payload.school = academic.school?.trim() || null;
    if (academic.school_id !== undefined) payload.school_id = academic.school_id ?? null;
    if (academic.course !== undefined) payload.course = academic.course?.trim() || null;
    if (academic.program !== undefined) payload.program = academic.program?.trim() || null;
    if (academic.required_hours !== undefined && academic.required_hours != null) {
      payload.required_hours = academic.required_hours;
    }
  }

  const { data, error } = await supabase
    .from("profiles")
    .upsert(payload)
    .select()
    .single();

  if (error) console.error("Profile Upsert Error:", error.message);
  return data;
}
