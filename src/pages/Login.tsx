import CustomButton from "@/components/Buttons";
import CustomInput from "@/components/Input";
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
        if (data.session) {
          setUser(data.session.user);
          await createOrUpdateProfile(data.session.user, "Optional Full Name");
          navigate("/dashboard");
        }
      }
    } catch (error) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { data, error } = await signInWithGoogle();
    if (error) {
      setError(error.message);
      setLoading(false);
    }
    // Supabase will redirect automatically
  };

  return (
    <div className="flex min-h-screen bg-linear-to-br from-gray-50 to-white">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/3 bg-linear-to-br from-neutral-900 to-neutral-950 p-12 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 text-white max-w-md">
          <h1 className="text-5xl font-semibold tracking-tight mb-6">
            Tracktern
          </h1>

          <p className="text-neutral-400 text-lg leading-relaxed mb-10">
            A simple, focused way to track internship applications, organize
            opportunities, and stay on top of your career goals.
          </p>

          <div className="space-y-5">
            {[
              "Track application progress in one place",
              "Organize roles, companies, and deadlines",
              "Designed for students and early careers",
            ].map((text) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-neutral-400" />
                <span className="text-sm text-neutral-300">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl border border-neutral-200 p-8">
            {/* Header */}
            <div className="flex justify-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-neutral-900 flex items-center justify-center shadow-sm">
                <span className="text-white font-semibold text-lg">T</span>
              </div>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-2">
                Welcome back
              </h2>
              <p className="text-sm text-neutral-500">
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
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-gray-600">Remember me</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
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
border border-gray-300 rounded-lg 
hover:bg-gray-50 transition-colors
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
              <span className="text-neutral-700 font-medium">
                Continue with Google
              </span>
            </button>

            {/* Sign Up Link */}
            <p className="mt-8 text-center text-sm text-gray-600">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-indigo-600 hover:text-indigo-700 font-semibold"
              >
                Sign up for free
              </Link>
            </p>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-gray-500">
            By continuing, you agree to our{" "}
            <a href="#" className="underline hover:text-gray-700">
              Terms
            </a>{" "}
            and{" "}
            <a href="#" className="underline hover:text-gray-700">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
