import { useAuth } from "../hooks/useAuth";
import { CartProvider } from "./CartContext";

export const CartProviderWrapper = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return <CartProvider isAuthenticated={isAuthenticated}>{children}</CartProvider>;
};
