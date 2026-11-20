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
    <div className="bg-[#fcfaf7] rounded-2xl border border-[#eae1d3] shadow-[0_2px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)] transition-shadow duration-300 p-6 sm:p-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 mb-6 border-b border-[#ece4d8]">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center shrink-0">
            <Lock className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-black uppercase tracking-[0.18em]">Change Password</h2>
            <p className="text-[11px] text-neutral-500 font-medium mt-0.5">Verify your email with a one-time passcode to update password</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f3eadc] border border-[#dfd2be] text-[9px] font-bold uppercase tracking-[0.16em] text-[#6d5940]">
          <ShieldCheck size={12} /> Security
        </span>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200/80 text-red-700 px-4 py-3 rounded-xl flex items-start gap-2.5 animate-slide-down text-xs font-semibold">
          <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200/80 text-emerald-800 px-4 py-3 rounded-xl flex items-start gap-2.5 animate-slide-down text-xs font-semibold">
          <Check size={15} className="shrink-0 mt-0.5 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {step === 1 && !success && (
        <div className="space-y-5">
          <div className="p-4 sm:p-5 bg-white rounded-xl border border-[#ece4d8]">
            <p className="text-neutral-400 text-[10px] font-bold uppercase tracking-[0.18em] mb-1.5 flex items-center gap-1.5">
              <Mail size={11} /> Verification Target
            </p>
            <p className="text-sm font-bold text-black break-all">{user?.email}</p>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleVerifyEmail}
              disabled={loading}
              className="w-full sm:w-auto sm:min-w-[240px] h-12 px-8 bg-black text-white text-[11px] font-bold uppercase tracking-[0.2em] rounded-full hover:bg-neutral-800 transition-all duration-300 shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:hover:translate-y-0 cursor-pointer"
            >
              {loading ? "Sending..." : "Send OTP to Email"}
            </button>
          </div>
        </div>
      )}

      {step === 2 && !success && (
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-700 px-1">
              6-Digit Authenticator
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.slice(0, 6))}
              maxLength="6"
              placeholder="000000"
              className="w-full px-4 py-4 border border-[#e2d8c8] rounded-xl focus:outline-none focus:border-black focus:ring-4 focus:ring-black/5 transition-all text-center text-2xl sm:text-3xl tracking-[0.3em] font-bold bg-white text-black"
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <button
              onClick={() => setStep(1)}
              className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500 hover:text-black transition-colors py-2 cursor-pointer"
            >
              ← Back to Selection
            </button>
            <button
              onClick={handleVerifyOTP}
              disabled={loading}
              className="w-full sm:w-auto sm:min-w-[220px] h-12 px-8 bg-black text-white text-[11px] font-bold uppercase tracking-[0.2em] rounded-full hover:bg-neutral-800 transition-all duration-300 shadow-[0_8px_24px_rgba(0,0,0,0.12)] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
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
              <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-700 px-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3.5 bg-white border border-[#e2d8c8] rounded-xl focus:outline-none focus:border-black focus:ring-4 focus:ring-black/5 transition-all text-sm font-medium pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black transition-colors cursor-pointer"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-700 px-1">
                Repeat Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3.5 bg-white border border-[#e2d8c8] rounded-xl focus:outline-none focus:border-black focus:ring-4 focus:ring-black/5 transition-all text-sm font-medium pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black transition-colors cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <button
              onClick={() => setStep(2)}
              className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500 hover:text-black transition-colors py-2 cursor-pointer"
            >
              ← Back to Auth
            </button>
            <button
              onClick={handleResetPassword}
              disabled={loading}
              className="w-full sm:w-auto sm:min-w-[200px] h-12 px-8 bg-black text-white text-[11px] font-bold uppercase tracking-[0.2em] rounded-full hover:bg-neutral-800 transition-all duration-300 shadow-[0_8px_24px_rgba(0,0,0,0.12)] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? "Confirming..." : "Confirm"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
