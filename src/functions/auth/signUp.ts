import { supabase } from "@/config/supabaseClient";

export async function signUp(email: string, password: string, fullName: string) {
  const { data: existingUser, error: checkError } = await supabase
    .from('profiles') 
    .select('id, email')
    .eq('email', email)
    .maybeSingle();

  if (checkError && checkError.code !== 'PGRST116') {
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

  const { data, error } = await supabase.auth.signUp({ 
    email, 
    password,
    options: {
      data: {
        full_name: fullName || email,
      }
    } 
  });
  

  if (data.user && !error) {
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