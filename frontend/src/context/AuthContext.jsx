import React, { createContext, useReducer, useEffect } from "react";

export const AuthContext = createContext();

const initialState = {
  user: null,
  token: null,
  loading: true,
  isAuthenticated: false,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case "AUTH_LOADING":
      return { ...state, loading: true };
    case "AUTH_SUCCESS":
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
      };
    case "AUTH_LOGOUT":
      return { ...initialState, loading: false };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const hydrateAuth = () => {
      const token = sessionStorage.getItem("token");
      if (token) {
        try {
          // Robust JWT decoding (handling base64 and potential malformed tokens)
          const base64Url = token.split(".")[1];
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split("")
              .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
              .join("")
          );
          const payload = JSON.parse(jsonPayload);

          dispatch({
            type: "AUTH_SUCCESS",
            payload: {
              user: {
                id: payload.id,
                email: payload.email,
                name: payload.name,
                role: payload.role,
              },
              token,
            },
          });
        } catch (error) {
          console.error("Failed to decode token:", error);
          sessionStorage.removeItem("token");
          dispatch({ type: "AUTH_LOGOUT" });
        }
      } else {
        dispatch({ type: "AUTH_LOGOUT" });
      }
    };

    // Initial hydration
    hydrateAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
};
