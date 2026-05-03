import type { User } from "@supabase/supabase-js";
import { supabase } from "@/config/supabaseClient";

export async function createOrUpdateProfile(
  user: Pick<User, "id" | "email">,
  fullName?: string | null,
) {
  console.log("creating full name in profiles", fullName)
  const email = user.email ?? "";
  const trimmedName = fullName?.trim();

  const { data, error } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      email,
      full_name: trimmedName ? trimmedName : email,
    })
    .select()
    .single();

  if (error) console.error("Profile Upsert Error:", error.message);
  return data;
}
