import { Button } from "./Button";

export const EmptyState = ({ title = "No data found", description = "There's nothing to display right now.", action = null, dark }) => {
  const isDark = dark ?? (typeof window !== "undefined" && window.location.pathname.startsWith("/admin"));

  return (
    <div className="flex flex-col items-center justify-center py-14 px-4">
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${isDark ? "bg-white/[0.03] border border-white/[0.06]" : "admin-section shadow-xs"}`}>
        <svg className={`w-8 h-8 ${isDark ? "text-neutral-500" : "text-[#9A7B4A]"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      </div>
      <h3 className={`text-base font-headline font-bold mb-1.5 ${isDark ? "text-white" : "text-[#171717]"}`}>{title}</h3>
      <p className={`text-center text-sm mb-4 ${isDark ? "text-neutral-500" : "text-[#77736E]"}`}>{description}</p>
      {action && <Button dark={isDark} {...action}>{action.label}</Button>}
    </div>
  );
};
