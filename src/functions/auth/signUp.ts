import { supabase } from "@/config/supabaseClient";

export async function signUp(email: string, password: string) {
  // Method 1: Check profiles table (recommended if you have one)
  const { data: existingUser, error: checkError } = await supabase
    .from('profiles') // or your user table name
    .select('id, email')
    .eq('email', email)
    .maybeSingle();

  if (checkError && checkError.code !== 'PGRST116') {
    // PGRST116 is "no rows returned" - any other error is a real problem
    return { 
      data: { user: null, session: null }, 
      error: checkError 
    };
  }

  if (existingUser) {
    return {
      data: { user: null, session: null },
      error: {
        message: "This email is already registered. Please sign in instead or use Google login.",
        status: 400,
        name: "AuthApiError"
      }
    };
  }

  // If email doesn't exist, proceed with signup
  const { data, error } = await supabase.auth.signUp({ 
    email, 
    password 
  });
  
  // Method 2: Check the signup response
  // Supabase returns a user but with identities: [] if email exists with different provider
  if (data.user && !error) {
    // If user was created but has no identities, it might be a duplicate
    // However, this is not reliable for detecting OAuth duplicates
    if (data.user.identities && data.user.identities.length === 0) {
      return {
        data: { user: null, session: null },
        error: {
          message: "This email is already registered. Please sign in instead or use Google login.",
          status: 400,
          name: "AuthApiError"
        }
      };
    }
  }
  
  return { data, error };
}