import { forwardRef } from "react";

export const Input = forwardRef(({ label, error, className = "", dark = false, ...props }, ref) => {
  const isDark = Boolean(dark);

  return (
    <div className="w-full">
      {label && (
        <label className={`block text-[10px] font-black mb-2 ml-1 uppercase tracking-widest ${isDark ? "text-neutral-400" : "text-[#77736E]"}`}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`w-full px-4 py-3.5 border rounded-[14px] transition-all duration-200 outline-none text-[13.5px] font-bold shadow-2xs focus:ring-4 h-[52px] ${
          isDark
            ? `bg-[#1b1b1b] text-white placeholder:text-neutral-500 placeholder:font-medium ${error ? "border-red-500/40 focus:ring-red-500/15 text-red-400" : "border-white/[0.08] hover:border-white/20 focus:bg-[#202020] focus:border-white/30 focus:ring-white/10"}`
            : `bg-white text-[#171717] placeholder:text-[#9d978f] placeholder:font-medium hover:border-[#D6CDBF] focus:bg-white ${error ? "border-red-400 focus:ring-red-100 text-red-600" : "border-[#E4DED6] focus:border-[#C9A77A] focus:ring-[#C9A77A]/15"}`
        } ${className}`}
        {...props}
      />
      {error && (
        <div className={`flex items-center gap-1.5 mt-1.5 ml-1 ${isDark ? "text-red-400" : "text-red-600"}`}>
          <span className="material-symbols-outlined text-[14px] font-black">error</span>
          <p className="text-[11px] font-bold tracking-tight">{error}</p>
        </div>
      )}
    </div>
  );
});

Input.displayName = "Input";
