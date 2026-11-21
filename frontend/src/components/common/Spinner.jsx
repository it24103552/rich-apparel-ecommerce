export const Spinner = ({ size = "md", fullPage = false, color, dark = false }) => {
  const isDark = Boolean(dark);

  const sizeClasses = {
    xs: "h-3.5 w-3.5",
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const colorClass = color === "white" ? "text-white" : color === "black" ? "text-black" : (isDark ? "text-white" : "text-black");

  const spinner = (
    <svg className={`animate-spin ${sizeClasses[size] || sizeClasses.md} ${colorClass}`} viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );

  if (fullPage) {
    return (
      <div className="min-h-[60vh] w-full flex items-center justify-center bg-[#fafafa]">
        {spinner}
      </div>
    );
  }

  return <div className="flex justify-center items-center">{spinner}</div>;
};
