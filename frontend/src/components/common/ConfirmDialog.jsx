import { Modal } from "./Modal";

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  loading = false,
  isConfirmLoading = false,
  isDanger = true,
  confirmText,
  confirmVariant,
  dark = false,
}) => {
  const isDark = Boolean(dark);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm" dark={isDark}>
      <div className="py-1">
        <p className={`mb-7 font-medium leading-relaxed text-[14px] ${isDark ? "text-neutral-400" : "text-[#5f5a53]"}`}>{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading || isConfirmLoading}
            className={`px-5 py-2.5 rounded-[14px] border text-[11px] font-black uppercase tracking-widest transition-all disabled:opacity-50 active:scale-95 ${
              isDark
                ? "border-white/10 bg-[#1b1b1b] text-neutral-300 hover:bg-[#242424] hover:text-white"
                : "border-[#E4DED6] bg-white text-[#5f5a53] hover:bg-[#F1ECE5] hover:text-[#171717]"
            }`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading || isConfirmLoading}
            className={`px-6 py-2.5 rounded-[14px] text-[11px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 flex items-center gap-2 disabled:opacity-70 ${
              confirmVariant === "danger" || (isDanger && !confirmVariant)
                ? "bg-red-600 hover:bg-red-700 text-white"
                : isDark
                  ? "bg-white hover:bg-neutral-200 text-black"
                  : "bg-[#171717] hover:bg-[#292929] text-white"
            }`}
          >
            {(loading || isConfirmLoading) && (
              <span className="material-symbols-outlined animate-spin text-[14px]">progress_activity</span>
            )}
            {confirmText || (isDanger ? "Delete" : "Confirm Action")}
          </button>
        </div>
      </div>
    </Modal>
  );
};
