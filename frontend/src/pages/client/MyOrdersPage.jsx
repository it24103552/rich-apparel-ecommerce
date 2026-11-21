import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { useAuth } from "../../hooks/useAuth";
import { ordersService } from "../../services";
import { OrdersGridSkeleton } from "../../components/loading/ClientSkeletons";
import { Button } from "../../components/common/Button";
import { OrderHistoryCard } from "./components/OrderHistoryCard";
import {
  Package,
  ChevronRight,
  Truck,
  ArrowRight,
  PackageCheck,
  XCircle,
  ShoppingBag,
} from "lucide-react";

export const MyOrdersPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    fetchOrders();
  }, [isAuthenticated, navigate]);

  const fetchOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await ordersService.getAll(0, 100);
      setOrders(res.data.data.orders || []);
    } catch (err) {
      const message = err.response?.data?.message || "Failed to load orders";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const getImgUrl = (img) => {
    if (!img) return null;
    if (img.startsWith("http")) return img;
    return `http://localhost:5001${img.startsWith("/") ? img : "/" + img}`;
  };

  const handleNavigateDetails = (orderId) => {
    navigate(`/orders/${orderId}`);
  };

  const handleNavigateTrack = (orderId) => {
    navigate(`/orders/${orderId}/track`);
  };

  const activeOrdersCount = orders.filter((o) =>
    ["pending", "confirmed", "shipped"].includes(o.status)
  ).length;
  const deliveredOrdersCount = orders.filter(
    (o) => o.status === "delivered"
  ).length;

  return (
    <div
      className="min-h-screen bg-[#faf8f5] selection:bg-[#161514] selection:text-white"
      style={{ fontFamily: "'Montserrat', sans-serif" }}
    >
      <div className="max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-10 pb-20">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 mb-6 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#8d8276]"
        >
          <Link to="/" className="hover:text-[#151413] transition-colors">
            Home
          </Link>
          <ChevronRight size={11} />
          <span className="text-[#151413]">My Orders</span>
        </nav>

        {/* ──── 1. Page Introduction & Summary Strip ──── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 pb-7 border-b border-[#e8e0d5]">
            <div className="flex items-start gap-3.5">
              <div className="w-1 h-9 sm:h-11 bg-[#9a7b56] rounded-full mt-1 shrink-0" />
              <div>
                <h1 className="text-[28px] sm:text-[36px] md:text-[40px] font-extrabold tracking-[-0.03em] uppercase text-[#151413] leading-none mb-2">
                  My Orders
                </h1>
                <p className="text-[12px] font-medium text-[#7a7064] tracking-[0.04em]">
                  {loading
                    ? "Loading your order history..."
                    : `${orders.length} order${orders.length !== 1 ? "s" : ""} placed • Track shipments and manage deliveries`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/")}
              className="inline-flex items-center justify-center gap-2 h-10 px-6 rounded-full bg-[#161514] text-white text-[11px] font-bold uppercase tracking-[0.14em] shadow-[0_6px_18px_rgba(22,21,20,0.12)] hover:bg-[#2c2926] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer w-fit"
            >
              <span>Continue Shopping</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {!loading && orders.length > 0 && (
            <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-6">
              <div className="bg-white rounded-2xl border border-[#e9e1d6] px-4 sm:px-5 py-4 shadow-[0_2px_10px_rgba(32,25,18,0.03)] flex items-center justify-between gap-3">
                <div>
                  <span className="block text-[9.5px] sm:text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8d8276] mb-1">
                    Total Orders
                  </span>
                  <span className="text-xl sm:text-2xl font-extrabold text-[#151413] tracking-tight leading-none">
                    {orders.length}
                  </span>
                </div>
                <div className="hidden sm:flex w-10 h-10 rounded-xl bg-[#f6f1ea] border border-[#eae1d5] items-center justify-center text-[#9a7b56] shrink-0">
                  <ShoppingBag size={17} strokeWidth={1.8} />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#e9e1d6] px-4 sm:px-5 py-4 shadow-[0_2px_10px_rgba(32,25,18,0.03)] flex items-center justify-between gap-3">
                <div>
                  <span className="block text-[9.5px] sm:text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8d8276] mb-1">
                    In Progress
                  </span>
                  <span className="text-xl sm:text-2xl font-extrabold text-[#151413] tracking-tight leading-none">
                    {activeOrdersCount}
                  </span>
                </div>
                <div className="hidden sm:flex w-10 h-10 rounded-xl bg-[#f6f1ea] border border-[#eae1d5] items-center justify-center text-[#9a7b56] shrink-0">
                  <Truck size={17} strokeWidth={1.8} />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#e9e1d6] px-4 sm:px-5 py-4 shadow-[0_2px_10px_rgba(32,25,18,0.03)] flex items-center justify-between gap-3">
                <div>
                  <span className="block text-[9.5px] sm:text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8d8276] mb-1">
                    Delivered
                  </span>
                  <span className="text-xl sm:text-2xl font-extrabold text-[#151413] tracking-tight leading-none">
                    {deliveredOrdersCount}
                  </span>
                </div>
                <div className="hidden sm:flex w-10 h-10 rounded-xl bg-[#edf7f1] border border-[#cfead9] items-center justify-center text-[#1c6642] shrink-0">
                  <PackageCheck size={17} strokeWidth={1.8} />
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Non-blocking Error Banner */}
        {!loading && error && orders.length > 0 && (
          <div className="bg-[#fdf0f0] text-[#9e2a2b] border border-[#f0c7c7] px-4 py-3 rounded-xl text-[12px] font-semibold mb-6">
            {error}
          </div>
        )}

        {/* ──── 2. Order History Feed ──── */}
        {loading ? (
          <OrdersGridSkeleton />
        ) : error && orders.length === 0 ? (
          <div className="py-16 px-6 text-center bg-white rounded-2xl border border-[#e9e1d6] shadow-[0_2px_12px_rgba(32,25,18,0.035)]">
            <div className="w-14 h-14 rounded-2xl bg-[#fdf0f0] border border-[#f0c7c7] flex items-center justify-center mx-auto mb-4">
              <XCircle size={24} className="text-[#c93838]" />
            </div>
            <h2 className="text-lg font-bold uppercase tracking-tight text-[#151413] mb-2">
              Unable to load orders
            </h2>
            <p className="text-xs text-[#7a7064] font-medium mb-6 max-w-sm mx-auto">
              {error}
            </p>
            <Button
              onClick={fetchOrders}
              variant="dark"
              className="rounded-full px-9 py-2.5 cursor-pointer text-[11px]"
            >
              Retry
            </Button>
          </div>
        ) : orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-20 px-6 text-center bg-white rounded-2xl border border-[#e9e1d6] shadow-[0_2px_12px_rgba(32,25,18,0.035)]"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#f6f1ea] border border-[#eae1d5] flex items-center justify-center mx-auto mb-4">
              <Package size={24} className="text-[#9a7b56]" strokeWidth={1.7} />
            </div>
            <h2 className="text-lg font-bold uppercase tracking-tight text-[#151413] mb-2">
              No orders yet
            </h2>
            <p className="text-[13px] text-[#7a7064] font-normal mb-7 max-w-sm mx-auto leading-relaxed">
              Once you place an order, you can track its delivery progress and
              view full order details right here.
            </p>
            <Button
              onClick={() => navigate("/")}
              variant="dark"
              className="rounded-full px-9 py-2.5 cursor-pointer text-[11px]"
            >
              Shop Now
            </Button>
          </motion.div>
        ) : (
          <section aria-label="Order History">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#5c544b]">
                Order History
              </h2>
              <span className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-[#8d8276]">
                Sorted by Latest
              </span>
            </div>

            <div className="space-y-5">
              {orders.map((order, idx) => (
                <OrderHistoryCard
                  key={order.id}
                  order={order}
                  index={idx}
                  getImgUrl={getImgUrl}
                  onNavigateDetails={handleNavigateDetails}
                  onNavigateTrack={handleNavigateTrack}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
