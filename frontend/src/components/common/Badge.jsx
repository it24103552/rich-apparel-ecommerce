export const Badge = ({ color = "blue", children, dark }) => {
  const isDark = dark ?? (typeof window !== "undefined" && window.location.pathname.startsWith("/admin"));

  const colorClasses = isDark
    ? {
      blue: "bg-blue-500/15 text-blue-300 border border-blue-500/30",
      red: "bg-red-500/15 text-red-300 border border-red-500/30",
      green: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
      yellow: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
      indigo: "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30",
      purple: "bg-violet-500/15 text-violet-300 border border-violet-500/30",
      gray: "bg-white/10 text-neutral-300 border border-white/15",
      dark: "bg-white text-black font-bold tracking-widest uppercase",
    }
    : {
      blue: "bg-sky-50 text-sky-800 border border-sky-200",
      red: "bg-red-50 text-red-700 border border-red-200",
      green: "bg-emerald-50 text-emerald-800 border border-emerald-200",
      yellow: "bg-amber-50 text-amber-800 border border-amber-200",
      indigo: "bg-indigo-50 text-indigo-800 border border-indigo-200",
      purple: "bg-violet-50 text-violet-800 border border-violet-200",
      gray: "bg-[#F1ECE5] text-[#5f5a53] border border-[#E4DED6]",
      dark: "bg-[#171717] text-white px-3 py-1 font-bold tracking-widest text-[10px] uppercase",
    };

  const cls = colorClasses[color] || colorClasses.gray;
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${cls}`}>
      {children}
    </span>
  );
};
