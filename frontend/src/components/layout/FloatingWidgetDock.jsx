import { FloatingWidgetProvider } from "../../context/FloatingWidgetContext";
import "./FloatingWidgetDock.css";

/**
 * Shared bottom-right container for the storefront floating widgets.
 * Children stack vertically (first child on top), right-aligned, with a fixed
 * gap, so the Support button always sits directly above Customer Pulse
 * whatever height Pulse currently has. Also provides the shared
 * "which widget is expanded" state.
 */
export const FloatingWidgetDock = ({ children }) => (
  <FloatingWidgetProvider>
    <div className="floating-widget-dock">{children}</div>
  </FloatingWidgetProvider>
);
