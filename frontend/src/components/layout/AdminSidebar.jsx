import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { LogOut } from "lucide-react"; // Fallback for settings if needed, but we'll use Material

// `light` is a presentation-only flag (warm light theme on Product Management). No behaviour depends on it.
export const AdminSidebar = ({ isOpen, setIsOpen, light = false }) => {
  const location = useLocation();
  const { user, dispatch } = useAuth();

  const userRole = user?.role?.toLowerCase() || '';
  const isAdmin = userRole === 'admin';
  const hasAccess = (...roles) => isAdmin || roles.includes(userRole);

  const flatMenuItems = [
    ...(isAdmin ? [
      { label: "Dashboard", path: "/admin/dashboard/overall", materialIcon: "dashboard" }
    ] : []),
    ...(userRole === 'product manager' ? [
      { label: "Dashboard", path: "/admin/dashboard/product", materialIcon: "dashboard" }
    ] : []),
    ...(userRole === 'supplier manager' ? [
      { label: "Dashboard", path: "/admin/dashboard/supplier", materialIcon: "dashboard" }
    ] : []),
    ...(hasAccess('product manager') ? [
      { label: "Products", path: "/admin/products", materialIcon: "inventory_2" },
      { label: "Categories", path: "/admin/categories", materialIcon: "category" }
    ] : []),
    ...(hasAccess('supplier manager') ? [
      { label: "Suppliers", path: "/admin/suppliers", materialIcon: "local_shipping" }
    ] : []),
    ...(isAdmin ? [
      { label: "Orders", path: "/admin/orders", materialIcon: "shopping_bag" },
      { label: "Payments", path: "/admin/payments", materialIcon: "payments" },
      { label: "Returns", path: "/admin/returns", materialIcon: "assignment_return" },
      { label: "Coupons", path: "/admin/coupons", materialIcon: "sell" },
      { label: "Loyalty", path: "/admin/loyalty", materialIcon: "redeem" },
      { label: "Reviews", path: "/admin/reviews", materialIcon: "reviews" },
      { label: "Customer Chat", path: "/admin/chat", materialIcon: "forum" },
      { label: "Users", path: "/admin/users", materialIcon: "group" },
      { label: "Staff", path: "/admin/staff", materialIcon: "badge" },
      { label: "Roles", path: "/admin/roles", materialIcon: "admin_panel_settings" },
    ] : []),
  ];

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    dispatch({ type: "AUTH_LOGOUT" });
    window.location.href = "/login";
  };

  const activeClass = light
    ? "bg-[#171717] text-white rounded-2xl px-4 py-3 mx-3.5 flex items-center gap-3.5 font-headline tracking-tight text-[13.5px] font-bold shadow-[0_10px_24px_rgba(23,23,23,0.18)] ring-1 ring-[#C9A77A]/35 transition-all duration-200 active:scale-95"
    : "bg-white text-black rounded-2xl px-4 py-3 mx-3.5 flex items-center gap-3.5 font-headline tracking-tight text-[13.5px] font-bold shadow-[0_4px_20px_rgba(255,255,255,0.08)] transition-all duration-200 active:scale-95";
  const inactiveClass = light
    ? "text-[#3d3a36] hover:text-[#171717] px-4 py-2.5 mx-3.5 flex items-center gap-3.5 font-headline tracking-tight text-[13.5px] font-medium transition-all hover:bg-white/75 rounded-2xl"
    : "text-neutral-400 hover:text-white px-4 py-2.5 mx-3.5 flex items-center gap-3.5 font-headline tracking-tight text-[13.5px] font-medium transition-all hover:bg-white/[0.06] rounded-2xl";

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`md:hidden print:hidden fixed top-4 left-4 z-[35] p-2 rounded-xl ${light ? "bg-white border border-[#E4DED6] text-[#171717] shadow-sm" : "bg-[#141414] border border-white/10 text-white"}`}
      >
        <span className="material-symbols-outlined text-[20px]">{isOpen ? 'close' : 'menu'}</span>
      </button>

      {/* Sidebar */}
      <aside
        className={`admin-sidebar print:hidden fixed md:sticky left-0 top-0 h-full md:h-screen w-64 flex flex-col py-8 z-30 transition-transform duration-300 ${light ? "admin-sidebar-surface" : "bg-[#080808] border-r border-white/[0.06]"} ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        {/* Subtle decorative organic layers clipped behind navigation */}
        {light && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden z-0">
            <div className="admin-organic-shape absolute -top-16 -right-14 w-56 h-56 bg-[#EAE0D3]/50 border border-[#C9A77A]/15" />
            <div className="admin-organic-shape-alt absolute top-[38%] -left-20 w-52 h-64 bg-white/45" />
            <div className="admin-organic-shape absolute -bottom-16 -right-10 w-60 h-52 bg-[#C9A77A]/[0.09] border border-[#C9A77A]/15" />
          </div>
        )}

        <div className="relative z-10 px-7 mb-10">
          <h1 className={`text-[19px] font-extrabold tracking-tight uppercase font-headline leading-none ${light ? "text-[#171717]" : "text-white"}`}>Rich Apparel</h1>
          {light && <div className="w-8 h-[2px] bg-[#C9A77A] mt-3" />}
          <p className={`text-[10px] tracking-[0.26em] uppercase font-medium ${light ? "text-[#9A7B4A] mt-2.5" : "text-neutral-400 mt-2"}`}>Digital Atelier</p>
        </div>

        <nav className="relative z-10 flex-1 space-y-1.5 overflow-y-auto hide-scrollbar">
          {flatMenuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={
                location.pathname === item.path ||
                (item.path.startsWith('/admin/dashboard') && location.pathname.startsWith('/admin/dashboard')) ||
                (item.path === '/admin' && location.pathname.startsWith('/admin/dashboard')) ||
                (item.path === '/admin/products' && location.pathname.startsWith('/admin/products'))
                  ? activeClass
                  : inactiveClass
              }
            >
              <span className="material-symbols-outlined text-[20px]">{item.materialIcon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className={`relative z-10 mt-auto pt-5 border-t space-y-1 ${light ? "border-[#E4DED6]" : "border-white/[0.07]"}`}>
          {hasAccess('product manager', 'supplier manager') && (
            <Link
              to="/admin/history"
              onClick={() => setIsOpen(false)}
              className={location.pathname === '/admin/history' ? activeClass : inactiveClass}
            >
              <span className="material-symbols-outlined text-[20px]">history</span>
              <span>History</span>
            </Link>
          )}
          <Link
            to="/admin/settings"
            onClick={() => setIsOpen(false)}
            className={location.pathname === '/admin/settings' ? activeClass : inactiveClass}
          >
            <span className="material-symbols-outlined text-[20px]">settings</span>
            <span>Settings</span>
          </Link>
          <button
            onClick={handleLogout}
            className={`w-[calc(100%-1.75rem)] text-left ${inactiveClass}`}
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden print:hidden z-[29]"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};
