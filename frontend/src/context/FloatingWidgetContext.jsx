import { useCallback, useMemo, useState } from "react";
import { FloatingWidgetContext, getDefaultWidget } from "./floatingWidgetState";

export const FloatingWidgetProvider = ({ children }) => {
  const [activeFloatingWidget, setActiveFloatingWidget] =
    useState(getDefaultWidget);

  const openSupport = useCallback(() => setActiveFloatingWidget("support"), []);

  // Closing Support returns to the default state (Pulse expanded unless the
  // customer previously minimized/dismissed it). Never touches other states.
  const closeSupport = useCallback(
    () =>
      setActiveFloatingWidget((current) =>
        current === "support" ? getDefaultWidget() : current
      ),
    []
  );

  const value = useMemo(
    () => ({ activeFloatingWidget, setActiveFloatingWidget, openSupport, closeSupport }),
    [activeFloatingWidget, openSupport, closeSupport]
  );

  return (
    <FloatingWidgetContext.Provider value={value}>
      {children}
    </FloatingWidgetContext.Provider>
  );
};
