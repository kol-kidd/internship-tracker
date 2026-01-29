import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/config/supabaseClient";
import { useAuthStore } from "@/store/authStore";
import { createOrUpdateProfile } from "@/functions/auth/updateProfile";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check URL hash for recovery token (password reset flow)
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1),
        );
        const accessToken = hashParams.get("access_token");
        const type = hashParams.get("type");

        // If this is a password recovery, redirect to reset password page
        if (type === "recovery" && accessToken) {
          navigate("/reset-password" + window.location.hash);
          return;
        }

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting session:", error);
          navigate("/login");
          return;
        }

        if (session?.user) {
          setUser(session.user);
          await createOrUpdateProfile(
            session.user,
            session.user.user_metadata?.full_name || "",
          );
          navigate("/dashboard");
        } else {
          navigate("/login");
        }
      } catch (error) {
        console.error("Callback error:", error);
        navigate("/login");
      }
    };

    // Listen for auth state changes (handles OAuth and recovery)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        navigate("/reset-password");
        return;
      }

      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user);
        createOrUpdateProfile(
          session.user,
          session.user.user_metadata?.full_name || "",
        );
        navigate("/dashboard");
      }
    });

    handleCallback();

    return () => subscription.unsubscribe();
  }, [navigate, setUser]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Processing...</p>
      </div>
    </div>
  );
}
