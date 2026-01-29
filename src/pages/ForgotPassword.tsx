import CustomButton from "@/components/Buttons";
import CustomInput from "@/components/Input";
import { sendPasswordResetEmail } from "@/functions/auth/forgotPassword";
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await sendPasswordResetEmail(email);

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
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

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl border border-[#DDD6FE]/50 p-8 shadow-sm">
            {/* Back Link */}
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-[#1E1B4B]/60 hover:text-[#1E1B4B] mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </Link>

            {/* Header */}
            <div className="flex justify-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-[#7C3AED] flex items-center justify-center shadow-sm">
                <span className="text-white font-semibold text-lg">IP</span>
              </div>
            </div>

            {success ? (
              // Success State
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-semibold text-[#1E1B4B] mb-2">
                  Check your email
                </h2>
                <p className="text-sm text-[#1E1B4B]/60 mb-6">
                  We've sent a password reset link to{" "}
                  <span className="font-medium text-[#1E1B4B]">{email}</span>
                </p>
                <p className="text-xs text-[#1E1B4B]/50 mb-6">
                  Didn't receive the email? Check your spam folder or{" "}
                  <button
                    onClick={() => setSuccess(false)}
                    className="text-[#7C3AED] hover:text-[#6D28D9] font-medium"
                  >
                    try again
                  </button>
                </p>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center w-full px-4 py-3 bg-[#7C3AED] text-white rounded-lg hover:bg-[#6D28D9] transition-colors font-medium"
                >
                  Back to login
                </Link>
              </div>
            ) : (
              // Form State
              <>
                <div className="text-center mb-8">
                  <div className="w-12 h-12 bg-[#DDD6FE] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-6 h-6 text-[#7C3AED]" />
                  </div>
                  <h2 className="text-2xl font-semibold text-[#1E1B4B] mb-2">
                    Forgot your password?
                  </h2>
                  <p className="text-sm text-[#1E1B4B]/60">
                    No worries! Enter your email and we'll send you a reset
                    link.
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
                      label="Email"
                      variant="outlined"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      size="small"
                    />
                  </div>

                  <CustomButton
                    text={loading ? "Sending..." : "Send Reset Link"}
                    variant="contained"
                    disabled={loading}
                    onClick={handleSubmit}
                  />
                </div>

                {/* Sign In Link */}
                <p className="mt-8 text-center text-sm text-[#1E1B4B]/70">
                  Remember your password?{" "}
                  <Link
                    to="/login"
                    className="text-[#7C3AED] hover:text-[#6D28D9] font-semibold"
                  >
                    Sign in
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
