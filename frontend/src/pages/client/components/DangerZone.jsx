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
    <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-[0_2px_16px_rgba(0,0,0,0.03)] p-6 sm:p-8 animate-fade-in">
      <div className="flex items-center gap-3.5 pb-5 mb-6 border-b border-neutral-100">
        <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
          <AlertCircle size={17} className="text-red-600" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-black uppercase tracking-[0.18em]">Restricted Actions</h2>
          <p className="text-[11px] text-neutral-500 font-medium mt-0.5">Session management and permanent account removal</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Logout Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#fafafa] border border-neutral-100">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-white border border-neutral-200/80 flex items-center justify-center text-neutral-700 shrink-0 mt-0.5">
              <LogOut size={15} />
            </div>
            <div>
              <p className="text-xs font-bold text-black uppercase tracking-[0.15em]">Logout</p>
              <p className="text-[11px] text-neutral-500 font-medium mt-0.5">Sign out from this device</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full sm:w-auto h-10 px-6 rounded-full bg-white border border-neutral-200 text-black text-[10px] font-bold uppercase tracking-[0.18em] hover:bg-black hover:text-white hover:border-black transition-all active:scale-[0.98] cursor-pointer shrink-0"
          >
            Logout
          </button>
        </div>

        {/* Delete Account Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-red-50/40 border border-red-200/60">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-white border border-red-200/80 flex items-center justify-center text-red-600 shrink-0 mt-0.5">
              <Trash2 size={15} />
            </div>
            <div>
              <p className="text-xs font-bold text-red-700 uppercase tracking-[0.15em]">Delete Account</p>
              <p className="text-[11px] text-red-600/70 font-medium mt-0.5">Permanently erase all data</p>
            </div>
          </div>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full sm:w-auto h-10 px-6 rounded-full bg-white border border-red-200 text-red-600 text-[10px] font-bold uppercase tracking-[0.18em] hover:bg-red-600 hover:text-white hover:border-red-600 transition-all active:scale-[0.98] cursor-pointer shrink-0"
          >
            Delete
          </button>
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="p-5 bg-red-50/70 border border-red-200 rounded-xl animate-fade-in mt-2">
            <p className="text-red-900 font-bold text-xs mb-4 leading-relaxed">
              Confirming this action will result in permanent loss of your account data.
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loading}
                className="h-10 px-6 bg-white border border-neutral-200 text-black text-[10px] font-bold uppercase tracking-[0.18em] rounded-full hover:bg-neutral-50 hover:border-black transition-all cursor-pointer"
              >
                Retreat
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={loading}
                className="h-10 px-6 bg-red-600 text-white text-[10px] font-bold uppercase tracking-[0.18em] rounded-full hover:bg-red-700 transition-all active:scale-[0.98] shadow-sm cursor-pointer"
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
