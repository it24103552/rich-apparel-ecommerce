export const Button = ({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  className = "",
  children,
  dark,
  ...props
}) => {
  const isDark = dark ?? (typeof window !== "undefined" && window.location.pathname.startsWith("/admin"));

  const baseClasses = isDark
    ? "font-headline font-semibold rounded-2xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95"
    : "font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

  const sizeClasses = {
    sm: "px-3.5 py-2 text-[12px]",
    md: isDark ? "px-5 py-2.5 text-[13px]" : "px-4 py-2 text-base",
    lg: isDark ? "px-6 py-3 text-[14px]" : "px-6 py-3 text-lg",
  };

  const variantClasses = isDark
    ? {
        primary: "bg-white text-black hover:bg-neutral-200 shadow-[0_8px_24px_rgba(255,255,255,0.08)]",
        secondary: "bg-[#1b1b1b] text-neutral-200 hover:bg-[#242424] hover:text-white border border-white/[0.08]",
        danger: "bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/30",
        outline: "bg-[#171717] text-white hover:bg-[#222222] border border-white/[0.08]",
        ghost: "bg-transparent text-neutral-300 hover:bg-white/[0.06] hover:text-white border border-white/15",
        dark: "bg-white text-black hover:bg-neutral-200 uppercase font-bold tracking-widest",
        white: "bg-white text-black hover:bg-neutral-200 uppercase font-bold tracking-widest shadow-lg",
      }
    : {
        primary: "bg-black text-white hover:bg-zinc-800 focus:ring-black",
        secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500",
        danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
        outline: "border-2 border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500",
        ghost: "bg-transparent text-black hover:bg-neutral-50 focus:ring-black border border-black",
        dark: "bg-black text-white hover:bg-zinc-800 focus:ring-black rounded-xl uppercase font-bold tracking-widest",
        white: "bg-white text-black hover:bg-neutral-100 focus:ring-white rounded-xl uppercase font-bold tracking-widest shadow-lg",
      };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant] || variantClasses.primary} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
};
