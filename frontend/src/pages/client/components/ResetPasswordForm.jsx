import { useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { authService } from "../../../services";
import { Button } from "../../../components/common/Button";
import { Lock, Check, AlertCircle, Eye, EyeOff, ShieldCheck, Mail } from "lucide-react";
import toast from "react-hot-toast";

export const ResetPasswordForm = ({ user }) => {
  const { dispatch } = useAuth();
  const [step, setStep] = useState(1); // 1: verify email, 2: verify OTP, 3: new password
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleVerifyEmail = async () => {
    setLoading(true);
    setError("");
    try {
      await authService.forgotPassword({ email: user.email });
      toast.success("OTP sent to your email");
      setStep(2);
    } catch (err) {
      const message = err.response?.data?.message || "Failed to send OTP";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      setError("Please enter OTP");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await authService.verifyOTP({ email: user.email, otp });
      toast.success("OTP verified");
      setStep(3);
    } catch (err) {
      const message = err.response?.data?.message || "Invalid OTP";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim()) {
      setError("Please enter new password");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await authService.resetPassword({
        email: user.email,
        otp,
        password: newPassword,
      });
      toast.success("Password reset successfully!");
      setSuccess("Your password has been reset successfully. Please log in again.");
      setTimeout(() => {
        localStorage.removeItem("token");
        dispatch({ type: "AUTH_LOGOUT" });
        window.location.href = "/login";
      }, 2000);
    } catch (err) {
      const message = err.response?.data?.message || "Failed to reset password";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#e9e1d6] shadow-[0_2px_14px_rgba(32,25,18,0.035)] overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="px-6 sm:px-7 py-4 bg-[#faf7f2] border-b border-[#efe8de] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#161514] flex items-center justify-center shrink-0">
            <Lock className="h-4 w-4 text-[#d8c4a6]" />
          </div>
          <div>
            <h2 className="text-[13.5px] font-extrabold text-[#151413] uppercase tracking-[0.14em]">Change Password</h2>
            <p className="text-[12px] text-[#7a7064] font-medium mt-0.5">Verify your email with a one-time passcode to update password</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#e3d7c6] text-[10px] font-bold uppercase tracking-[0.14em] text-[#7c664e]">
          <ShieldCheck size={12.5} className="text-[#9a7b56]" /> Security
        </span>
      </div>

      <div className="p-6 sm:p-7">
        {error && (
          <div className="mb-5 bg-[#fdf0f0] border border-[#f0c7c7] text-[#9e2a2b] px-4 py-3 rounded-xl flex items-start gap-2.5 animate-slide-down text-[12.5px] font-semibold">
            <AlertCircle size={15} className="shrink-0 mt-0.5 text-[#c93838]" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-5 bg-[#edf7f1] border border-[#bee2cc] text-[#1c6642] px-4 py-3 rounded-xl flex items-start gap-2.5 animate-slide-down text-[12.5px] font-semibold">
            <Check size={15} className="shrink-0 mt-0.5 text-[#258a58]" />
            <span>{success}</span>
          </div>
        )}

        {step === 1 && !success && (
          <div className="space-y-5">
            <div className="p-4 sm:p-5 bg-[#faf8f5] rounded-xl border border-[#ebe3d8]">
              <p className="text-[#8d8276] text-[10.5px] font-bold uppercase tracking-[0.14em] mb-1.5 flex items-center gap-1.5">
                <Mail size={11.5} className="text-[#9a7b56]" /> Verification Target
              </p>
              <p className="text-[14px] font-bold text-[#151413] break-all">{user?.email}</p>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleVerifyEmail}
                disabled={loading}
                className="w-full sm:w-auto sm:min-w-[230px] h-11 px-8 bg-[#161514] hover:bg-[#2c2926] text-white text-[11.5px] font-bold uppercase tracking-[0.14em] rounded-full transition-all duration-200 shadow-[0_8px_22px_rgba(22,21,20,0.14)] hover:-translate-y-0.5 active:scale-[0.99] disabled:opacity-50 disabled:hover:translate-y-0 cursor-pointer"
              >
                {loading ? "Sending..." : "Send OTP to Email"}
              </button>
            </div>
          </div>
        )}

        {step === 2 && !success && (
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="block text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#5c544b] px-0.5">
                6-Digit Authenticator
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                maxLength="6"
                placeholder="000000"
                className="w-full px-4 py-4 border border-[#E4DED6] rounded-[14px] focus:outline-none focus:border-[#C9A77A] focus:ring-4 focus:ring-[#C9A77A]/15 transition-all text-center text-2xl sm:text-3xl tracking-[0.3em] font-bold bg-white text-[#151413]"
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#7a7064] hover:text-[#151413] transition-colors py-2 cursor-pointer"
              >
                ← Back to Selection
              </button>
              <button
                type="button"
                onClick={handleVerifyOTP}
                disabled={loading}
                className="w-full sm:w-auto sm:min-w-[210px] h-11 px-8 bg-[#161514] hover:bg-[#2c2926] text-white text-[11.5px] font-bold uppercase tracking-[0.14em] rounded-full transition-all duration-200 shadow-[0_8px_22px_rgba(22,21,20,0.14)] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? "Verifying..." : "Confirm Access"}
              </button>
            </div>
          </div>
        )}

        {step === 3 && !success && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#5c544b] px-0.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-[50px] px-4 bg-white border border-[#E4DED6] rounded-[14px] focus:outline-none focus:border-[#C9A77A] focus:ring-4 focus:ring-[#C9A77A]/15 transition-all text-[13.5px] font-medium pr-12 text-[#151413]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8d8276] hover:text-[#151413] transition-colors cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#5c544b] px-0.5">
                  Repeat Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-[50px] px-4 bg-white border border-[#E4DED6] rounded-[14px] focus:outline-none focus:border-[#C9A77A] focus:ring-4 focus:ring-[#C9A77A]/15 transition-all text-[13.5px] font-medium pr-12 text-[#151413]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8d8276] hover:text-[#151413] transition-colors cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#7a7064] hover:text-[#151413] transition-colors py-2 cursor-pointer"
              >
                ← Back to Auth
              </button>
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={loading}
                className="w-full sm:w-auto sm:min-w-[200px] h-11 px-8 bg-[#161514] hover:bg-[#2c2926] text-white text-[11.5px] font-bold uppercase tracking-[0.14em] rounded-full transition-all duration-200 shadow-[0_8px_22px_rgba(22,21,20,0.14)] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? "Confirming..." : "Confirm"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
