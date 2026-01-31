import CustomButton from "@/components/Buttons";
import CustomInput from "@/components/Input";
import SEO from "@/components/SEO";
import AppLogo from "@/components/AppLogo";
import { signInWithGoogle } from "@/functions/auth/googleAuth";
import { signUp } from "@/functions/auth/signUp";
import { createOrUpdateProfile } from "@/functions/auth/updateProfile";
import { useAuthStore } from "@/store/authStore";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  const handleRegister = async () => {
    setLoading(true);
    setError(null);

    // Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    if (!fullName || fullName.trim() === "") {
      setError("Please enter your full name");
      setLoading(false);
      return;
    }

    try {
      console.log("Full name", fullName);
      const { data, error } = await signUp(email, password, fullName.trim());

      if (error) {
        // Handle email already registered (including Google OAuth)
        console.log(error.message);
        if (error.message.includes("already registered")) {
          setError(
            "This email is already registered. Please sign in instead or use Google login.",
          );
        } else {
          setError(error.message);
        }
        setLoading(false);
        return;
      }

      if (!data.user) {
        setError("Failed to create account. Please try again.");
        setLoading(false);
        return;
      }

      // Create or update profile
      await createOrUpdateProfile(data.user, fullName.trim());

      if (data.session) {
        // Logged in automatically
        setUser(data.user);
        navigate("/dashboard");
      } else {
        // Requires email confirmation
        setSuccess(true);
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await signInWithGoogle();

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      // Supabase will handle redirect automatically if OAuth succeeds
    } catch (err) {
      setError("An unexpected error occurred with Google sign-in");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-text mb-2">
            Verify your email
          </h2>
          <p className="text-sm text-text-muted mb-6">
            We sent a confirmation link to <strong>{email}</strong>. Verify
            your email to activate your account.
          </p>
          <Link
            to="/login"
            className="text-primary hover:text-primary-hover font-medium text-sm"
          >
            Return to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Sign Up"
        description="Create your InternPal account to start tracking internship applications and enhance your career journey with AI."
      />
      <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-surface" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,var(--color-primary)/8%,transparent)]" aria-hidden />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[520px] h-[360px] rounded-full bg-primary/8 blur-3xl -translate-y-1/2" aria-hidden />
        <div className="absolute bottom-0 right-0 w-[380px] h-[280px] rounded-full bg-accent/40 blur-3xl translate-x-1/3 translate-y-1/3" aria-hidden />
        <div className="absolute top-1/2 left-0 w-[240px] h-[240px] rounded-full bg-soft-blue/10 blur-3xl -translate-y-1/2 -translate-x-1/2" aria-hidden />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-size-[24px_24px] mask-[radial-gradient(ellipse_70%_60%_at_50%_50%,black_20%,transparent_70%)]" aria-hidden />
        <div className="relative w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-canvas/80 backdrop-blur-sm border border-border shadow-sm shadow-black/5 mb-5">
              <AppLogo size={44} />
            </div>
            <h1 className="text-xl font-semibold text-text tracking-tight">
              Create your account
            </h1>
            <p className="text-sm text-text-muted mt-1.5">
              Sign up in a minute
            </p>
            <div className="mt-4 h-px w-12 mx-auto bg-linear-to-r from-transparent via-primary/30 to-transparent rounded-full" aria-hidden />
          </div>

          <div className="relative bg-canvas/95 backdrop-blur-sm rounded-2xl border border-border p-6 shadow-lg shadow-black/6 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-linear-to-r from-transparent via-primary/50 to-transparent rounded-t-2xl" aria-hidden />

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <CustomInput
                  label="Full Name"
                  variant="outlined"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div>
                <CustomInput
                  label="Email"
                  variant="outlined"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <CustomInput
                  label="Password"
                  variant="outlined"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <p className="mt-1 text-xs text-text-muted">
                  At least 6 characters
                </p>
              </div>

              <div>
                <CustomInput
                  label="Confirm Password"
                  variant="outlined"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <div className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  required
                  className="mt-1 w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-text-muted">
                  I agree to the{" "}
                  <a
                    href="#"
                    className="text-primary hover:text-primary-hover underline"
                  >
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a
                    href="#"
                    className="text-primary hover:text-primary-hover underline"
                  >
                    Privacy Policy
                  </a>
                </span>
              </div>

              <CustomButton
                text={loading ? "Creating account..." : "Create Account"}
                variant="contained"
                disabled={loading}
                onClick={handleRegister}
              />
            </div>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-canvas text-text-muted">
                  Or sign up with
                </span>
              </div>
            </div>

            <button
              onClick={handleGoogleSignUp}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 
border border-border rounded-lg 
hover:bg-accent/30 transition-colors
disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="text-text font-medium">
                Sign up with Google
              </span>
            </button>

            <p className="mt-6 text-center text-sm text-text-muted">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-primary hover:text-primary-hover font-semibold"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
