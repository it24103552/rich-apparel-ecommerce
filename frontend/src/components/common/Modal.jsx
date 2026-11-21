import { useEffect, useId } from "react";
import { createPortal } from "react-dom";

const openModalStack = [];
let previousBodyOverflow = "";

/**
 * Shared viewport-level portal for modals, viewers, and dialogs.
 * Renders directly under document.body so parent overflow/stacking contexts
 * (such as AdminLayout, sticky headers, or sidebars) can never clip or cover dialogs.
 */
export const ModalPortal = ({
  isOpen,
  onClose,
  children,
  backdropClassName = "bg-black/75 backdrop-blur-md",
  containerClassName = "p-4",
}) => {
  const modalId = useId();

  useEffect(() => {
    if (!isOpen) return;

    if (openModalStack.length === 0) {
      previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    openModalStack.push(modalId);

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && onClose && openModalStack[openModalStack.length - 1] === modalId) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      const idx = openModalStack.lastIndexOf(modalId);
      if (idx !== -1) {
        openModalStack.splice(idx, 1);
      }
      if (openModalStack.length === 0) {
        document.body.style.overflow = previousBodyOverflow || "";
      }
    };
  }, [isOpen, onClose, modalId]);

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className={`fixed inset-0 z-50 flex items-center justify-center ${containerClassName}`}
    >
      <div
        className={`fixed inset-0 z-[49] animate-fade-in ${backdropClassName}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-50 w-full h-full flex items-center justify-center pointer-events-none [&>*]:pointer-events-auto">
        {children}
      </div>
    </div>,
    document.body
  );
};

export const Modal = ({ isOpen, onClose, title, size = "md", children, actions, dark = false }) => {
  const isDark = Boolean(dark);

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    "6xl": "max-w-6xl",
    "7xl": "max-w-7xl",
    full: "max-w-[95vw]",
  };

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={onClose}
      backdropClassName={isDark ? "bg-black/75 backdrop-blur-md" : "bg-[#171717]/45 backdrop-blur-sm"}
    >
      <div className={`${isDark ? "bg-[#141414]/95 border border-white/[0.08] text-white shadow-[0_24px_80px_rgba(0,0,0,0.75)]" : "bg-white border border-[#E4DED6] text-[#171717] shadow-[0_24px_64px_rgba(23,23,23,0.18)]"} rounded-[28px] ${sizeClasses[size]} w-full overflow-hidden transition-all duration-300`}>
        {/* Header */}
        <div className={`flex flex-wrap items-center justify-between gap-4 px-6 sm:px-8 py-5 sm:py-6 border-b ${isDark ? "border-white/[0.07]" : "border-[#E4DED6] bg-[#FAF8F5]"}`}>
          <div className="flex items-center gap-4 min-w-0">
            {typeof title === "string" ? (
              <h2 className={`text-[20px] font-headline font-black tracking-tight leading-none ${isDark ? "text-white" : "text-[#171717]"}`}>{title}</h2>
            ) : (
              title
            )}
          </div>
          <div className="flex items-center gap-3 ml-auto">
            {actions && <div className="flex items-center gap-2 mr-1">{actions}</div>}
            <button
              type="button"
              onClick={onClose}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 shrink-0 ${isDark ? "text-neutral-400 hover:text-white hover:bg-white/[0.08]" : "text-[#77736E] hover:text-[#171717] hover:bg-[#F1ECE5]"}`}
              aria-label="Close modal"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={`p-6 sm:p-8 max-h-[82vh] overflow-y-auto ${isDark ? "custom-scrollbar custom-scrollbar-dark" : "custom-scrollbar"}`}>{children}</div>
      </div>
    </ModalPortal>
  );
};
