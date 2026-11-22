import { Outlet, useLocation } from "react-router-dom";
import { ClientHeader } from "./ClientHeader";
import { ClientFooter } from "./ClientFooter";
import { CartDrawer } from "../cart/CartDrawer";
import { CustomerPulse } from "../pulse/CustomerPulse";
import { CustomerSupportChat } from "../chat/CustomerSupportChat";
import { FloatingWidgetDock } from "./FloatingWidgetDock";

export const ClientLayout = () => {
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  return (
    <div className="flex flex-col min-h-screen bg-[#faf8f5] overflow-x-clip">
      <ClientHeader />
      <CartDrawer />
      <main className={`flex-1 ${!isHomePage ? "pt-[102px] md:pt-[110px]" : ""}`}>
        <Outlet />
      </main>
      <ClientFooter />
      <FloatingWidgetDock>
        <CustomerSupportChat />
        <CustomerPulse />
      </FloatingWidgetDock>
    </div>
  );
};
