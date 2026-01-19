import { supabase } from "@/config/supabaseClient"

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({ 
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  });
  return { data, error };
}