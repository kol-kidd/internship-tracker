import CustomButton from "@/components/Buttons";
import CustomInput from "@/components/Input";
import SEO from "@/components/SEO";
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
    } catch (error) {
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
      <SEO
        title="Login"
        description="Sign in to InternPal to track your internship applications and manage your career journey."
      />
      <div className="flex min-h-screen bg-[#FAFAFF]">
        {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/3 bg-linear-to-br from-[#7C3AED] to-[#1E1B4B] p-12 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 text-white max-w-md">
          <h1 className="text-5xl font-semibold tracking-tight mb-6">
            InternPal
          </h1>

          <p className="text-[#DDD6FE] text-lg leading-relaxed mb-10">
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
                <div className="w-2 h-2 rounded-full bg-[#38BDF8]" />
                <span className="text-sm text-[#DDD6FE]">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl border border-[#DDD6FE]/50 p-8 shadow-sm">
            {/* Header */}
            <div className="flex justify-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-[#7C3AED] flex items-center justify-center shadow-sm">
                <span className="text-white font-semibold text-lg">IP</span>
              </div>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-[#1E1B4B] mb-2">
                Welcome back
              </h2>
              <p className="text-sm text-[#1E1B4B]/60">
                Sign in to continue to your account
              </p>
            </div>

            {/* Error Message */}
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

            {/* Form */}
            <div className="space-y-5">
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
                    className="w-4 h-4 rounded border-[#DDD6FE] text-[#7C3AED] focus:ring-[#7C3AED]"
                  />
                  <span className="text-[#1E1B4B]/70">Remember me</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[#7C3AED] hover:text-[#6D28D9] font-medium"
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

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Google Sign In */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 
border border-[#DDD6FE] rounded-lg 
hover:bg-[#DDD6FE]/20 transition-colors
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
              <span className="text-[#1E1B4B] font-medium">
                Continue with Google
              </span>
            </button>

            {/* Sign Up Link */}
            <p className="mt-8 text-center text-sm text-[#1E1B4B]/70">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-[#7C3AED] hover:text-[#6D28D9] font-semibold"
              >
                Sign up for free
              </Link>
            </p>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-[#1E1B4B]/50">
            By continuing, you agree to our{" "}
            <a href="#" className="underline hover:text-[#1E1B4B]">
              Terms
            </a>{" "}
            and{" "}
            <a href="#" className="underline hover:text-[#1E1B4B]">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
      </div>
    </>
  );
}
