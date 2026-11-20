import React, { createContext, useReducer, useEffect } from "react";
import toast from "react-hot-toast";
import { cartService } from "../services";

export const CartContext = createContext();

const initialState = {
  items: [],
  total: 0,
  loading: false,
  isCartOpen: false,
};

// Normalize cart items from API response
const normalizeCartItems = (cartItems) => {
  return (cartItems || []).map((item) => ({
    id: item.id,
    productId: item.productId,
    name: item.product?.name,
    price: item.product?.price,
    quantity: item.quantity,
    imageUrl: item.product?.imageUrl,
    variantAttributes: item.variantAttributes,
    maxStock: item.maxStock || 0,
  }));
};

const cartReducer = (state, action) => {
  switch (action.type) {
    case "CART_LOADING":
      return { ...state, loading: true };
    case "CART_SET_ALL": {
      const items = normalizeCartItems(action.payload.items);
      const total = items.reduce((s, i) => s + (i.price * i.quantity), 0);
      return {
        ...state,
        items,
        total,
        loading: false,
      };
    }
    case "CART_CLEAR":
      return { ...initialState };
    case "SET_CART_OPEN":
      return { ...state, isCartOpen: action.payload };
    default:
      return state;
  }
};

export const CartProvider = ({ children, isAuthenticated }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // API-backed action functions
  const addToCart = async (productId, quantity = 1, variantAttributes = null) => {
    dispatch({ type: "CART_LOADING" });
    try {
      const res = await cartService.addItem({ productId, quantity, variantAttributes });
      dispatch({
        type: "CART_SET_ALL",
        payload: { items: res.data.data?.items || [] },
      });
      // Automatically open cart drawer on success
      dispatch({ type: "SET_CART_OPEN", payload: true });
    } catch (error) {
      console.error("Failed to add to cart:", error);
      const message = error.response?.data?.message || "Failed to add to cart";
      toast.error(message);
      dispatch({ type: "CART_SET_ALL", payload: { items: [] } });
    }
  };

  const toggleCart = (isOpen) => {
    dispatch({ type: "SET_CART_OPEN", payload: isOpen });
  };

  const removeFromCart = async (itemId) => {
    dispatch({ type: "CART_LOADING" });
    try {
      const res = await cartService.removeItem(itemId);
      dispatch({
        type: "CART_SET_ALL",
        payload: { items: res.data.data?.items || [] },
      });
    } catch (error) {
      console.error("Failed to remove from cart:", error);
      toast.error("Failed to remove from cart");
    }
  };

  const updateCartItem = async (itemId, quantity) => {
    dispatch({ type: "CART_LOADING" });
    try {
      const res = await cartService.updateItem(itemId, { quantity });
      dispatch({
        type: "CART_SET_ALL",
        payload: { items: res.data.data?.items || [] },
      });
    } catch (error) {
      console.error("Failed to update cart item:", error);
      const message = error.response?.data?.message || "Failed to update cart";
      toast.error(message);
    }
  };

  // Fetch cart on mount when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      dispatch({ type: "CART_LOADING" });
      cartService
        .getCart()
        .then((res) => {
          dispatch({
            type: "CART_SET_ALL",
            payload: { items: res.data.data?.items || [] },
          });
        })
        .catch((error) => {
          console.error("Failed to fetch cart:", error);
          dispatch({ type: "CART_SET_ALL", payload: { items: [] } });
        });
    } else {
      dispatch({ type: "CART_CLEAR" });
    }
  }, [isAuthenticated]);

  return (
    <CartContext.Provider value={{ ...state, dispatch, addToCart, removeFromCart, updateCartItem, toggleCart }}>
      {children}
    </CartContext.Provider>
  );
};
