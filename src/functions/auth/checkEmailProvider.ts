import { supabase } from "@/config/supabaseClient";

export const checkEmailProvider = async (email: string) => {
  try {
    // Try to sign in with a wrong password to trigger provider detection
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: "wrong_password_to_check"
    });
    
    if (error?.message.includes("Invalid login credentials")) {
      return "email"; // Email/password exists
    } else if (error?.message.includes("Email not confirmed")) {
      return "email"; // Email exists but not confirmed
    }
    // If no specific error, might be OAuth
    return "unknown";
  } catch (err) {
    return "unknown";
  }
};