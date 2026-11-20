import { forwardRef } from "react";

export const Select = forwardRef(({ label, options = [], error, hidePlaceholder = false, className = "", containerClassName = "", fullWidth = true, dark, ...props }, ref) => {
  const isDark = dark ?? (typeof window !== "undefined" && window.location.pathname.startsWith("/admin"));

  return (
    <div className={`${fullWidth ? "w-full" : ""} ${containerClassName}`}>
      {label && (
        <label className={`block text-[12px] font-bold mb-2 ml-1 uppercase tracking-widest ${isDark ? "text-neutral-400" : "text-neutral-800 text-[13px] normal-case tracking-normal"}`}>
          {label}
        </label>
      )}
      <div className={`relative group/select ${containerClassName}`}>
        <select
          ref={ref}
          className={`w-full pl-5 pr-10 py-3.5 border rounded-[18px] transition-all duration-300 outline-none text-[13.5px] font-bold appearance-none cursor-pointer ${
            isDark
              ? `bg-[#0b0b0b] hover:bg-[#1a1a1a] focus:bg-[#1a1a1a] text-white focus:ring-4 focus:ring-white/10 ${error ? "border-red-500/40 focus:ring-red-500/15 text-red-400" : "border-white/[0.08] focus:border-white/30"}`
              : `bg-white/70 backdrop-blur-md border-neutral-200/50 placeholder:text-neutral-300 placeholder:font-medium shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] hover:bg-white focus:bg-white focus:ring-8 focus:ring-black/5 focus:border-neutral-300 ${error ? "border-red-200 focus:ring-red-100/50 text-red-600" : ""}`
          } ${className}`}
          {...props}
        >
          {!hidePlaceholder && <option value="" disabled className={isDark ? "bg-[#141414] text-neutral-400" : ""}>Select {label?.toLowerCase() || "option"}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className={isDark ? "bg-[#141414] text-white" : ""}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300 ${isDark ? "text-neutral-400 group-hover/select:text-white" : "text-neutral-400 group-hover/select:text-neutral-900 group-hover/select:translate-y-[-40%]"}`}>
          <span className="material-symbols-outlined text-[16px] font-black leading-none opacity-60">unfold_more</span>
        </div>
      </div>
      {error && (
        <div className="flex items-center gap-1.5 mt-2 ml-1 text-red-400 font-body">
          <span className="material-symbols-outlined text-[14px] font-black">error</span>
          <p className="text-[11px] font-bold uppercase tracking-wider">{error}</p>
        </div>
      )}
    </div>
  );
});

Select.displayName = "Select";
