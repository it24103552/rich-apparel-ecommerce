import { useEffect } from "react";
import { X } from "lucide-react";

export const Modal = ({ isOpen, onClose, title, size = "md", children, actions, dark }) => {
  const isDark = dark ?? (typeof window !== "undefined" && window.location.pathname.startsWith("/admin"));

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => (document.body.style.overflow = "auto");
  }, [isOpen]);

  if (!isOpen) return null;

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
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-fade-in">
      <div className={`${isDark ? "bg-[#141414]/95 border border-white/[0.08] text-white shadow-[0_24px_80px_rgba(0,0,0,0.75)]" : "bg-white border border-[#E4DED6] text-[#171717] shadow-[0_24px_80px_rgba(23,23,23,0.16)]"} rounded-[28px] ${sizeClasses[size]} w-full overflow-hidden transition-all duration-500 scale-in-center`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-8 py-6 border-b ${isDark ? "border-white/[0.07]" : "border-[#E4DED6] bg-[#FAF8F5]/70"}`}>
          <div className="flex items-center gap-4">
            {typeof title === "string" ? (
              <h2 className={`text-[20px] font-headline font-black tracking-tight leading-none ${isDark ? "text-white" : "text-[#171717]"}`}>{title}</h2>
            ) : (
              title
            )}
          </div>
          <div className="flex items-center gap-3">
            {actions && <div className="flex items-center gap-2 mr-2">{actions}</div>}
            <button
              onClick={onClose}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95 ${isDark ? "text-neutral-400 hover:text-white hover:bg-white/[0.08]" : "text-[#77736E] hover:text-[#171717] hover:bg-[#F1ECE5]"}`}
              aria-label="Close modal"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={`p-8 max-h-[85vh] overflow-y-auto ${isDark ? "custom-scrollbar custom-scrollbar-dark" : "hide-scrollbar"}`}>{children}</div>
      </div>
    </div>
  );
};
