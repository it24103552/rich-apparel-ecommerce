export const Textarea = ({ label, error, rows = 4, className = "", dark = false, ...props }) => {
  const isDark = Boolean(dark);

  return (
    <div className="w-full">
      {label && (
        <label className={`block text-[10px] font-black mb-2 ml-1 uppercase tracking-widest ${isDark ? "text-neutral-400" : "text-[#77736E]"}`}>
          {label}
        </label>
      )}
      <textarea
        rows={rows}
        className={`w-full px-4 py-3.5 border rounded-[14px] transition-all duration-200 outline-none text-[13.5px] font-medium shadow-2xs focus:ring-4 resize-none ${
          isDark
            ? `bg-[#1b1b1b] text-white placeholder:text-neutral-500 ${error ? "border-red-500/40 focus:ring-red-500/15 text-red-400" : "border-white/[0.08] hover:border-white/20 focus:bg-[#202020] focus:border-white/30 focus:ring-white/10"}`
            : `bg-white text-[#171717] placeholder:text-[#9d978f] hover:border-[#D6CDBF] focus:bg-white ${error ? "border-red-400 focus:ring-red-100 text-red-600" : "border-[#E4DED6] focus:border-[#C9A77A] focus:ring-[#C9A77A]/15"}`
        } ${className}`}
        {...props}
      />
      {error && (
        <div className={`flex items-center gap-1.5 mt-1.5 ml-1 font-body ${isDark ? "text-red-400" : "text-red-600"}`}>
          <span className="material-symbols-outlined text-[14px] font-black">error</span>
          <p className="text-[11px] font-bold tracking-tight">{error}</p>
        </div>
      )}
    </div>
  );
};
