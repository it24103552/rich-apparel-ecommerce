import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import toast from "react-hot-toast";
import { motion as Motion, AnimatePresence, MotionConfig } from "framer-motion";
import { AlertCircle, ArrowLeft, Eye, EyeOff, KeyRound, Loader2, X } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { authService } from "../../services";
import { loginRules } from "../../validations/auth.validation";

export const LoginPage = () => {
  const navigate = useNavigate();
  const { dispatch } = useAuth();
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: email, 2: otp, 3: new password
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOTP, setForgotOTP] = useState("");
  const [forgotPassword, setForgotPassword] = useState("");
  const [forgotPasswordConfirm, setForgotPasswordConfirm] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setApiError("");
    try {
      const response = await authService.login(data);
      const { token, user } = response.data.data;

      sessionStorage.setItem("token", token);
      dispatch({
        type: "AUTH_SUCCESS",
        payload: { user, token },
      });

      toast.success("Welcome back! Logged in successfully");

      // Redirect based on role (case-insensitive)
      const roleObj = user.role;
      const roleStr = typeof roleObj === 'string' ? roleObj : (roleObj?.name || "");
      const role = roleStr.toLowerCase();
      const managerRoles = ["admin", "product manager", "supplier manager"];
      if (managerRoles.includes(role)) {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (error) {
      const message = error.response?.data?.message || "Login failed";
      setApiError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordEmail = async () => {
    if (!forgotEmail.trim()) {
      setForgotError("Please enter your email");
      return;
    }
    setForgotLoading(true);
    setForgotError("");
    try {
      await authService.forgotPassword({ email: forgotEmail });
      toast.success("OTP sent to your email");
      setForgotStep(2);
    } catch (error) {
      const message = error.response?.data?.message || "Failed to send OTP";
      setForgotError(message);
      toast.error(message);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotPasswordOTP = async () => {
    if (!forgotOTP.trim()) {
      setForgotError("Please enter OTP");
      return;
    }
    setForgotLoading(true);
    setForgotError("");
    try {
      await authService.verifyOTP({ email: forgotEmail, otp: forgotOTP });
      toast.success("OTP verified");
      setForgotStep(3);
    } catch (error) {
      const message = error.response?.data?.message || "Invalid OTP";
      setForgotError(message);
      toast.error(message);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotPasswordReset = async () => {
    if (!forgotPassword.trim()) {
      setForgotError("Please enter new password");
      return;
    }
    if (forgotPassword !== forgotPasswordConfirm) {
      setForgotError("Passwords do not match");
      return;
    }
    setForgotLoading(true);
    setForgotError("");
    try {
      await authService.resetPassword({ email: forgotEmail, otp: forgotOTP, password: forgotPassword });
      toast.success("Password reset successfully! Please log in.");
      setShowForgotPassword(false);
      setForgotStep(1);
      setForgotEmail("");
      setForgotOTP("");
      setForgotPassword("");
      setForgotPasswordConfirm("");
    } catch (error) {
      const message = error.response?.data?.message || "Failed to reset password";
      setForgotError(message);
      toast.error(message);
    } finally {
      setForgotLoading(false);
    }
  };

  const inputBaseClass =
    "w-full h-12 px-4 rounded-[10px] bg-white text-[14px] font-medium text-[#171615] placeholder:text-[#9c9489] placeholder:font-normal border transition-all duration-200 outline-none";
  const inputNormalClass =
    "border-[#ddd4c8] hover:border-[#c6bba9] focus:border-[#171615] focus:ring-2 focus:ring-[#c9a77a]/25";
  const inputErrorClass =
    "border-[#c94a4a] focus:border-[#c94a4a] focus:ring-2 focus:ring-[#c94a4a]/15";

  return (
    <MotionConfig reducedMotion="user">
      <div
        className="min-h-screen flex flex-col lg:grid lg:grid-cols-12 bg-[#faf8f5] text-[#171615] selection:bg-[#171615] selection:text-white overflow-x-hidden"
        style={{ fontFamily: "'Montserrat', sans-serif" }}
      >
        {/* Left Side — Desktop Brand & Editorial Visual Area */}
        <Motion.aside
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="hidden lg:flex lg:col-span-6 relative bg-[#171615] flex-col justify-between p-12 xl:p-14 overflow-hidden"
        >
          <img
            src="/assets/img/split image 2.png"
            alt="Rich Apparel Collection"
            className="absolute inset-0 h-full w-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#171615]/60 via-[#171615]/15 to-[#171615]/90" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#171615]/50 via-transparent to-transparent" />

          {/* Top Brand Lockup */}
          <div className="relative z-10 flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex flex-col group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d8c4a6] rounded-sm"
            >
              <span className="font-bold text-2xl tracking-[0.22em] leading-none text-white">
                RICH
              </span>
              <span className="font-medium text-[11px] tracking-[0.34em] leading-none text-white/85 mt-1">
                APPAREL
              </span>
              <span className="w-8 h-[2px] bg-[#d8c4a6] mt-3 transition-all duration-300 group-hover:w-12" />
            </Link>
          </div>

          {/* Bottom Minimal Editorial Copy */}
          <Motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 max-w-md space-y-3"
          >
            <span className="inline-block text-[10px] font-bold uppercase tracking-[0.32em] text-[#d8c4a6]">
              Curated Collection
            </span>
            <h2 className="text-3xl xl:text-[40px] font-bold tracking-tight text-white leading-[1.15]">
              Rich Apparel
            </h2>
            <p className="text-sm xl:text-base text-white/80 font-normal tracking-wide leading-relaxed">
              Elevated everyday style
            </p>
            <div className="w-12 h-[1.5px] bg-[#c9a77a]/80 pt-1" />
          </Motion.div>
        </Motion.aside>

        {/* Tablet Compact Editorial Header (md only) */}
        <div className="hidden md:block lg:hidden relative h-44 bg-[#171615] overflow-hidden shrink-0">
          <img
            src="/assets/img/split image 2.png"
            alt="Rich Apparel Collection"
            className="w-full h-full object-cover object-[center_18%]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#171615]/85 via-[#171615]/50 to-[#171615]/30" />
          <div className="relative z-10 h-full max-w-[520px] mx-auto px-6 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#d8c4a6] block mb-1">
                Rich Apparel
              </span>
              <p className="text-xl font-bold text-white tracking-tight">
                Elevated everyday style
              </p>
            </div>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/90 hover:text-white bg-white/10 backdrop-blur-xs border border-white/20 rounded-lg px-3.5 py-2 transition-colors"
            >
              <ArrowLeft size={14} />
              Store
            </Link>
          </div>
        </div>

        {/* Mobile Compact Brand Bar (< md) */}
        <div className="flex md:hidden items-center justify-between px-5 pt-5 pb-1">
          <Link to="/" className="inline-flex flex-col">
            <span className="font-bold text-base tracking-[0.22em] leading-none text-[#171615]">
              RICH APPAREL
            </span>
            <span className="w-6 h-[2px] bg-[#c9a77a] mt-1.5" />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b655e] hover:text-[#171615] transition-colors py-1.5"
          >
            <ArrowLeft size={14} />
            Back to store
          </Link>
        </div>

        {/* Right Side — Login Card Container */}
        <main className="flex-1 lg:col-span-6 flex flex-col justify-between px-5 py-6 sm:px-10 sm:py-10 lg:px-14 lg:py-10">
          {/* Desktop Top Utility Row */}
          <div className="hidden lg:flex items-center justify-end">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6b655e] hover:text-[#171615] transition-colors"
            >
              <ArrowLeft size={14} />
              Back to store
            </Link>
          </div>

          {/* Centered Login Card */}
          <div className="flex-1 flex items-center justify-center py-2 sm:py-6">
            <Motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-[432px] bg-white rounded-2xl border border-[#e5ded4] shadow-[0_12px_36px_rgba(23,22,21,0.05)] p-6 sm:p-9"
            >
              {/* Card Brand & Heading */}
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#8a6d43]">
                    Rich Apparel
                  </span>
                  <span className="h-[1px] w-6 bg-[#d8c4a6]" />
                </div>
                <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-[#171615] mt-3">
                  Welcome back
                </h1>
                <p className="text-[13.5px] text-[#6b655e] mt-1.5 leading-relaxed">
                  Sign in to continue shopping with Rich Apparel.
                </p>
              </div>

              {/* API Error Feedback */}
              {apiError && (
                <div
                  role="alert"
                  className="mt-5 px-3.5 py-3 rounded-[10px] bg-[#fdf4f4] border border-[#f0c7c7] text-[#9b2c2c] text-[13px] font-medium flex items-start gap-2.5"
                >
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-[#b43232]" />
                  <span>{apiError}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-5">
                {/* Email Field */}
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#3a3530] mb-2"
                  >
                    Email address
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                    {...register("email", loginRules.email)}
                    className={`${inputBaseClass} ${errors.email ? inputErrorClass : inputNormalClass}`}
                  />
                  {errors.email?.message && (
                    <p
                      role="alert"
                      className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-[#b43232]"
                    >
                      <AlertCircle size={13} className="shrink-0" />
                      <span>{errors.email.message}</span>
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <label
                    htmlFor="login-password"
                    className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#3a3530] mb-2"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      {...register("password", loginRules.password)}
                      className={`${inputBaseClass} pr-11 ${errors.password ? inputErrorClass : inputNormalClass}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-[#8a8277] hover:text-[#171615] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a77a] transition-colors cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff size={18} strokeWidth={1.75} />
                      ) : (
                        <Eye size={18} strokeWidth={1.75} />
                      )}
                    </button>
                  </div>
                  {errors.password?.message && (
                    <p
                      role="alert"
                      className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-[#b43232]"
                    >
                      <AlertCircle size={13} className="shrink-0" />
                      <span>{errors.password.message}</span>
                    </p>
                  )}
                </div>

                {/* Forgot Password Link */}
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotError("");
                      setShowForgotPassword(true);
                    }}
                    className="text-xs font-semibold text-[#5c554c] hover:text-[#171615] underline underline-offset-4 decoration-[#c9a77a]/70 hover:decoration-[#171615] transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Primary Sign In Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-[10px] bg-[#171615] hover:bg-[#2a2826] active:scale-[0.99] text-white text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 shadow-[0_6px_18px_rgba(23,22,21,0.14)] hover:shadow-[0_10px_24px_rgba(23,22,21,0.2)] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </form>

              {/* Registration Prompt */}
              <div className="mt-7 pt-6 border-t border-[#f0ebe3] text-center">
                <p className="text-[13px] text-[#6b655e]">
                  Don&apos;t have an account?{" "}
                  <Link
                    to="/register"
                    className="font-semibold text-[#171615] hover:text-[#8a6d43] underline underline-offset-4 decoration-[#c9a77a] transition-colors"
                  >
                    Create an account
                  </Link>
                </p>
              </div>
            </Motion.div>
          </div>

          {/* Subtle Footer Metadata */}
          <div className="hidden lg:flex items-center justify-between text-[11px] text-[#8c847a] tracking-wide pt-4">
            <span>&copy; 2026 Rich Apparel</span>
            <span>Quiet luxury for everyday wear</span>
          </div>
        </main>

        {/* Forgot Password Modal */}
        <AnimatePresence>
          {showForgotPassword && (
            <Motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 bg-[#171615]/55 backdrop-blur-xs flex items-center justify-center z-50 p-4"
            >
              <Motion.div
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="bg-white rounded-2xl border border-[#e5ded4] shadow-[0_24px_60px_rgba(23,22,21,0.22)] p-6 sm:p-8 max-w-md w-full"
              >
                <div className="flex items-start justify-between gap-4 pb-4 mb-5 border-b border-[#f0ebe3]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[10px] bg-[#f5efe6] border border-[#e6dccb] flex items-center justify-center shrink-0">
                      <KeyRound size={18} className="text-[#171615]" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold tracking-tight text-[#171615]">
                        Reset Password
                      </h2>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a6d43] mt-0.5">
                        Step {forgotStep} of 3
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setForgotError("");
                    }}
                    aria-label="Close reset password dialog"
                    className="p-1.5 rounded-lg text-[#8a8277] hover:text-[#171615] hover:bg-[#f5efe6]/60 transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {forgotError && (
                  <div
                    role="alert"
                    className="mb-4 px-3.5 py-3 bg-[#fdf4f4] text-[#9b2c2c] text-[13px] font-medium rounded-[10px] border border-[#f0c7c7] flex items-start gap-2"
                  >
                    <AlertCircle size={15} className="shrink-0 mt-0.5 text-[#b43232]" />
                    <span>{forgotError}</span>
                  </div>
                )}

                {forgotSuccess && (
                  <div className="mb-4 px-3.5 py-3 bg-emerald-50 text-emerald-800 text-[13px] font-medium rounded-[10px] border border-emerald-200">
                    {forgotSuccess}
                  </div>
                )}

                {forgotStep === 1 && (
                  <div className="space-y-5">
                    <div>
                      <label
                        htmlFor="forgot-email"
                        className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#3a3530] mb-2"
                      >
                        Email address
                      </label>
                      <input
                        id="forgot-email"
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="Enter your email"
                        className={`${inputBaseClass} ${inputNormalClass}`}
                      />
                    </div>
                    <div className="flex gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(false);
                          setForgotError("");
                        }}
                        className="flex-1 h-11 px-4 border border-[#ddd4c8] rounded-[10px] text-xs font-semibold uppercase tracking-[0.14em] text-[#4a453f] hover:bg-[#faf8f5] transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleForgotPasswordEmail}
                        disabled={forgotLoading}
                        className="flex-1 h-11 px-4 bg-[#171615] text-white rounded-[10px] text-xs font-bold uppercase tracking-[0.16em] hover:bg-[#2a2826] disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        {forgotLoading ? "Sending..." : "Send OTP"}
                      </button>
                    </div>
                  </div>
                )}

                {forgotStep === 2 && (
                  <div className="space-y-5">
                    <p className="text-[13px] text-[#6b655e] leading-relaxed">
                      Enter the 6-digit OTP sent to{" "}
                      <span className="font-semibold text-[#171615]">{forgotEmail}</span>
                    </p>
                    <div>
                      <label
                        htmlFor="forgot-otp"
                        className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#3a3530] mb-2"
                      >
                        One-time passcode
                      </label>
                      <input
                        id="forgot-otp"
                        type="text"
                        value={forgotOTP}
                        onChange={(e) => setForgotOTP(e.target.value.slice(0, 6))}
                        placeholder="000000"
                        className="w-full h-12 px-4 border border-[#ddd4c8] rounded-[10px] focus:outline-none focus:border-[#171615] focus:ring-2 focus:ring-[#c9a77a]/25 text-center text-xl tracking-[0.35em] font-bold text-[#171615] placeholder:text-[#c7bfb4] transition-all"
                      />
                    </div>
                    <div className="flex gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setForgotStep(1);
                          setForgotError("");
                        }}
                        className="flex-1 h-11 px-4 border border-[#ddd4c8] rounded-[10px] text-xs font-semibold uppercase tracking-[0.14em] text-[#4a453f] hover:bg-[#faf8f5] transition-colors cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handleForgotPasswordOTP}
                        disabled={forgotLoading}
                        className="flex-1 h-11 px-4 bg-[#171615] text-white rounded-[10px] text-xs font-bold uppercase tracking-[0.16em] hover:bg-[#2a2826] disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        {forgotLoading ? "Verifying..." : "Verify OTP"}
                      </button>
                    </div>
                  </div>
                )}

                {forgotStep === 3 && (
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="forgot-new-password"
                        className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#3a3530] mb-2"
                      >
                        New Password
                      </label>
                      <input
                        id="forgot-new-password"
                        type="password"
                        value={forgotPassword}
                        onChange={(e) => setForgotPassword(e.target.value)}
                        placeholder="Enter new password"
                        className={`${inputBaseClass} ${inputNormalClass}`}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="forgot-confirm-password"
                        className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#3a3530] mb-2"
                      >
                        Confirm Password
                      </label>
                      <input
                        id="forgot-confirm-password"
                        type="password"
                        value={forgotPasswordConfirm}
                        onChange={(e) => setForgotPasswordConfirm(e.target.value)}
                        placeholder="Confirm new password"
                        className={`${inputBaseClass} ${inputNormalClass}`}
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setForgotStep(2);
                          setForgotError("");
                        }}
                        className="flex-1 h-11 px-4 border border-[#ddd4c8] rounded-[10px] text-xs font-semibold uppercase tracking-[0.14em] text-[#4a453f] hover:bg-[#faf8f5] transition-colors cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handleForgotPasswordReset}
                        disabled={forgotLoading}
                        className="flex-1 h-11 px-4 bg-[#171615] text-white rounded-[10px] text-xs font-bold uppercase tracking-[0.16em] hover:bg-[#2a2826] disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        {forgotLoading ? "Resetting..." : "Reset Password"}
                      </button>
                    </div>
                  </div>
                )}
              </Motion.div>
            </Motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
};
