import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { usersService } from "../../../services";
import { useAuth } from "../../../hooks/useAuth";
import { useCart } from "../../../hooks/useCart";
import { Button } from "../../../components/common/Button";
import { Trash2, LogOut, AlertCircle } from "lucide-react";

export const DangerZone = ({ user }) => {
  const navigate = useNavigate();
  const { dispatch: authDispatch } = useAuth();
  const { dispatch: cartDispatch } = useCart();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    authDispatch({ type: "AUTH_LOGOUT" });
    // Cart auto-clears via CartContext watching isAuthenticated
    toast.success("Logged out successfully");
    navigate("/");
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      await usersService.delete(user.id);
      localStorage.removeItem("token");
      authDispatch({ type: "AUTH_LOGOUT" });
      // Cart auto-clears via CartContext watching isAuthenticated
      toast.success("Account deleted successfully");
      navigate("/");
    } catch (err) {
      const message = err.response?.data?.message || "Failed to delete account";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#e9e1d6] shadow-[0_2px_14px_rgba(32,25,18,0.035)] overflow-hidden animate-fade-in">
      <div className="px-6 sm:px-7 py-4 bg-[#faf7f2] border-b border-[#efe8de] flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-[#fdf0f0] border border-[#f0c7c7] flex items-center justify-center shrink-0">
          <AlertCircle size={17} className="text-[#c93838]" />
        </div>
        <div>
          <h2 className="text-[13.5px] font-extrabold text-[#151413] uppercase tracking-[0.14em]">Restricted Actions</h2>
          <p className="text-[12px] text-[#7a7064] font-medium mt-0.5">Session management and permanent account removal</p>
        </div>
      </div>

      <div className="p-6 sm:p-7 space-y-4">
        {/* Logout Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#faf8f5] border border-[#ebe3d8]">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-white border border-[#e6ddd0] flex items-center justify-center text-[#5c544b] shrink-0 mt-0.5">
              <LogOut size={15} />
            </div>
            <div>
              <p className="text-[12.5px] font-bold text-[#151413] uppercase tracking-[0.12em]">Logout</p>
              <p className="text-[12px] text-[#7a7064] font-medium mt-0.5">Sign out from this device</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full sm:w-auto h-10 px-6 rounded-full bg-white border border-[#d8cec0] text-[#151413] text-[11px] font-bold uppercase tracking-[0.14em] hover:bg-[#161514] hover:text-white hover:border-[#161514] transition-all active:scale-[0.98] cursor-pointer shrink-0"
          >
            Logout
          </button>
        </div>

        {/* Delete Account Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#fdf4f4] border border-[#f0c7c7]">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-white border border-[#f0c7c7] flex items-center justify-center text-[#c93838] shrink-0 mt-0.5">
              <Trash2 size={15} />
            </div>
            <div>
              <p className="text-[12.5px] font-bold text-[#9e2a2b] uppercase tracking-[0.12em]">Delete Account</p>
              <p className="text-[12px] text-[#9e2a2b]/75 font-medium mt-0.5">Permanently erase all data</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full sm:w-auto h-10 px-6 rounded-full bg-white border border-[#e8b4b4] text-[#9e2a2b] text-[11px] font-bold uppercase tracking-[0.14em] hover:bg-[#c93838] hover:text-white hover:border-[#c93838] transition-all active:scale-[0.98] cursor-pointer shrink-0"
          >
            Delete
          </button>
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="p-5 bg-[#fdf0f0] border border-[#f0c7c7] rounded-xl animate-fade-in mt-2">
            <p className="text-[#8a1f20] font-bold text-[12.5px] mb-4 leading-relaxed">
              Confirming this action will result in permanent loss of your account data.
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5 justify-end">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loading}
                className="h-10 px-6 bg-white border border-[#d8cec0] text-[#151413] text-[11px] font-bold uppercase tracking-[0.14em] rounded-full hover:border-[#161514] transition-all cursor-pointer"
              >
                Retreat
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={loading}
                className="h-10 px-6 bg-[#c93838] hover:bg-[#a82c2c] text-white text-[11px] font-bold uppercase tracking-[0.14em] rounded-full transition-all active:scale-[0.98] shadow-xs cursor-pointer"
              >
                {loading ? "Deleting..." : "Erase Profile"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
