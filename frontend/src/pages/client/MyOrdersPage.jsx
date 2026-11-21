import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { useAuth } from "../../hooks/useAuth";
import { ordersService } from "../../services";
import { OrdersGridSkeleton } from "../../components/loading/ClientSkeletons";
import { Button } from "../../components/common/Button";
import { formatPrice, formatDate } from "../../utils/formatters";
import {
  Package, ChevronRight, Truck, ArrowRight,
  Clock, CheckCircle2, PackageCheck, XCircle, Eye, RotateCcw
} from "lucide-react";

const STATUS_CONFIG = {
  pending:   { icon: Clock,        bg: "bg-amber-50",   text: "text-amber-800",   border: "border-amber-200/80" },
  confirmed: { icon: CheckCircle2, bg: "bg-sky-50",     text: "text-sky-800",     border: "border-sky-200/80" },
  shipped:   { icon: Truck,        bg: "bg-indigo-50",  text: "text-indigo-800",  border: "border-indigo-200/80" },
  delivered: { icon: PackageCheck, bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200/80" },
  cancelled: { icon: XCircle,      bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200/80" },
};

export const MyOrdersPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) { navigate("/login"); return; }
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

  const activeOrdersCount = orders.filter(o => ["pending", "confirmed", "shipped"].includes(o.status)).length;
  const deliveredOrdersCount = orders.filter(o => o.status === "delivered").length;

  return (
    <div className="min-h-screen bg-[#fafafa] selection:bg-black selection:text-white" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      <div className="max-w-[1400px] mx-auto px-[5%] lg:px-[6%] pt-8 md:pt-12 pb-20">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2.5 mb-8 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
          <Link to="/" className="hover:text-black transition-colors">Home</Link>
          <ChevronRight size={10} />
          <span className="text-black">My Orders</span>
        </nav>

        {/* ──── 1. Page Introduction / Order Summary ──── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-8 border-b border-neutral-200/70">
            <div className="flex items-start gap-4">
              <div className="w-1.5 h-10 md:h-12 bg-black rounded-full mt-1 shrink-0" />
              <div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tighter uppercase text-black leading-none mb-2">
                  My Orders
                </h1>
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-[0.25em]">
                  {loading
                    ? "Loading Purchase History..."
                    : `${orders.length} order${orders.length !== 1 ? "s" : ""} • Purchase History`}
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center justify-center gap-2.5 h-11 px-7 rounded-full bg-black text-white text-[10px] font-bold uppercase tracking-[0.2em] shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:bg-neutral-800 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer w-fit"
            >
              Continue Shopping <ArrowRight size={14} />
            </button>
          </div>

          {!loading && orders.length > 0 && (
            <div className="grid grid-cols-3 gap-3 sm:gap-5 mt-6">
              <div className="bg-white rounded-2xl border border-neutral-100/80 px-4 sm:px-6 py-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                <span className="block text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 mb-1">
                  Total Orders
                </span>
                <span className="text-xl sm:text-2xl font-bold text-black tracking-tight">
                  {orders.length}
                </span>
              </div>
              <div className="bg-white rounded-2xl border border-neutral-100/80 px-4 sm:px-6 py-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                <span className="block text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 mb-1">
                  In Progress
                </span>
                <span className="text-xl sm:text-2xl font-bold text-black tracking-tight">
                  {activeOrdersCount}
                </span>
              </div>
              <div className="bg-white rounded-2xl border border-neutral-100/80 px-4 sm:px-6 py-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                <span className="block text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 mb-1">
                  Delivered
                </span>
                <span className="text-xl sm:text-2xl font-bold text-black tracking-tight">
                  {deliveredOrdersCount}
                </span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Error */}
        {!loading && error && orders.length > 0 && (
          <div className="bg-red-50 text-red-700 border border-red-200/80 px-4 py-3 rounded-2xl text-[11px] font-semibold uppercase tracking-wider mb-6">
            {error}
          </div>
        )}

        {/* ──── 2. My Orders Section ──── */}
        {loading ? (
          <OrdersGridSkeleton />
        ) : error && orders.length === 0 ? (
          <div className="py-20 px-6 text-center bg-white rounded-2xl border border-neutral-100/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-5">
              <XCircle size={28} className="text-red-500" />
            </div>
            <h2 className="text-lg font-bold uppercase tracking-tight text-black mb-2">Unable to load orders</h2>
            <p className="text-xs text-neutral-500 font-medium mb-7 max-w-sm mx-auto">
              {error}
            </p>
            <Button onClick={fetchOrders} variant="dark" className="rounded-full px-10 py-3 cursor-pointer text-[10px]">
              Retry
            </Button>
          </div>
        ) : orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-24 px-6 text-center bg-white rounded-2xl border border-neutral-100/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
          >
            <div className="w-16 h-16 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-center justify-center mx-auto mb-5">
              <Package size={28} className="text-neutral-300" />
            </div>
            <h2 className="text-lg font-bold uppercase tracking-tight text-black mb-2">No orders yet</h2>
            <p className="text-xs text-neutral-400 font-medium mb-7 max-w-sm mx-auto">
              Once you place an order, you can track its delivery status and view order details right here.
            </p>
            <Button onClick={() => navigate("/")} variant="dark" className="rounded-full px-10 py-3 cursor-pointer text-[10px]">
              Shop Now
            </Button>
          </motion.div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.25em] text-neutral-500">
                Order History
              </h2>
              <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-400">
                Sorted by Latest
              </span>
            </div>

            {/* ──── 3. Order Cards Grid (Aligned with Homepage ProductCard) ──── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {orders.map((order, idx) => {
                const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                const Icon = config.icon;
                const firstItem = order.items?.[0];
                const firstImg = firstItem?.product?.images?.[0] || firstItem?.product?.imageUrl;
                const itemCount = order.items?.reduce((a, i) => a + i.quantity, 0) || 0;
                const dateStr = formatDate(order.createdAt).split(",")[0];
                const primaryProductName = firstItem?.product?.name;
                const extraItemsCount = (order.items?.length || 0) > 1 ? order.items.length - 1 : 0;

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03, duration: 0.4 }}
                    onClick={() => navigate(`/orders/${order.id}`)}
                    className="group bg-white rounded-2xl border border-neutral-100/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.1)] transition-all duration-500 flex flex-col cursor-pointer overflow-hidden h-full hover:-translate-y-1"
                  >
                    {/* Top: Product Image Area */}
                    <div className="relative overflow-hidden bg-neutral-50 aspect-[4/5] w-full border-b border-neutral-100/80">
                      {firstImg ? (
                        <img
                          src={getImgUrl(firstImg)}
                          alt={primaryProductName || `Order #${order.id.slice(-6).toUpperCase()}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-neutral-100">
                          <Package size={36} className="text-neutral-300" />
                        </div>
                      )}

                      {/* Order Number Badge — Top Left */}
                      <div className="absolute top-3 left-3 z-10">
                        <span className="inline-block bg-white/95 backdrop-blur-md text-black border border-neutral-200/80 text-[9px] font-bold uppercase tracking-[0.15em] px-2.5 py-1 rounded-md shadow-xs">
                          #{order.id.slice(-6).toUpperCase()}
                        </span>
                      </div>

                      {/* Status Badge — Top Right */}
                      <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1.5">
                        <span className={`inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.12em] px-2.5 py-1 rounded-md border backdrop-blur-md shadow-xs ${config.bg} ${config.text} ${config.border}`}>
                          <Icon size={10} strokeWidth={2.5} />
                          {order.status}
                        </span>
                        {order.method === 'return_replacement' && (
                          <span className="inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-[0.15em] px-2.5 py-1 rounded-md bg-black text-white shadow-xs">
                            <RotateCcw size={9} strokeWidth={2.5} />
                            Replacement
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom: Order Information & Actions */}
                    <div className="p-4 sm:p-5 flex flex-col flex-1 bg-white">
                      {/* Primary Title / Item Preview */}
                      <div className="mb-1.5">
                        <h3 className="text-[12px] font-bold text-neutral-800 uppercase tracking-wide line-clamp-1 group-hover:text-black transition-colors">
                          {primaryProductName
                            ? `${primaryProductName}${extraItemsCount > 0 ? ` +${extraItemsCount} more` : ""}`
                            : `Order #${order.id.slice(-6).toUpperCase()}`}
                        </h3>
                      </div>

                      {/* Price — Strong Black Typography */}
                      <p className="text-lg font-bold text-black tracking-tight mb-4">
                        {(() => {
                          const sFee = (order.shippingFee !== undefined && order.shippingFee !== null && order.shippingFee > 0)
                            ? order.shippingFee
                            : (order.method === 'return_replacement' ? 0 : (order.deliveryMethod === "express_delivery" ? 500 : (order.deliveryMethod === "pickup" ? 0 : 350)));

                          // If it's a new order (has shippingFee stored), total is already correct.
                          // If it's a legacy order (shippingFee is 0 or null), total needs the calculated sFee added.
                          const isNew = order.shippingFee !== undefined && order.shippingFee !== null && order.shippingFee > 0;
                          const displayTotal = isNew ? order.total : (order.total + sFee);
                          return formatPrice(displayTotal);
                        })()}
                      </p>

                      {/* Secondary Metadata */}
                      <div className="pt-3 border-t border-neutral-100 space-y-2 mb-4">
                        <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.12em]">
                          <span className="text-neutral-500">
                            {itemCount} item{itemCount !== 1 ? "s" : ""}
                          </span>
                          <span className="text-neutral-400">
                            {dateStr}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.12em]">
                          <span className="font-semibold text-neutral-400">Delivery</span>
                          <span className="font-bold text-neutral-700 truncate max-w-[150px]">
                            {order.deliveryMethod?.replace(/_/g, " ") || "Standard"}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-auto pt-3 border-t border-neutral-100 flex items-center gap-2.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/orders/${order.id}/track`); }}
                          className="flex-1 h-10 rounded-xl bg-white border border-neutral-200 flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-800 hover:border-black hover:text-black hover:bg-neutral-50 transition-all duration-200 cursor-pointer"
                        >
                          <Truck size={12} /> Track
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/orders/${order.id}`); }}
                          className="flex-1 h-10 rounded-xl bg-black flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-white hover:bg-neutral-800 shadow-xs transition-all duration-200 cursor-pointer"
                        >
                          <Eye size={12} /> Details
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
