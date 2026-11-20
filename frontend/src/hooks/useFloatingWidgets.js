import { useContext } from "react";
import { FloatingWidgetContext } from "../context/floatingWidgetState";

export const useFloatingWidgets = () => {
  const context = useContext(FloatingWidgetContext);
  if (!context) {
    throw new Error("useFloatingWidgets must be used within FloatingWidgetProvider");
  }
  return context;
};
