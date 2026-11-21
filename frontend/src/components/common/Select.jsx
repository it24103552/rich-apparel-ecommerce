import { forwardRef } from "react";

export const Select = forwardRef(({ label, options = [], error, hidePlaceholder = false, className = "", containerClassName = "", fullWidth = true, dark = false, ...props }, ref) => {
  const isDark = Boolean(dark);

  return (
    <div className={`${fullWidth ? "w-full" : ""} ${containerClassName}`}>
      {label && (
        <label className={`block text-[10px] font-black mb-2 ml-1 uppercase tracking-widest ${isDark ? "text-neutral-400" : "text-[#77736E]"}`}>
          {label}
        </label>
      )}
      <div className={`relative group/select ${containerClassName}`}>
        <select
          ref={ref}
          className={`w-full pl-4 pr-10 py-3.5 border rounded-[14px] transition-all duration-200 outline-none text-[13.5px] font-bold appearance-none cursor-pointer h-[52px] ${
            isDark
              ? `bg-[#0b0b0b] hover:bg-[#1a1a1a] focus:bg-[#1a1a1a] text-white focus:ring-4 focus:ring-white/10 ${error ? "border-red-500/40 focus:ring-red-500/15 text-red-400" : "border-white/[0.08] focus:border-white/30"}`
              : `bg-white text-[#171717] hover:bg-[#FAF8F5] hover:border-[#D6CDBF] focus:bg-white focus:ring-4 ${error ? "border-red-400 focus:ring-red-100 text-red-600" : "border-[#E4DED6] focus:border-[#C9A77A] focus:ring-[#C9A77A]/15"}`
          } ${className}`}
          {...props}
        >
          {!hidePlaceholder && <option value="" disabled className={isDark ? "bg-[#141414] text-neutral-400" : "bg-white text-[#77736E]"}>Select {label?.toLowerCase() || "option"}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className={isDark ? "bg-[#141414] text-white" : "bg-white text-[#171717]"}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none transition-all duration-200 ${isDark ? "text-neutral-400 group-hover/select:text-white" : "text-[#77736E] group-hover/select:text-[#171717]"}`}>
          <span className="material-symbols-outlined text-[18px] font-bold leading-none">unfold_more</span>
        </div>
      </div>
      {error && (
        <div className={`flex items-center gap-1.5 mt-1.5 ml-1 font-body ${isDark ? "text-red-400" : "text-red-600"}`}>
          <span className="material-symbols-outlined text-[14px] font-black">error</span>
          <p className="text-[11px] font-bold tracking-tight">{error}</p>
        </div>
      )}
    </div>
  );
});

Select.displayName = "Select";
