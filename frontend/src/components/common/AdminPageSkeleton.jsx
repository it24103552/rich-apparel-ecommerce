export const AdminPageSkeleton = ({ dark }) => {
    const isDark = dark ?? (typeof window !== "undefined" && window.location.pathname.startsWith("/admin"));
    if (isDark) {
      return (
        <div className="min-h-[calc(100vh-120px)] w-full animate-fade-in pointer-events-none select-none overflow-x-hidden space-y-6">
          {/* Header Actions Skeleton */}
          <div className="flex justify-end gap-3">
            <div className="h-11 w-36 bg-[#141414] border border-white/[0.06] rounded-2xl animate-pulse"></div>
            <div className="h-11 w-11 bg-white/10 rounded-2xl animate-pulse"></div>
          </div>

          {/* KPI Grid Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-[#141414] border border-white/[0.08] rounded-[24px] p-5 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-[#202020] animate-pulse"></div>
                  <div className="h-6 w-16 rounded-full bg-[#202020] animate-pulse"></div>
                </div>
                <div className="bg-[#1b1b1b] border border-white/[0.04] rounded-[18px] p-4 space-y-2.5">
                  <div className="h-2.5 w-24 bg-white/10 rounded animate-pulse"></div>
                  <div className="h-6 w-32 bg-white/15 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Centerpiece Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[#141414] border border-white/[0.08] rounded-[26px] p-6 space-y-5">
              <div className="space-y-2">
                <div className="h-5 w-44 bg-white/15 rounded animate-pulse"></div>
                <div className="h-3 w-36 bg-white/10 rounded animate-pulse"></div>
              </div>
              <div className="h-[280px] w-full rounded-[20px] bg-[#1b1b1b] border border-white/[0.04] animate-pulse"></div>
            </div>
            <div className="space-y-6">
              <div className="bg-[#141414] border border-white/[0.08] rounded-[26px] p-6 space-y-4">
                <div className="h-4 w-32 bg-white/15 rounded animate-pulse"></div>
                {[1, 2, 3].map((row) => (
                  <div key={row} className="h-16 rounded-[18px] bg-[#1b1b1b] border border-white/[0.04] animate-pulse"></div>
                ))}
              </div>
              <div className="bg-[#141414] border border-white/[0.08] rounded-[26px] p-6">
                <div className="h-24 rounded-[18px] bg-[#1b1b1b] border border-white/[0.04] animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Activity Skeleton */}
          <div className="bg-[#141414] border border-white/[0.08] rounded-[26px] p-6 space-y-3">
            <div className="h-5 w-32 bg-white/15 rounded animate-pulse mb-4"></div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-[18px] bg-[#1b1b1b] border border-white/[0.04] animate-pulse"></div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-[#FAF8F5] min-h-[calc(100vh-120px)] w-full animate-fade-in pointer-events-none select-none overflow-x-hidden space-y-6">
        {/* Header Actions */}
        <div className="flex justify-end gap-3 pt-1">
          <div className="h-11 w-32 bg-white border border-[#E4DED6] rounded-2xl animate-pulse"></div>
          <div className="h-11 w-40 bg-[#171717]/15 rounded-2xl animate-pulse"></div>
        </div>
        
        {/* Filter Console Skeleton */}
        <div className="bg-white rounded-[24px] border border-[#E4DED6] p-3 flex flex-col lg:flex-row gap-3 animate-pulse">
          <div className="flex-1 h-12 bg-[#FAF8F5] border border-[#E4DED6] rounded-2xl"></div>
          <div className="h-12 w-32 rounded-2xl bg-[#F1ECE5]"></div>
        </div>
  
        {/* Main List Container */}
        <div className="space-y-3">
          <div className="hidden md:flex h-11 bg-[#F1ECE5] border border-[#E4DED6] rounded-2xl px-5 items-center">
            <div className="h-2.5 w-1/4 bg-[#DDD5C9] rounded animate-pulse"></div>
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col md:flex-row md:items-center py-4 px-5 bg-white border border-[#E4DED6] rounded-[18px] gap-4">
              <div className="w-full md:w-1/3 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#F1ECE5] animate-pulse shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-3/4 bg-[#EFEAE2] rounded animate-pulse"></div>
                  <div className="h-2.5 w-1/2 bg-[#F5F1EB] rounded animate-pulse"></div>
                </div>
              </div>
              <div className="w-full md:w-[20%]"><div className="h-3 w-20 bg-[#F1ECE5] animate-pulse rounded"></div></div>
              <div className="w-full md:w-[20%]"><div className="h-3 w-24 bg-[#F1ECE5] animate-pulse rounded"></div></div>
              <div className="w-full md:w-[15%]"><div className="h-6 w-16 bg-[#F1ECE5] animate-pulse rounded-full"></div></div>
              <div className="w-full md:w-[12%] flex justify-end gap-1.5">
                <div className="w-9 h-9 rounded-xl bg-[#F5F1EB] animate-pulse"></div>
                <div className="w-9 h-9 rounded-xl bg-[#F5F1EB] animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
