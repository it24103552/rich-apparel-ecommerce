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
    <div className="flex flex-col min-h-screen bg-gray-50">
      <ClientHeader />
      <CartDrawer />
      <main className={`flex-1 ${!isHomePage ? "pt-24 md:pt-32" : ""}`}>
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
