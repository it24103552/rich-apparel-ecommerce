import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";

export const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  // Dark premium theme is applied across all Admin pages (presentation-only).
  const isDark = pathname.startsWith("/admin");
  // Warm light theme is applied across all Admin pages to match Product Management (presentation-only).
  const isLight = pathname.startsWith("/admin");

  const rootTheme = isLight
    ? "admin-surface text-[#171717] selection:bg-[#171717] selection:text-white print:bg-white print:text-black"
    : isDark
      ? "bg-[#0a0a0a] text-white selection:bg-white selection:text-black print:bg-white print:text-black"
      : "bg-background text-on-background selection:bg-zinc-900 selection:text-white";

  const mainTheme = isLight
    ? "custom-scrollbar p-4 md:px-8 md:pt-2 md:pb-10"
    : isDark
      ? "custom-scrollbar custom-scrollbar-dark p-4 md:px-8 md:pt-2 md:pb-8"
      : "p-4 md:p-6";

  return (
    <div className={`admin-layout font-body antialiased print:min-h-0 print:block ${rootTheme}`}>
      {/* Sidebar */}
      <AdminSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} light={isLight} />

      {/* Main content wrapper */}
      <div className="admin-main print:min-h-0">
        {/* Topbar */}
        <AdminTopbar dark={isDark} light={isLight} />

        {/* Content */}
        <main className={`admin-content print:overflow-visible print:p-0 ${mainTheme}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
