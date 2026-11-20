export const Textarea = ({ label, error, rows = 4, className = "", dark, ...props }) => {
  const isDark = dark ?? (typeof window !== "undefined" && window.location.pathname.startsWith("/admin"));

  return (
    <div className="w-full">
      {label && (
        <label className={`block text-[12px] font-bold mb-2 ml-1 uppercase tracking-widest ${isDark ? "text-neutral-400" : "text-neutral-800 text-[13px] normal-case tracking-normal"}`}>
          {label}
        </label>
      )}
      <textarea
        rows={rows}
        className={`w-full px-5 py-3.5 border rounded-[20px] transition-all duration-300 outline-none text-[13.5px] font-medium shadow-sm focus:ring-4 resize-none ${
          isDark
            ? `bg-[#1b1b1b] text-white placeholder:text-neutral-500 ${error ? "border-red-500/40 focus:ring-red-500/15 text-red-400" : "border-white/[0.08] hover:border-white/20 focus:bg-[#202020] focus:border-white/30 focus:ring-white/10"}`
            : `bg-neutral-50/50 placeholder:text-neutral-300 hover:bg-neutral-50 focus:bg-white ${error ? "border-red-200 focus:ring-red-100/50 text-red-600" : "border-neutral-100 focus:border-black focus:ring-black/5"}`
        } ${className}`}
        {...props}
      />
      {error && (
        <div className="flex items-center gap-1.5 mt-2 ml-1 text-red-400 font-body">
          <span className="material-symbols-outlined text-[14px] font-black">error</span>
          <p className="text-[11px] font-bold uppercase tracking-wider">{error}</p>
        </div>
      )}
    </div>
  );
};
