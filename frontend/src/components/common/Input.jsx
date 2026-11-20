import { forwardRef } from "react";

export const Input = forwardRef(({ label, error, className = "", dark, ...props }, ref) => {
  const isDark = dark ?? (typeof window !== "undefined" && window.location.pathname.startsWith("/admin"));

  return (
    <div className="w-full">
      {label && (
        <label className={`block text-[11px] font-bold mb-2.5 ml-1 uppercase tracking-widest ${isDark ? "text-neutral-400" : "text-black text-[12px] mb-3"}`}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`w-full px-5 py-4 border rounded-[18px] transition-all duration-300 outline-none text-[13.5px] font-bold shadow-sm focus:ring-4 ${
          isDark
            ? `bg-[#1b1b1b] text-white placeholder:text-neutral-500 placeholder:font-medium ${error ? "border-red-500/40 focus:ring-red-500/15 text-red-400" : "border-white/[0.08] hover:border-white/20 focus:bg-[#202020] focus:border-white/30 focus:ring-white/10"}`
            : `bg-white text-[#171717] placeholder:text-[#9d978f] placeholder:font-medium hover:border-[#D6CDBF] focus:bg-white ${error ? "border-red-300 focus:ring-red-100 text-red-600" : "border-[#E4DED6] focus:border-[#171717] focus:ring-[#C9A77A]/15"}`
        } ${className}`}
        {...props}
      />
      {error && (
        <div className="flex items-center gap-1.5 mt-2 ml-1 text-red-400">
          <span className="material-symbols-outlined text-[14px] font-black">error</span>
          <p className="text-[11px] font-bold uppercase tracking-wider">{error}</p>
        </div>
      )}
    </div>
  );
});

Input.displayName = "Input";
