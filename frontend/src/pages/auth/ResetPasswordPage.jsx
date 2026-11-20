import { useForm } from "react-hook-form";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { authService } from "../../services";
import { resetPasswordRules } from "../../validations/auth.validation";
import {
  AuthApiError,
  AuthCenteredLayout,
  AuthPasswordField,
  authPrimaryButtonClass,
} from "./AuthLayout";

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { password: "", confirmPassword: "" },
  });

  const token = searchParams.get("token");

  const onSubmit = async (data) => {
    if (data.password !== data.confirmPassword) {
      setApiError("Passwords do not match");
      return;
    }

    setLoading(true);
    setApiError("");
    try {
      await authService.resetPassword({
        token,
        password: data.password,
      });
      toast.success("Password reset successfully! Please login.");
      navigate("/login?reset=true");
    } catch (error) {
      const message = error.response?.data?.message || "Failed to reset password";
      setApiError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCenteredLayout
      cardHeading="Create a new password"
      cardSubtitle="Enter a new password below to restore access to your Rich Apparel account."
    >
      <AuthApiError message={apiError} />

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <AuthPasswordField
          id="reset-new-password"
          label="New Password"
          placeholder="Enter new password"
          registerProps={register("password", resetPasswordRules.password)}
          error={errors.password?.message}
          showPassword={showPassword}
          onToggleVisibility={() => setShowPassword(!showPassword)}
          autoComplete="new-password"
        />

        <AuthPasswordField
          id="reset-confirm-password"
          label="Confirm Password"
          placeholder="Confirm password"
          registerProps={register("confirmPassword", resetPasswordRules.confirmPassword)}
          error={errors.confirmPassword?.message}
          showPassword={showConfirmPassword}
          onToggleVisibility={() => setShowConfirmPassword(!showConfirmPassword)}
          autoComplete="new-password"
        />

        <div className="pt-1">
          <button type="submit" disabled={loading} className={authPrimaryButtonClass}>
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Resetting...</span>
              </>
            ) : (
              "Reset Password"
            )}
          </button>
        </div>
      </form>

      <div className="mt-7 pt-5 border-t border-[#f0ebe3] text-center">
        <p className="text-[13px] text-[#6b655e]">
          Remember your password?{" "}
          <Link
            to="/login"
            className="font-semibold text-[#171615] hover:text-[#8a6d43] underline underline-offset-4 decoration-[#c9a77a] transition-colors"
          >
            Back to Login
          </Link>
        </p>
      </div>
    </AuthCenteredLayout>
  );
};
