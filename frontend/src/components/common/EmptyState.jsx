import { Button } from "./Button";

export const EmptyState = ({ title = "No data found", description = "There's nothing to display right now.", action = null, dark = false }) => {
  const isDark = Boolean(dark);

  return (
    <div className="flex flex-col items-center justify-center py-14 px-5 text-center">
      <div
        className={`w-15 h-15 rounded-2xl flex items-center justify-center mb-4 ${
          isDark
            ? "bg-white/[0.03] border border-white/[0.06]"
            : "bg-[#f6f1ea] border border-[#eae1d5]"
        }`}
      >
        <svg className={`w-7 h-7 ${isDark ? "text-neutral-500" : "text-[#9a7b56]"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.7}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      </div>
      <h3 className={`text-[16px] font-headline font-bold tracking-[-0.01em] mb-1.5 ${isDark ? "text-white" : "text-[#151413]"}`}>{title}</h3>
      <p className={`text-center text-[13.5px] font-medium max-w-md leading-relaxed mb-5 ${isDark ? "text-neutral-500" : "text-[#7a7064]"}`}>{description}</p>
      {action && <Button dark={isDark} {...action}>{action.label}</Button>}
    </div>
  );
};
