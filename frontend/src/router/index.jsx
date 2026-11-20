import { createBrowserRouter, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

// Layouts
import { AdminLayout } from "../components/layout/AdminLayout";
import { ClientLayout } from "../components/layout/ClientLayout";

// Auth Pages
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { ForgotPasswordPage } from "../pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "../pages/auth/ResetPasswordPage";

// Admin Pages
import { ProductDashboard } from "../pages/admin/product/ProductDashboard";
import { SupplierDashboard } from "../pages/admin/supplier/SupplierDashboard";
import { AdminDashboard } from "../pages/admin/AdminDashboard";
import { ProductsPage } from "../pages/admin/product/ProductsPage";
import { CategoriesPage } from "../pages/admin/product/CategoriesPage";
import { SuppliersPage } from "../pages/admin/supplier/SuppliersPage";
import { OrdersPage } from "../pages/admin/order/OrdersPage";
import { PaymentsPage } from "../pages/admin/payment/PaymentsPage";
import { ReturnsPage } from "../pages/admin/review/ReturnsPage";
import { ReviewsPage } from "../pages/admin/review/ReviewsPage";
import { CouponsPage } from "../pages/admin/loyalty/CouponsPage";
import { LoyaltyPage } from "../pages/admin/loyalty/LoyaltyPage";
import { HistoryPage } from "../pages/admin/loyalty/HistoryPage";
import { UsersPage } from "../pages/admin/staff/UsersPage";
import { StaffPage } from "../pages/admin/staff/StaffPage";
import { RolesPage } from "../pages/admin/staff/RolesPage";
import SupportChatPage from "../pages/admin/chat/SupportChatPage";

import { BarcodePrintPage } from "../pages/admin/product/BarcodePrintPage";
import { SettingsPage } from "../pages/admin/SettingsPage";

// Client Pages
import { HomePage } from "../pages/client/HomePage";
import { ProfilePage } from "../pages/client/ProfilePage";
import { CartPage } from "../pages/client/CartPage";
import { CreateOrderPage } from "../pages/client/CreateOrderPage";
import { MyOrdersPage } from "../pages/client/MyOrdersPage";
import { OrderDetailsPage } from "../pages/client/OrderDetailsPage";
import { TrackOrderPage } from "../pages/client/TrackOrderPage";
import ProductDetailPage from "../pages/client/ProductDetailPage";
import { CategoryPage } from "../pages/client/CategoryPage";


// Role-based access helpers
const isAdmin = (role) => role?.toLowerCase() === 'admin';

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return null; // The global loader in App will handle this state
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: window.location.pathname }} />;
  }

  const roleObj = user?.role;
  const roleStr = typeof roleObj === 'string' ? roleObj : (roleObj?.name || "");
  const userRole = roleStr.toLowerCase();
  
  if (allowedRoles) {
    const hasAccess = allowedRoles.some(role => {
      if (role === 'admin') return userRole === 'admin';
      return role.toLowerCase() === userRole;
    });

    if (!hasAccess) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

// Dynamic Dashboard Redirector
const DashboardIndex = () => {
  const { user } = useAuth();
  const roleObj = user?.role;
  const roleStr = typeof roleObj === 'string' ? roleObj : (roleObj?.name || "");
  const role = roleStr.toLowerCase();

  // URL-driven redirection based on primary role
  if (role === 'supplier manager') return <Navigate to="/admin/dashboard/supplier" replace />;
  if (role === 'admin') return <Navigate to="/admin/dashboard/overall" replace />;
  return <Navigate to="/admin/dashboard/product" replace />;
};

// Router Definition
export const router = createBrowserRouter([
  // Auth Routes (public)
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPasswordPage />,
  },
  {
    path: "/reset-password",
    element: <ResetPasswordPage />,
  },

  // Admin Routes (protected)
  {
    path: "/admin",
    element: (
      <ProtectedRoute allowedRoles={['admin', 'product manager', 'supplier manager']}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardIndex /> },
      { path: "dashboard/overall", element: <ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute> },
      { path: "dashboard/product", element: <ProtectedRoute allowedRoles={['admin', 'product manager']}><ProductDashboard /></ProtectedRoute> },
      { path: "dashboard/supplier", element: <ProtectedRoute allowedRoles={['admin', 'supplier manager']}><SupplierDashboard /></ProtectedRoute> },
      { path: "products", element: <ProtectedRoute allowedRoles={['admin', 'product manager']}><ProductsPage /></ProtectedRoute> },
      { path: "categories", element: <ProtectedRoute allowedRoles={['admin', 'product manager']}><CategoriesPage /></ProtectedRoute> },
      { path: "suppliers", element: <ProtectedRoute allowedRoles={['admin', 'supplier manager']}><SuppliersPage /></ProtectedRoute> },
      { path: "orders", element: <ProtectedRoute allowedRoles={['admin']}><OrdersPage /></ProtectedRoute> },
      { path: "payments", element: <ProtectedRoute allowedRoles={['admin']}><PaymentsPage /></ProtectedRoute> },
      { path: "returns", element: <ProtectedRoute allowedRoles={['admin']}><ReturnsPage /></ProtectedRoute> },
      { path: "coupons", element: <ProtectedRoute allowedRoles={['admin']}><CouponsPage /></ProtectedRoute> },
      { path: "loyalty", element: <ProtectedRoute allowedRoles={['admin']}><LoyaltyPage /></ProtectedRoute> },
      { path: "reviews", element: <ProtectedRoute allowedRoles={['admin']}><ReviewsPage /></ProtectedRoute> },
      { path: "users", element: <ProtectedRoute allowedRoles={['admin']}><UsersPage /></ProtectedRoute> },
      { path: "staff", element: <ProtectedRoute allowedRoles={['admin']}><StaffPage /></ProtectedRoute> },
      { path: "roles", element: <ProtectedRoute allowedRoles={['admin']}><RolesPage /></ProtectedRoute> },
      { path: "chat", element: <ProtectedRoute allowedRoles={['admin']}><SupportChatPage /></ProtectedRoute> },

      { path: "history", element: <ProtectedRoute allowedRoles={['admin', 'product manager', 'supplier manager']}><HistoryPage /></ProtectedRoute> },
      { path: "products/:id/print", element: <ProtectedRoute allowedRoles={['admin', 'product manager']}><BarcodePrintPage /></ProtectedRoute> },
      { path: "settings", element: <ProtectedRoute allowedRoles={['admin', 'product manager', 'supplier manager']}><SettingsPage /></ProtectedRoute> },
    ],
  },

  // Client Routes
  {
    path: "/",
    element: <ClientLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "profile", element: <ProtectedRoute><ProfilePage /></ProtectedRoute> },
      { path: "cart", element: <ProtectedRoute><CartPage /></ProtectedRoute> },
      { path: "checkout", element: <ProtectedRoute><CreateOrderPage /></ProtectedRoute> },
      { path: "orders", element: <ProtectedRoute><MyOrdersPage /></ProtectedRoute> },
      { path: "orders/:id", element: <ProtectedRoute><OrderDetailsPage /></ProtectedRoute> },
      { path: "orders/:id/track", element: <ProtectedRoute><TrackOrderPage /></ProtectedRoute> },
      { path: "product/:id", element: <ProductDetailPage /> },
      { path: "category/:categoryName", element: <CategoryPage /> },
    ],
  },

  // Catch-all
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
