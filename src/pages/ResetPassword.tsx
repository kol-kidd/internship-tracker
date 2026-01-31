import CustomButton from "@/components/Buttons";
import CustomInput from "@/components/Input";
import SEO from "@/components/SEO";
import { updatePassword } from "@/functions/auth/forgotPassword";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/config/supabaseClient";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validSession, setValidSession] = useState<boolean | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const handleRecovery = async () => {
      // Check URL hash for recovery token
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const type = hashParams.get("type");

      if (type === "recovery" && accessToken) {
        // Set the session from the recovery token
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: hashParams.get("refresh_token") || "",
        });

        if (!error) {
          setValidSession(true);
          // Clean up the URL
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname,
          );
          return;
        }
      }

      // Check existing session
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setValidSession(!!session);
    };

    handleRecovery();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setValidSession(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async () => {
    if (!password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await updatePassword(password);

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (validSession === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-muted">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  if (!validSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface p-4">
        <div className="bg-canvas rounded-xl border border-border p-8 max-w-md w-full text-center shadow-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-semibold text-text mb-2">
            Invalid or Expired Link
          </h2>
          <p className="text-sm text-text/60 mb-6">
            This password reset link is invalid or has expired. Please request a
            new one.
          </p>
          <Link
            to="/forgot-password"
            className="inline-flex items-center justify-center w-full px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium"
          >
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Reset Password"
        description="Create a new password for your InternPal account."
      />
      <div className="flex min-h-screen bg-surface">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/3 bg-primary p-12 items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10 text-white max-w-md">
            <h1 className="text-5xl font-semibold tracking-tight mb-6">
              InternPal
            </h1>

            <p className="text-sidebar-text text-lg leading-relaxed mb-10">
              Your AI-powered companion for tracking internship applications,
              organizing opportunities, and achieving your career goals.
            </p>

            <div className="space-y-5">
              {[
                "Track application progress in one place",
                "Organize roles, companies, and deadlines",
                "Designed for students and early careers",
              ].map((text) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-accent" />
                  <span className="text-sm text-sidebar-text">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="bg-canvas rounded-xl border border-border p-8 shadow-sm">
              {/* Back Link */}
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm text-text/60 hover:text-text mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to login
              </Link>

              {/* Header */}
              <div className="flex justify-center mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-sm">
                  <span className="text-white font-semibold text-lg">IP</span>
                </div>
              </div>

              {success ? (
                // Success State
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-semibold text-text mb-2">
                    Password updated!
                  </h2>
                  <p className="text-sm text-text/60 mb-6">
                    Your password has been successfully reset. You'll be
                    redirected to login shortly.
                  </p>
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center w-full px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium"
                  >
                    Go to login
                  </Link>
                </div>
              ) : (
                // Form State
                <>
                  <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-border rounded-full flex items-center justify-center mx-auto mb-4">
                      <Lock className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-semibold text-text mb-2">
                      Set new password
                    </h2>
                    <p className="text-sm text-text/60">
                      Your new password must be at least 6 characters long.
                    </p>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  )}

                  {/* Form */}
                  <div className="space-y-5">
                    <div>
                      <CustomInput
                        label="New Password"
                        variant="outlined"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        size="small"
                      />
                    </div>

                    <div>
                      <CustomInput
                        label="Confirm Password"
                        variant="outlined"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        size="small"
                      />
                    </div>

                    <CustomButton
                      text={loading ? "Updating..." : "Update Password"}
                      variant="contained"
                      disabled={loading}
                      onClick={handleSubmit}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
