import { Modal } from "./Modal";
import { Button } from "./Button";

export const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, loading = false, isConfirmLoading = false, isDanger = true, confirmText, confirmVariant, dark }) => {
  const isDark = dark ?? (typeof window !== "undefined" && window.location.pathname.startsWith("/admin"));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm" dark={isDark}>
      <div className="py-2">
        <p className={`mb-8 font-medium leading-relaxed text-[14px] ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading || isConfirmLoading}
            className={`px-5 py-2.5 rounded-[14px] border text-[11px] font-black uppercase tracking-widest transition-all disabled:opacity-50 ${
              isDark
                ? "border-white/10 bg-[#1b1b1b] text-neutral-300 hover:bg-[#242424] hover:text-white"
                : "border-neutral-200 text-neutral-500 hover:bg-neutral-50"
            }`}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading || isConfirmLoading}
            className={`px-6 py-2.5 rounded-[14px] text-[11px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 flex items-center gap-2 disabled:opacity-70 ${confirmVariant === "danger" || (isDanger && !confirmVariant)
              ? "bg-red-500 hover:bg-red-600 text-white shadow-red-900/20"
              : (isDark ? "bg-white hover:bg-neutral-200 text-black" : "bg-black hover:bg-neutral-800 text-white shadow-neutral-200")
              }`}
          >
            {(loading || isConfirmLoading) && <span className="material-symbols-outlined animate-spin text-[14px]">progress_activity</span>}
            {confirmText || (isDanger ? "Delete" : "Confirm Action")}
          </button>
        </div>
      </div>
    </Modal>
  );
};
