import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { authService } from "../../services";
import { registerRules } from "../../validations/auth.validation";
import {
  AuthApiError,
  AuthFieldError,
  AuthPasswordField,
  AuthSplitLayout,
  authInputBaseClass,
  authInputErrorClass,
  authInputNormalClass,
  authLabelClass,
  authPrimaryButtonClass,
} from "./AuthLayout";

export const RegisterPage = () => {
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
    defaultValues: { name: "", email: "", phone: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (data) => {
    if (data.password !== data.confirmPassword) {
      setApiError("Passwords do not match");
      return;
    }

    setLoading(true);
    setApiError("");
    try {
      await authService.register({
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
      });
      toast.success("Account created! Please check your email to verify.");
      navigate("/login?registered=true");
    } catch (error) {
      const message = error.response?.data?.message || "Registration failed";
      setApiError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout
      imageSrc="/assets/img/split image .png"
      imageAlt="Rich Apparel Men's Collection"
      eyebrow="Elevated Essentials"
      headline="Rich Apparel"
      tagline="Modern fashion • Everyday confidence • Premium style"
      cardHeading="Create your account"
      cardSubtitle="Join Rich Apparel and make your next style move."
    >
      <AuthApiError message={apiError} />

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div>
          <label htmlFor="register-name" className={authLabelClass}>
            Full Name
          </label>
          <input
            id="register-name"
            type="text"
            autoComplete="name"
            placeholder="John Doe"
            {...register("name", registerRules.name)}
            className={`${authInputBaseClass} ${
              errors.name ? authInputErrorClass : authInputNormalClass
            }`}
          />
          <AuthFieldError message={errors.name?.message} />
        </div>

        <div>
          <label htmlFor="register-email" className={authLabelClass}>
            Email
          </label>
          <input
            id="register-email"
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            {...register("email", registerRules.email)}
            className={`${authInputBaseClass} ${
              errors.email ? authInputErrorClass : authInputNormalClass
            }`}
          />
          <AuthFieldError message={errors.email?.message} />
        </div>

        <div>
          <label htmlFor="register-phone" className={authLabelClass}>
            Phone Number
          </label>
          <input
            id="register-phone"
            type="tel"
            autoComplete="tel"
            placeholder="07XXXXXXXX"
            maxLength={10}
            {...register("phone", registerRules.phone)}
            onInput={(e) => {
              e.target.value = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
            }}
            className={`${authInputBaseClass} ${
              errors.phone ? authInputErrorClass : authInputNormalClass
            }`}
          />
          <AuthFieldError message={errors.phone?.message} />
        </div>

        <AuthPasswordField
          id="register-password"
          label="Password"
          placeholder="Create a password"
          registerProps={register("password", registerRules.password)}
          error={errors.password?.message}
          showPassword={showPassword}
          onToggleVisibility={() => setShowPassword(!showPassword)}
          autoComplete="new-password"
        />

        <AuthPasswordField
          id="register-confirm-password"
          label="Confirm Password"
          placeholder="Confirm your password"
          registerProps={register("confirmPassword", registerRules.confirmPassword)}
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
                <span>Creating Account...</span>
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </div>
      </form>

      <div className="mt-6 pt-5 border-t border-[#f0ebe3] text-center">
        <p className="text-[13px] text-[#6b655e]">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-[#171615] hover:text-[#8a6d43] underline underline-offset-4 decoration-[#c9a77a] transition-colors"
          >
            Login here
          </Link>
        </p>
      </div>
    </AuthSplitLayout>
  );
};
