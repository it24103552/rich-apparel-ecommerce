import { createContext } from "react";

/**
 * Single source of truth for which storefront floating widget is expanded.
 *
 *   activeFloatingWidget = "pulse"   -> Customer Pulse expanded, Support minimized
 *   activeFloatingWidget = "support" -> Support Chat expanded,  Pulse minimized
 *   activeFloatingWidget = null      -> both minimized
 *
 * Because it is ONE value, both widgets can never be expanded together.
 * Customer Pulse stays the default: its own persisted "minimized" preference
 * (localStorage) is only read to pick the default / the state to return to.
 */
export const PULSE_MINIMIZED_STORAGE_KEY = "rich_apparel_pulse_minimized";

export const getDefaultWidget = () => {
  try {
    return window.localStorage.getItem(PULSE_MINIMIZED_STORAGE_KEY) === "true"
      ? null
      : "pulse";
  } catch {
    return "pulse";
  }
};

export const FloatingWidgetContext = createContext(null);
