import { supabase } from "@/config/supabaseClient";

export async function createOrUpdateProfile(user: any, fullName: string) {
  console.log("creating full name in profiles", fullName)
  const { data, error } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      email: user.email,
      full_name: fullName && fullName.trim() !== "" ? fullName.trim() : user.email,
    })
    .select()
    .single();

  if (error) console.error("Profile Upsert Error:", error.message);
  return data;
}
