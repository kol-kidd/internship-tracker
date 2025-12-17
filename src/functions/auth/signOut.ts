import { supabase } from "@/config/supabaseClient";

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}