import { useForm } from "react-hook-form";
import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { CheckCircle2, Loader2 } from "lucide-react";
import { authService } from "../../services";
import { forgotPasswordRules } from "../../validations/auth.validation";
import {
  AuthApiError,
  AuthCenteredLayout,
  AuthFieldError,
  authInputBaseClass,
  authInputErrorClass,
  authInputNormalClass,
  authLabelClass,
  authPrimaryButtonClass,
} from "./AuthLayout";

export const ForgotPasswordPage = () => {
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { email: "" },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setApiError("");
    try {
      await authService.forgotPassword(data);
      toast.success("Password reset link sent to your email!");
      setSuccess(true);
    } catch (error) {
      const message = error.response?.data?.message || "Failed to send reset email";
      setApiError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCenteredLayout
      cardHeading={success ? "Check your inbox" : "Forgot your password?"}
      cardSubtitle={
        success
          ? "We've sent password reset instructions to your email address."
          : "Enter your email address and we'll help you get back into your account."
      }
    >
      {success ? (
        <div className="mt-6 space-y-6">
          <div className="rounded-xl bg-[#faf7f2] border border-[#e8dfd1] p-5 flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-[#f3eadc] border border-[#dfd2be] flex items-center justify-center shrink-0">
              <CheckCircle2 size={18} className="text-[#6d5940]" />
            </div>
            <div className="space-y-1">
              <p className="text-[13px] font-semibold text-[#171615]">
                Reset instructions dispatched
              </p>
              <p className="text-[12.5px] text-[#6b655e] leading-relaxed">
                Check your email for reset instructions and follow the link to create a new password.
              </p>
            </div>
          </div>

          <Link to="/login" className={authPrimaryButtonClass}>
            Back to Login
          </Link>
        </div>
      ) : (
        <>
          <AuthApiError message={apiError} />

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
            <div>
              <label htmlFor="forgot-page-email" className={authLabelClass}>
                Email address
              </label>
              <input
                id="forgot-page-email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                {...register("email", forgotPasswordRules.email)}
                className={`${authInputBaseClass} ${
                  errors.email ? authInputErrorClass : authInputNormalClass
                }`}
              />
              <AuthFieldError message={errors.email?.message} />
            </div>

            <button type="submit" disabled={loading} className={authPrimaryButtonClass}>
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                "Send Reset Link"
              )}
            </button>
          </form>

          <div className="mt-7 pt-5 border-t border-[#f0ebe3] text-center">
            <p className="text-[13px] text-[#6b655e]">
              Remember your password?{" "}
              <Link
                to="/login"
                className="font-semibold text-[#171615] hover:text-[#8a6d43] underline underline-offset-4 decoration-[#c9a77a] transition-colors"
              >
                Log in
              </Link>
            </p>
          </div>
        </>
      )}
    </AuthCenteredLayout>
  );
};
