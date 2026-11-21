export const Button = ({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  className = "",
  children,
  dark = false,
  ...props
}) => {
  const isDark = Boolean(dark);

  const baseClasses = isDark
    ? "font-headline font-semibold rounded-2xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95 inline-flex items-center justify-center gap-2"
    : "font-headline font-semibold rounded-2xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A77A]/60 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95 inline-flex items-center justify-center gap-2";

  const sizeClasses = {
    sm: "px-3.5 py-2 text-[12px]",
    md: "px-5 py-2.5 text-[13px]",
    lg: "px-6 py-3 text-[14px]",
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
        primary: "bg-[#171717] text-white hover:bg-[#292929] shadow-[0_6px_16px_rgba(23,23,23,0.14)]",
        secondary: "bg-white text-[#171717] hover:bg-[#F1ECE5] border border-[#E4DED6]",
        danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
        outline: "bg-white border border-[#E4DED6] text-[#292929] hover:bg-[#FAF8F5] hover:border-[#D6CDBF]",
        ghost: "bg-transparent text-[#171717] hover:bg-[#F1ECE5] border border-[#E4DED6]",
        dark: "bg-[#171717] text-white hover:bg-[#292929] uppercase font-bold tracking-widest",
        white: "bg-white text-[#171717] hover:bg-[#FAF8F5] uppercase font-bold tracking-widest shadow-lg",
      };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size] || sizeClasses.md} ${variantClasses[variant] || variantClasses.primary} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
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
