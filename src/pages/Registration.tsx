import CustomButton from "@/components/Buttons";
import CustomInput from "@/components/Input";
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
      <div className="flex min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-900"
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Verify your email
          </h2>
          <p className="text-gray-600 mb-6">
            We sent a confirmation link to <strong>{email}</strong>. Please
            verify your email to activate your account.
          </p>

          <Link
            to="/login"
            className="text-indigo-600 hover:text-indigo-700 font-semibold"
          >
            Return to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-linear-to-br from-gray-50 to-white">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/3 bg-linear-to-br from-neutral-900 to-neutral-950 p-12 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />

        <div className="relative z-10 text-white max-w-md">
          <h1 className="text-5xl font-bold mb-6">Tracktern</h1>

          <p className="text-lg text-gray-300 mb-8">
            A clean and simple way to manage your internship applications,
            interviews, and outcomes.
          </p>

          <div className="space-y-5">
            {[
              "Centralized application tracking",
              "Interview and status management",
              "Private and secure by design",
            ].map((text) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-neutral-400" />
                <span className="text-sm text-neutral-300">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Registration Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl border border-neutral-200 p-8">
            {/* Header */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-white font-bold">
                T
              </div>
              <span className="text-xl font-semibold text-gray-900">
                Tracktern
              </span>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Create your account
              </h2>
              <p className="text-gray-600">
                Set up your workspace in less than a minute.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Form */}
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
                <p className="mt-1 text-xs text-gray-500">
                  Must be at least 6 characters
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
                  className="mt-1 w-4 h-4 rounded border-gray-300 
text-gray-900 focus:ring-gray-900"
                />
                <span className="text-gray-600">
                  I agree to the{" "}
                  <a
                    href="#"
                    className="text-indigo-600 hover:text-indigo-700 underline"
                  >
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a
                    href="#"
                    className="text-indigo-600 hover:text-indigo-700 underline"
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

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">
                  Or sign up with
                </span>
              </div>
            </div>

            {/* Google Sign Up */}
            <button
              onClick={handleGoogleSignUp}
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
              <span className="text-gray-700 font-medium">
                Sign up with Google
              </span>
            </button>

            {/* Sign In Link */}
            <p className="mt-8 text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-indigo-600 hover:text-indigo-700 font-semibold"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
