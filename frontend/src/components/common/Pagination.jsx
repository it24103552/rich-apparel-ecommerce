import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "./Button";

export const Pagination = ({ currentPage = 1, totalPages = 1, onPageChange, dark = false }) => {
  const isDark = Boolean(dark);
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5; // Content pages between arrows

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      // Always include page 1
      pages.push(1);

      if (currentPage > 3) {
        pages.push("ellipsis-start");
      }

      // Middle pages range
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      // Adjust range if we're near the start or end to keep fixed number of buttons
      let adjustedStart = start;
      let adjustedEnd = end;

      if (currentPage <= 3) {
          adjustedEnd = 4;
      } else if (currentPage >= totalPages - 2) {
          adjustedStart = totalPages - 3;
      }

      for (let i = adjustedStart; i <= adjustedEnd; i++) {
        if (!pages.includes(i)) pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("ellipsis-end");
      }

      // Always include last page
      if (!pages.includes(totalPages)) {
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="flex items-center justify-between w-full mt-4 sm:mt-0 select-none">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Button
          dark={isDark}
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={isDark ? "h-9 w-9 p-0 rounded-xl flex items-center justify-center bg-[#141414]! text-neutral-300! border border-white/[0.08] hover:border-white hover:bg-white! hover:text-black! transition-all disabled:opacity-30 disabled:hover:bg-[#141414]! disabled:hover:text-neutral-300! disabled:hover:border-white/[0.08]" : "h-9 w-9 p-0 rounded-xl flex items-center justify-center bg-white border border-[#E4DED6] text-[#171717] hover:border-[#171717] hover:bg-[#171717] hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-[#77736E] disabled:hover:border-[#E4DED6]"}
        >
          <ChevronLeft size={16} />
        </Button>

        <div className="flex gap-1.5 sm:gap-2 items-center">
          {pages.map((page, i) => {
            if (page === "ellipsis-start" || page === "ellipsis-end") {
              return (
                <div key={`${page}-${i}`} className={`w-8 h-9 flex items-center justify-center ${isDark ? "text-neutral-600" : "text-[#8a857d]"}`}>
                  <MoreHorizontal size={14} />
                </div>
              );
            }

            const isSelected = currentPage === page;
            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`h-9 min-w-[36px] px-2 rounded-xl text-[12px] font-bold tracking-tight transition-all duration-200 ${
                  isSelected
                    ? (isDark ? "bg-white text-black shadow-md shadow-white/10 scale-105" : "bg-[#171717] text-white shadow-sm scale-105")
                    : (isDark ? "bg-[#141414] text-neutral-400 hover:text-white border border-white/[0.06] hover:border-white/20 hover:bg-[#1a1a1a]" : "bg-white text-[#5f5a53] hover:text-[#171717] border border-[#E4DED6] hover:border-[#C9A77A] hover:bg-[#FAF8F5]")
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>

        <Button
          dark={isDark}
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={isDark ? "h-9 w-9 p-0 rounded-xl flex items-center justify-center bg-[#141414]! text-neutral-300! border border-white/[0.08] hover:border-white hover:bg-white! hover:text-black! transition-all disabled:opacity-30 disabled:hover:bg-[#141414]! disabled:hover:text-neutral-300! disabled:hover:border-white/[0.08]" : "h-9 w-9 p-0 rounded-xl flex items-center justify-center bg-white border border-[#E4DED6] text-[#171717] hover:border-[#171717] hover:bg-[#171717] hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-[#77736E] disabled:hover:border-[#E4DED6]"}
        >
          <ChevronRight size={16} />
        </Button>
      </div>

      <div className={`hidden md:flex items-center gap-2 pl-4 ml-4 border-l ${isDark ? "border-white/10" : "border-[#E4DED6]"}`}>
        <span className={`text-[10px] uppercase tracking-widest font-black ${isDark ? "text-neutral-600" : "text-[#8a857d]"}`}>Page</span>
        <span className={`text-[12px] font-black ${isDark ? "text-white" : "text-[#171717]"}`}>{currentPage}</span>
        <span className={`text-[10px] uppercase tracking-widest font-black ${isDark ? "text-neutral-600" : "text-[#8a857d]"}`}>of</span>
        <span className={`text-[12px] font-black ${isDark ? "text-white" : "text-[#171717]"}`}>{totalPages}</span>
      </div>
    </div>
  );
};
