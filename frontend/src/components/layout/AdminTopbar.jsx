import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useLocation, useSearchParams } from "react-router-dom";
import { NotificationCenter } from "../notifications/NotificationCenter";
import { PasswordRequestsCenter } from "../notifications/PasswordRequestsCenter";

// `dark` is a presentation-only flag (dark admin theme). `light` is a presentation-only flag for the
// warm light theme on Product Management. No behaviour depends on either.
export const AdminTopbar = ({ dark = false, light = false }) => {
    const { user } = useAuth();
    const isAdmin = user?.role?.toLowerCase() === 'admin';
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPath = location.pathname;
  const isProductsPage = currentPath.includes('/admin/products');
  const isCategoriesPage = currentPath.includes('/admin/categories');
  const isDashboardPage = currentPath === '/admin' || currentPath.includes('/admin/dashboard');
  const isLoyaltyPage = currentPath.includes('/admin/loyalty') || 
                        currentPath.includes('/admin/coupons') || 
                        currentPath.includes('/admin/dashboard/loyalty');

  const [searchValue, setSearchValue] = useState(searchParams.get('search') || "");

  // Update URL internally via debounce to avoid spamming history or rerenders
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentSearch = searchParams.get('search') || "";
      if (searchValue !== currentSearch) {
        const newParams = new URLSearchParams(searchParams);
        if (searchValue) {
          newParams.set('search', searchValue);
        } else {
          newParams.delete('search');
        }
        setSearchParams(newParams, { replace: true });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue, searchParams, setSearchParams]);

  // Sync state if URL changes externally
  useEffect(() => {
    setSearchValue(searchParams.get('search') || "");
  }, [searchParams]);

  const getPageMeta = () => {
    if (isProductsPage) {
      return {
        title: "Product Management",
        subtitle: "Curate your digital showroom and manage stock levels.",
      };
    }
    if (isCategoriesPage) {
      return {
        title: "Category Management",
        subtitle: "Organize your collections and product classifications.",
      };
    }
    if (currentPath.includes('/admin/suppliers')) {
      return {
        title: "Supplier Network",
        subtitle: "Manage relationships with your distributors and manufacturing partners.",
      };
    }
    if (currentPath.includes('/admin/coupons')) {
      return {
        title: "Coupons & Promotions",
        subtitle: "Configure discount codes, target collections, and customer offers.",
      };
    }
    if (isLoyaltyPage) {
      return {
        title: "Loyalty & Rewards",
        subtitle: "Configure customer incentives and promotional programs.",
      };
    }
    if (currentPath.includes('/admin/orders')) {
      return {
        title: "Orders Archive",
        subtitle: "Manage and monitor all customer purchase activities.",
      };
    }
    if (currentPath.includes('/admin/payments')) {
      return {
        title: "Financial Settlements",
        subtitle: "Monitor and audit all digital and manual transaction flows.",
      };
    }
    if (currentPath.includes('/admin/returns')) {
      return {
        title: "Returns Management",
        subtitle: "Review return requests, process inspections, and manage replacements.",
      };
    }
    if (currentPath.includes('/admin/reviews')) {
      return {
        title: "Reviews Management",
        subtitle: "Monitor customer feedback, ratings, and submitted product media.",
      };
    }
    if (currentPath.includes('/admin/users')) {
      return {
        title: "Customers",
        subtitle: "View and manage registered customer accounts and loyalty points.",
      };
    }
    if (currentPath.includes('/admin/staff')) {
      return {
        title: "Staff Directory",
        subtitle: "Manage internal team members and role assignments.",
      };
    }
    if (currentPath.includes('/admin/roles')) {
      return {
        title: "Roles & Access",
        subtitle: "Manage administrative roles and monitor assigned team counts.",
      };
    }
    if (currentPath.includes('/admin/chat')) {
      return {
        title: "Customer Chat",
        subtitle: "Respond to live customer inquiries and support conversations.",
      };
    }
    if (currentPath.includes('/admin/settings')) {
      return {
        title: "Settings & Security",
        subtitle: "Manage your personal profile details and account security preferences.",
      };
    }
    if (currentPath.includes('/admin/history')) {
      return {
        title: "Activity History",
        subtitle: "A comprehensive log of administrative workflows, alerts, and inventory changes.",
        showSearch: true,
        placeholder: "Search activity history...",
      };
    }
    if (isDashboardPage) {
      const dashTitle = currentPath.includes('/admin/dashboard/product')
        ? "Product Overview"
        : currentPath.includes('/admin/dashboard/supplier')
        ? "Supplier Overview"
        : "System Overview";
      const dashSubtitle = currentPath.includes('/admin/dashboard/product')
        ? "Performance analytics for the current seasonal cycle."
        : currentPath.includes('/admin/dashboard/supplier')
        ? "Manage vendor relationships and supply chain velocity."
        : "Real-time performance metrics across all digital operations.";
      return { title: dashTitle, subtitle: dashSubtitle };
    }
    return null;
  };

  const pageMeta = getPageMeta();

  let headerContent = null;

  if (pageMeta) {
    headerContent = (
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 animate-fade-in">
        <div className="flex flex-col justify-center min-w-0">
          <h1 className={`font-headline font-extrabold tracking-tight leading-[1.1] truncate ${light ? "text-[22px] md:text-[32px] text-[#171717] uppercase" : dark ? "text-[22px] md:text-[30px] text-white" : "text-[28px] text-neutral-900"}`}>
            {pageMeta.title}
          </h1>
          <p className={`text-[13px] font-medium truncate ${light ? "text-[#77736E] mt-1.5" : dark ? "text-neutral-400 mt-1" : "text-neutral-500"}`}>
            {pageMeta.subtitle}
          </p>
        </div>
        {pageMeta.showSearch && (
          <div className="relative group w-full lg:w-72 shrink-0">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 text-[18px] group-focus-within:text-white transition-colors">search</span>
            <input
              className={`w-full rounded-2xl py-2.5 pl-10 pr-4 text-[13px] font-medium transition-all outline-none ${dark ? "bg-[#0b0b0b] border border-white/[0.08] text-white placeholder-neutral-500 focus:border-white/25" : "bg-surface-container-low border-none focus:ring-2 focus:ring-black/5 focus:bg-white"}`}
              placeholder={pageMeta.placeholder || "Search directory..."}
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>
        )}
      </div>
    );
  } else {
    // Show context-aware placeholder based on path
    let placeholder = "Search directory...";
    if (currentPath.includes('/admin/history')) placeholder = "Search activity history...";
    else if (currentPath.includes('/admin/users')) placeholder = "Search users...";
    else if (currentPath.includes('/admin/orders')) placeholder = "Search orders...";

    headerContent = (
      <div className="relative group">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">search</span>
        <input
          className="w-full bg-surface-container-low border-none rounded-full py-2.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-black/5 focus:bg-white transition-all outline-none"
          placeholder={placeholder}
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
      </div>
    );
  }

  if (light) {
    return (
      <header className="print:hidden sticky top-0 w-full px-4 md:px-8 pt-4 md:pt-6 pb-2 bg-[#FAF8F5]/85 backdrop-blur-xl z-20">
        <div className="relative admin-header-gradient w-full rounded-[24px] px-5 md:px-8 py-5 md:py-6 flex justify-between items-center gap-4">
          {/* Subtle organic layered shapes clipped strictly to header radius so popovers remain unclipped */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-[24px]"
          >
            <div className="admin-organic-shape absolute -top-24 -right-10 w-80 md:w-[500px] h-56 bg-[#E6D9C9]/45" />
            <div className="admin-organic-shape-alt absolute -bottom-24 right-10 md:right-32 w-64 md:w-96 h-44 bg-[#C9A77A]/[0.13] border border-[#C9A77A]/15" />
            <div className="admin-organic-shape hidden sm:block absolute -top-12 right-24 md:right-56 w-52 md:w-72 h-40 bg-white/50" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_92%_0%,rgba(201,167,122,0.18),transparent_48%),radial-gradient(circle_at_0%_120%,rgba(201,167,122,0.08),transparent_42%)]" />
          </div>

          <div className="relative z-10 flex-1 min-w-0 pl-9 md:pl-0">
            {headerContent}
          </div>

          <div className="relative z-20 flex items-center gap-3 md:gap-4 shrink-0 ml-auto">
            {isAdmin && <PasswordRequestsCenter light />}
            <NotificationCenter light />
            <div className="flex items-center gap-3.5 pl-4 md:pl-5 border-l border-[#DDD5C9]">
              <div className="text-right hidden sm:block">
                <p className="text-[13px] font-bold font-headline leading-tight text-[#171717]">{user?.name || "Admin User"}</p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#77736E] mt-0.5">{user?.role || "Curator"}</p>
              </div>
              <div className="w-10 h-10 flex items-center justify-center rounded-full font-headline font-extrabold text-[14px] bg-[#171717] text-white shrink-0">
                {user?.name?.charAt(0).toUpperCase() || "A"}
              </div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  if (dark) {
    return (
      <header className="print:hidden sticky top-0 w-full px-4 md:px-8 pt-4 md:pt-6 pb-2 bg-[#0a0a0a]/90 backdrop-blur-xl z-20">
        <div className="w-full bg-[#141414] border border-white/[0.08] rounded-[26px] px-5 md:px-8 py-4 md:py-5 flex justify-between items-center gap-4 shadow-[0_12px_40px_rgba(0,0,0,0.4)]">
          <div className="flex-1 min-w-0 pl-9 md:pl-0">
            {headerContent}
          </div>

          <div className="flex items-center gap-3 md:gap-5 shrink-0 ml-auto">
            {isAdmin && <PasswordRequestsCenter dark={dark} />}
            <NotificationCenter dark={dark} />
            <div className="flex items-center gap-3.5 pl-4 md:pl-5 border-l border-white/[0.1]">
              <div className="text-right hidden sm:block">
                <p className="text-[13px] font-bold font-headline leading-tight text-white">{user?.name || "Admin User"}</p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400 mt-0.5">{user?.role || "Curator"}</p>
              </div>
              <div className="w-10 h-10 flex items-center justify-center rounded-full font-headline font-extrabold text-[14px] bg-white text-black shrink-0">
                {user?.name?.charAt(0).toUpperCase() || "A"}
              </div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className={`sticky top-0 w-full px-4 md:px-8 flex justify-between items-center backdrop-blur-xl z-20 transition-shadow duration-300 ${dark ? "h-24 bg-[#0f0f0f]/85" : "h-20 bg-white/80 focus-within:shadow-lg"}`}>
      <div className="flex-1 max-w-xl hidden md:block">
        {headerContent}
      </div>

      {/* Search on mobile */}
      <div className="flex-1 md:hidden"></div>

      <div className="flex items-center gap-4 md:gap-6 ml-auto">
        {isAdmin && <PasswordRequestsCenter dark={dark} />}
        <NotificationCenter dark={dark} />
        <div className={`flex items-center gap-3 pl-4 border-l ${dark ? "border-white/10" : "border-neutral-100"}`}>
          <div className="text-right hidden sm:block">
            <p className={`text-xs font-bold font-headline leading-tight ${dark ? "text-white" : ""}`}>{user?.name || "Admin User"}</p>
            <p className={`text-[10px] uppercase tracking-wider ${dark ? "text-neutral-400" : "text-neutral-400"}`}>{user?.role || "Curator"}</p>
          </div>
          <div className={`w-10 h-10 flex items-center justify-center rounded-full font-headline font-bold ${dark ? "bg-white text-black" : "bg-surface-container text-black"}`}>
            {user?.name?.charAt(0).toUpperCase() || "A"}
          </div>
        </div>
      </div>
    </header>
  );
};
