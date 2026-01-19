import { supabase } from "@/config/supabaseClient";

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error }; 
}
