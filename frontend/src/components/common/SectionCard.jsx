/**
 * Shared Warm Light Atelier section container for admin forms, panels, and modal subsections.
 */
export const SectionCard = ({
  title,
  icon,
  action = null,
  children,
  className = "",
}) => {
  return (
    <section className={`bg-[#FAF8F5] rounded-[24px] p-6 border border-[#E4DED6] ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <div className="w-9 h-9 rounded-xl bg-white border border-[#E4DED6] flex items-center justify-center text-[#9A7B4A] shrink-0 shadow-2xs">
                <span className="material-symbols-outlined text-[18px]">{icon}</span>
              </div>
            )}
            {title && (
              <h3 className="text-[15px] font-headline font-bold text-[#171717] tracking-tight truncate">
                {title}
              </h3>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
};
