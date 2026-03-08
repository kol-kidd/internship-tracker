import CustomButton from "@/components/Buttons";
import CustomInput from "@/components/Input";
import SEO from "@/components/SEO";
import AppLogo from "@/components/AppLogo";
import { signInWithGoogle } from "@/functions/auth/googleAuth";
import { signIn } from "@/functions/auth/signIn";
import { createOrUpdateProfile } from "@/functions/auth/updateProfile";
import { useAuthStore } from "@/store/authStore";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await signIn(email, password);

      if (error) {
        setError(error.message);
      } else if (data.session?.user) {
        setUser(data.session.user);

        const accessToken = data.session.access_token;

        localStorage.setItem("supabase_token", accessToken);

        await createOrUpdateProfile(
          data.session.user,
          data.session.user.user_metadata.full_name,
        );

        navigate("/dashboard");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await signInWithGoogle();
    if (error) setError(error.message);
    // Supabase will redirect automatically
  };

  return (
    <>
      <SEO description="Sign in to InternPal to track your internship applications and manage your career journey." />
      <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-surface" />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,var(--color-primary)/8%,transparent)]"
          aria-hidden
        />
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[520px] h-[360px] rounded-full bg-primary/8 blur-3xl -translate-y-1/2"
          aria-hidden
        />
        <div
          className="absolute bottom-0 right-0 w-[380px] h-[280px] rounded-full bg-accent/40 blur-3xl translate-x-1/3 translate-y-1/3"
          aria-hidden
        />
        <div
          className="absolute top-1/2 left-0 w-[240px] h-[240px] rounded-full bg-soft-blue/10 blur-3xl -translate-y-1/2 -translate-x-1/2"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-size-[24px_24px] mask-[radial-gradient(ellipse_70%_60%_at_50%_50%,black_20%,transparent_70%)]"
          aria-hidden
        />
        <div className="relative w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-canvas/80 backdrop-blur-sm border border-border shadow-sm shadow-black/5 mb-5">
              <AppLogo size={44} />
            </div>
            <h1 className="text-xl font-semibold text-text tracking-tight">
              Welcome back
            </h1>
            <p className="text-sm text-text-muted mt-1.5">
              Sign in to continue
            </p>
            <div
              className="mt-4 h-px w-12 mx-auto bg-linear-to-r from-transparent via-primary/30 to-transparent rounded-full"
              aria-hidden
            />
          </div>

          <div className="relative bg-canvas/95 backdrop-blur-sm rounded-2xl border border-border p-6 shadow-lg shadow-black/6 overflow-hidden">
            <div
              className="absolute top-0 left-0 right-0 h-[3px] bg-linear-to-r from-transparent via-primary/50 to-transparent rounded-t-2xl"
              aria-hidden
            />

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {error && error.includes("Invalid login credentials") && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-amber-800 text-sm">
                  If you signed up with Google, please use the "Sign in with
                  Google" button below.
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <CustomInput
                  label="Email"
                  variant="outlined"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  size="small"
                />
              </div>

              <div>
                <CustomInput
                  label="Password"
                  variant="outlined"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  size="small"
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-text-muted">Remember me</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-primary hover:text-primary-hover font-medium"
                >
                  Forgot password?
                </Link>
              </div>

              <CustomButton
                text={loading ? "Signing in..." : "Sign In"}
                variant="contained"
                disabled={loading}
                onClick={handleLogin}
              />
            </div>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-canvas text-text-muted">
                  Or continue with
                </span>
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
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
                Continue with Google
              </span>
            </button>

            <p className="mt-6 text-center text-sm text-text-muted">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-primary hover:text-primary-hover font-semibold"
              >
                Sign up for free
              </Link>
            </p>
          </div>

          <p className="mt-5 text-center text-xs text-text-muted">
            By continuing, you agree to our{" "}
            <a href="#" className="underline hover:text-text">
              Terms
            </a>{" "}
            and{" "}
            <a href="#" className="underline hover:text-text">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </>
  );
}
