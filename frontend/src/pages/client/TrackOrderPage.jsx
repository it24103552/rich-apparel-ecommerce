import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../hooks/useAuth";
import { ordersService } from "../../services";
import { formatPrice, formatDate } from "../../utils/formatters";
import { getDisplayColor } from "../../utils/colorUtils";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Package,
  CheckCircle2,
  Truck,
  Home,
  Clock,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

/* ───── status pipeline ───── */
const STEPS = [
  { key: "pending", label: "Placed", icon: Clock },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle2 },
  { key: "shipped", label: "On The Way", icon: Truck },
  { key: "delivered", label: "Delivered", icon: Home },
];

const getStepIndex = (status) => {
  if (status === "cancelled") return -1;
  const idx = STEPS.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : idx;
};

const STATUS_PILL_STYLES = {
  pending:   { pill: "bg-[#fdf6e9] text-[#8a5d19] border-[#ebd6ad]", dot: "bg-[#c88a28]" },
  confirmed: { pill: "bg-[#eef6fb] text-[#1e5c84] border-[#c4dfef]", dot: "bg-[#2c82b8]" },
  shipped:   { pill: "bg-[#f1f0fb] text-[#43398c] border-[#d3cef0]", dot: "bg-[#5b4fd1]" },
  delivered: { pill: "bg-[#edf7f1] text-[#1c6642] border-[#bee2cc]", dot: "bg-[#258a58]" },
  cancelled: { pill: "bg-[#fdf0f0] text-[#9e2a2b] border-[#f0c7c7]", dot: "bg-[#c93838]" },
};

/* ───── skeleton ───── */
const Skeleton = () => (
  <div className="min-h-screen bg-[#faf8f5]" style={{ fontFamily: "'Montserrat', sans-serif" }} aria-busy="true" aria-label="Loading order tracking">
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-10 pb-20">
      <div className="skeleton-box h-9 w-36 rounded-full mb-6" />
      <div className="skeleton-box h-11 w-72 rounded-xl mb-8" />
      <div className="h-44 bg-white border border-[#e9e1d6] rounded-2xl p-6 mb-6 flex flex-col justify-between shadow-[0_2px_14px_rgba(32,25,18,0.035)]">
        <div className="skeleton-box h-4 w-40 rounded" />
        <div className="grid grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton-box h-12 rounded-xl" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 h-72 bg-white border border-[#e9e1d6] rounded-2xl p-6 space-y-4">
          <div className="skeleton-box h-4 w-32 rounded" />
          <div className="skeleton-box h-20 w-full rounded-xl" />
          <div className="skeleton-box h-20 w-full rounded-xl" />
        </div>
        <div className="lg:col-span-5 h-72 bg-white border border-[#e9e1d6] rounded-2xl p-6 space-y-4">
          <div className="skeleton-box h-4 w-32 rounded" />
          <div className="skeleton-box h-4 w-full rounded" />
          <div className="skeleton-box h-4 w-3/4 rounded" />
          <div className="skeleton-box h-10 w-full rounded-xl mt-6" />
        </div>
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════ MAIN ═══════════════════════════════════ */
export const TrackOrderPage = () => {
  const { id: orderId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { navigate("/login"); return; }
    fetchOrder();
  }, [orderId, isAuthenticated]);

  const fetchOrder = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError("");
    try {
      const res = await ordersService.getById(orderId);
      setOrder(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load order");
    } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => {
    if (!order) return;
    const interval = setInterval(() => fetchOrder(true), 15000);
    return () => clearInterval(interval);
  }, [order?.id]);

  if (loading) return <Skeleton />;
  if (!order) return (
    <div className="min-h-[70vh] flex items-center justify-center bg-[#faf8f5] px-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      <div className="text-center space-y-4 bg-white border border-[#e9e1d6] rounded-[22px] p-9 shadow-[0_6px_24px_rgba(32,25,18,0.045)] max-w-md w-full">
        <p className="text-[#9e2a2b] font-bold uppercase tracking-[0.16em] text-xs">{error || "Order not found"}</p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button type="button" onClick={() => navigate("/orders")} className="bg-white border border-[#d8cec0] text-[#151413] px-6 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-[0.14em] hover:border-[#161514] transition-colors cursor-pointer">Back</button>
          {error && (
            <button type="button" onClick={() => fetchOrder()} className="bg-[#161514] text-white px-6 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-[0.14em] hover:bg-[#2c2926] transition-colors cursor-pointer">Retry</button>
          )}
        </div>
      </div>
    </div>
  );

  const getImgUrl = (img) => {
    if (!img) return null;
    if (img.startsWith('http')) return img;
    return `http://localhost:5001${img.startsWith('/') ? img : '/' + img}`;
  };

  const currentIdx = getStepIndex(order.status);
  const isCancelled = order.status === "cancelled";

  const shippingFee = order.method === 'return_replacement' ? 0 : (order.deliveryMethod === "express_delivery" ? 500 : 350);
  const subtotal = order.items?.reduce((acc, item) => acc + (item.price * item.quantity), 0) || 0;
  const discounts = Math.max(0, subtotal - (order.total || 0));
  const grandTotal = (order.total || 0) + shippingFee;

  const statusKey = order.status?.toLowerCase() || "pending";
  const statusPill = STATUS_PILL_STYLES[statusKey] || { pill: "bg-[#faf7f2] text-[#5c544b] border-[#e6ddd0]", dot: "bg-[#9a8e80]" };
  const totalItemsCount = order.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  return (
    <div className="min-h-screen bg-[#faf8f5] selection:bg-[#161514] selection:text-white" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-10 pb-20">

        {/* ──── Back & Breadcrumb Row ──── */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <button
            type="button"
            onClick={() => navigate(`/orders/${orderId}`)}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-full bg-white border border-[#dfd6ca] text-[#5c544b] hover:border-[#161514] hover:text-[#151413] text-[11px] font-bold uppercase tracking-[0.14em] transition-all cursor-pointer"
          >
            <ArrowLeft size={13} /> Back to Order
          </button>

          <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8d8276]">
            <button type="button" onClick={() => navigate("/")} className="hover:text-[#151413] transition-colors cursor-pointer">Home</button>
            <ChevronRight size={11} className="text-[#b5a99b]" />
            <button type="button" onClick={() => navigate("/orders")} className="hover:text-[#151413] transition-colors cursor-pointer">My Orders</button>
            <ChevronRight size={11} className="text-[#b5a99b]" />
            <button type="button" onClick={() => navigate(`/orders/${orderId}`)} className="hover:text-[#151413] transition-colors cursor-pointer font-mono">#{orderId.slice(-8).toUpperCase()}</button>
            <ChevronRight size={11} className="text-[#b5a99b]" />
            <span className="text-[#151413] font-bold">Track</span>
          </nav>
        </div>

        {/* ──── Order Header ──── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-5 pb-7 mb-8 border-b border-[#e8e0d5]"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-1 h-9 sm:h-11 bg-[#9a7b56] rounded-full mt-1 shrink-0" />
            <div>
              <h1 className="text-[28px] sm:text-[36px] md:text-[40px] font-extrabold tracking-[-0.03em] uppercase text-[#151413] leading-none mb-2">
                Track Order
              </h1>
              <p className="text-[12.5px] font-medium text-[#7a7064]">
                <span className="font-mono font-bold text-[#151413]">#{orderId.slice(-8).toUpperCase()}</span> • Order Placed {formatDate(order.createdAt).split(",")[0]}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] ${statusPill.pill}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusPill.dot}`} />
              {order.status}
            </span>

            <button
              type="button"
              onClick={() => fetchOrder(true)}
              disabled={refreshing}
              title="Refresh"
              className="h-9 px-4 rounded-full bg-white border border-[#dfd6ca] hover:border-[#161514] text-[#5c544b] hover:text-[#151413] inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] transition-all cursor-pointer disabled:opacity-40"
            >
              <RefreshCw size={12.5} className={refreshing ? "animate-spin" : ""} />
              <span>{refreshing ? "Refreshing" : "Refresh"}</span>
            </button>
          </div>
        </motion.div>

        {/* ──── Cancelled Banner ──── */}
        {isCancelled && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white border border-[#f0c7c7] rounded-2xl p-8 text-center mb-8 shadow-[0_2px_14px_rgba(32,25,18,0.035)]"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#fdf0f0] border border-[#f0c7c7] flex items-center justify-center mx-auto mb-3.5">
              <Package size={20} className="text-[#c93838]" />
            </div>
            <p className="text-[13px] font-extrabold uppercase tracking-[0.16em] text-[#9e2a2b] mb-1">Order Cancelled</p>
            <p className="text-[13px] text-[#6c6257] font-medium">This order has been cancelled and is no longer progressing.</p>
          </motion.div>
        )}

        {/* ──── Tracking Progress — PRIMARY FOCUS ──── */}
        {!isCancelled && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="bg-white rounded-2xl border border-[#e9e1d6] shadow-[0_6px_24px_rgba(32,25,18,0.045)] overflow-hidden mb-7"
          >
            {/* Section Title Row */}
            <div className="px-6 sm:px-8 py-4 bg-[#faf7f2] border-b border-[#efe8de] flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-[12.5px] font-extrabold uppercase tracking-[0.16em] text-[#151413]">Order Progress</h2>
                <p className="text-[12px] text-[#7a7064] font-medium mt-0.5">
                  Current Stage: <span className="text-[#151413] font-bold">{STEPS[currentIdx]?.label}</span>
                  {currentIdx < STEPS.length - 1 && (
                    <span> · Next: {STEPS[currentIdx + 1]?.label}</span>
                  )}
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#e6ddd0]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#258a58] animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#5c544b]">Live Tracking</span>
              </div>
            </div>

            <div className="p-6 sm:p-8 md:p-9">
              {/* Desktop / Tablet Horizontal Timeline */}
              <div className="hidden sm:block relative py-2">
                {/* Background connecting line */}
                <div className="absolute left-[12.5%] right-[12.5%] top-8 h-[2px] bg-[#e5ddd0] rounded-full" />
                {/* Active connecting line */}
                <motion.div
                  className="absolute left-[12.5%] top-8 h-[2px] bg-[#161514] rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: `${(currentIdx / (STEPS.length - 1)) * 75}%` }}
                  transition={{ duration: 0.85, ease: "easeInOut", delay: 0.12 }}
                />

                <div className="relative flex items-start justify-between">
                  {STEPS.map((step, i) => {
                    const isComplete = i <= currentIdx;
                    const isCurrent = i === currentIdx;
                    const Icon = step.icon;

                    return (
                      <motion.div
                        key={step.key}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.07 }}
                        className="relative z-10 flex flex-col items-center flex-1 text-center px-2"
                      >
                        <div className="relative">
                          {isCurrent && (
                            <motion.div
                              className="absolute inset-0 rounded-full border-2 border-[#9a7b56]/40"
                              animate={{ scale: [1, 1.35, 1], opacity: [0.55, 0, 0.55] }}
                              transition={{ duration: 2.2, repeat: Infinity }}
                            />
                          )}
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                              isCurrent
                                ? "bg-[#161514] text-white shadow-[0_8px_20px_rgba(22,21,20,0.18)] ring-4 ring-[#c9a77a]/25"
                                : isComplete
                                  ? "bg-[#161514] text-white"
                                  : "bg-[#faf7f2] border-2 border-[#e3dbd0] text-[#a39482]"
                            }`}
                          >
                            {isComplete && !isCurrent ? <CheckCircle2 size={18} /> : <Icon size={18} />}
                          </div>
                        </div>

                        <p className={`mt-3.5 text-[11.5px] uppercase tracking-[0.14em] ${
                          isCurrent
                            ? "font-extrabold text-[#151413]"
                            : isComplete
                              ? "font-bold text-[#2c2722]"
                              : "font-semibold text-[#9a8e80]"
                        }`}>
                          {step.label}
                        </p>

                        {isCurrent && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.35 }}
                            className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-full bg-[#faf6f0] border border-[#e6ddd0]"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#258a58] animate-pulse" />
                            <span className="text-[9.5px] font-bold text-[#151413] uppercase tracking-[0.12em]">Live</span>
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Mobile Vertical Timeline */}
              <div className="sm:hidden">
                {STEPS.map((step, i) => {
                  const isComplete = i <= currentIdx;
                  const isCurrent = i === currentIdx;
                  const isLast = i === STEPS.length - 1;
                  const Icon = step.icon;

                  return (
                    <div key={step.key} className="flex items-stretch gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${
                            isCurrent
                              ? "bg-[#161514] text-white ring-4 ring-[#c9a77a]/25 shadow-sm"
                              : isComplete
                                ? "bg-[#161514] text-white"
                                : "bg-[#faf7f2] border-2 border-[#e3dbd0] text-[#a39482]"
                          }`}
                        >
                          {isComplete && !isCurrent ? <CheckCircle2 size={16} /> : <Icon size={16} />}
                        </div>
                        {!isLast && (
                          <div className={`w-[2px] flex-1 min-h-[28px] my-1.5 ${i < currentIdx ? "bg-[#161514]" : "bg-[#e3dbd0]"}`} />
                        )}
                      </div>

                      <div className={`flex-1 flex items-center justify-between ${!isLast ? "pb-6" : "pt-1"}`}>
                        <div>
                          <p className={`text-[12px] uppercase tracking-[0.14em] ${
                            isComplete ? "font-bold text-[#151413]" : "font-semibold text-[#9a8e80]"
                          }`}>
                            {step.label}
                          </p>
                          <p className="text-[11px] text-[#7a7064] font-medium mt-0.5">
                            {isCurrent ? "Current stage" : isComplete ? "Completed" : "Upcoming"}
                          </p>
                        </div>
                        {isCurrent && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#faf6f0] border border-[#e6ddd0]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#258a58] animate-pulse" />
                            <span className="text-[9.5px] font-bold text-[#151413] uppercase tracking-[0.12em]">Live</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* ──── Two Column: Order Items + Delivery ──── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
        >
          {/* Items — 7 cols */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-[#e9e1d6] shadow-[0_2px_14px_rgba(32,25,18,0.035)] overflow-hidden">
            <div className="px-6 py-4 bg-[#faf7f2] border-b border-[#efe8de] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Package size={16} className="text-[#9a7b56]" />
                <h3 className="text-[12.5px] font-extrabold uppercase tracking-[0.16em] text-[#151413]">Order Items</h3>
              </div>
              <span className="text-[11px] font-bold text-[#8d8276] uppercase tracking-[0.14em]">
                {totalItemsCount} {totalItemsCount === 1 ? "item" : "items"}
              </span>
            </div>

            <div className="divide-y divide-[#f2ece3] px-6">
              {order.items?.map((item) => {
                const variantEntries = item.variantAttributes
                  ? Object.entries(item.variantAttributes).filter(([k]) => k !== 'id')
                  : [];

                return (
                  <div key={item.id} className="py-5 flex items-start sm:items-center gap-4 sm:gap-5">
                    <div className="w-16 h-20 bg-[#f1ebe3] border border-[#eae2d7] rounded-xl overflow-hidden shrink-0">
                      {item.product?.images?.[0] || item.product?.imageUrl ? (
                        <img
                          src={getImgUrl(item.product.images?.[0] || item.product.imageUrl)}
                          alt={item.product?.name || "Product"}
                          className="w-full h-full object-cover object-[center_12%]"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#b8ada0]">
                          <Package size={18} />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] sm:text-[15px] font-bold text-[#151413] tracking-[-0.01em] leading-snug break-words">
                        {item.product?.name || "Product"}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-1.5 text-[11.5px] font-medium text-[#6c6257]">
                        {variantEntries.map(([k, v]) => {
                          const isColor = k.toLowerCase().includes('col');
                          return (
                            <span key={k} className="inline-flex items-center gap-1.5 capitalize">
                              <span className="text-[#8d8276]">{k}:</span>
                              {isColor && (
                                <span
                                  className="w-2.5 h-2.5 rounded-full border border-[#d6ccbf] shrink-0"
                                  style={{ backgroundColor: getDisplayColor(String(v)) }}
                                />
                              )}
                              <span className="text-[#2c2722] font-semibold">{String(v)}</span>
                            </span>
                          );
                        })}
                        <span className="text-[#151413] font-bold">
                          ×{item.quantity}
                        </span>
                      </div>
                    </div>

                    <p className="text-[15px] sm:text-[16px] font-extrabold text-[#151413] whitespace-nowrap shrink-0">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="bg-[#fcfaf7] px-6 py-5 border-t border-[#f0e9df] space-y-2.5 text-[13px]">
              <div className="flex items-center justify-between">
                <span className="font-medium text-[#6c6257]">Subtotal</span>
                <span className="font-bold text-[#151413]">{formatPrice(subtotal)}</span>
              </div>
              {discounts > 0 && (
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[#6c6257]">Discounts</span>
                  <span className="font-bold text-[#1c6642]">-{formatPrice(discounts)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="font-medium text-[#6c6257]">Delivery Charge</span>
                <span className="font-bold text-[#151413]">{formatPrice(shippingFee)}</span>
              </div>
            </div>

            <div className="px-6 py-5 bg-white flex items-center justify-between border-t border-[#e8e0d5]">
              <span className="text-[12px] font-extrabold text-[#151413] uppercase tracking-[0.16em]">Grand Total</span>
              <span className="text-[22px] sm:text-[24px] font-extrabold text-[#151413] tracking-[-0.02em]">{formatPrice(grandTotal)}</span>
            </div>
          </div>

          {/* Delivery — 5 cols */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-[#e9e1d6] shadow-[0_2px_14px_rgba(32,25,18,0.035)] overflow-hidden flex flex-col justify-between">
            <div>
              <div className="px-6 py-4 bg-[#faf7f2] border-b border-[#efe8de] flex items-center gap-2">
                <MapPin size={15} className="text-[#9a7b56]" />
                <h3 className="text-[12.5px] font-extrabold uppercase tracking-[0.16em] text-[#151413]">Delivery</h3>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <p className="text-[10.5px] font-bold text-[#8d8276] uppercase tracking-[0.14em] mb-1">Address</p>
                  <p className="text-[13.5px] font-semibold text-[#151413] leading-relaxed break-words">{order.address}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <p className="text-[10.5px] font-bold text-[#8d8276] uppercase tracking-[0.14em] mb-1 flex items-center gap-1">
                      <Phone size={11} className="text-[#9a7b56]" /> Contact
                    </p>
                    <p className="text-[13px] font-semibold text-[#151413]">{order.contactNumber}</p>
                  </div>
                  <div>
                    <p className="text-[10.5px] font-bold text-[#8d8276] uppercase tracking-[0.14em] mb-1 flex items-center gap-1">
                      <Truck size={11} className="text-[#9a7b56]" /> Method
                    </p>
                    <p className="text-[13px] font-semibold text-[#151413] capitalize">
                      {order.deliveryMethod?.replace(/_/g, " ") || "Standard"}
                    </p>
                  </div>
                </div>

                <div className="pt-1">
                  <p className="text-[10.5px] font-bold text-[#8d8276] uppercase tracking-[0.14em] mb-1 flex items-center gap-1">
                    <Mail size={11} className="text-[#9a7b56]" /> Email
                  </p>
                  <p className="text-[13px] font-semibold text-[#151413] break-all">{order.contactEmail}</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-[#fcfaf7] border-t border-[#f0e9df] flex items-center gap-2">
              <ShieldCheck size={14.5} className="text-[#9a7b56] shrink-0" />
              <p className="text-[11px] font-semibold text-[#6c6257] uppercase tracking-[0.12em]">
                Secure tracking · Auto-refreshing
              </p>
            </div>
          </div>
        </motion.div>

        {/* ──── Footer Navigation ──── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-8 pt-6 border-t border-[#e8e0d5] flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <button
            type="button"
            onClick={() => navigate(`/orders/${orderId}`)}
            className="w-full sm:w-auto h-11 px-6 rounded-full bg-white border border-[#d8cec0] hover:border-[#161514] text-[#151413] text-[11px] font-bold uppercase tracking-[0.14em] inline-flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <ArrowLeft size={13.5} /> Full Order Details
          </button>

          <button
            type="button"
            onClick={() => navigate("/orders")}
            className="w-full sm:w-auto h-11 px-7 rounded-full bg-[#161514] hover:bg-[#2c2926] text-white text-[11px] font-bold uppercase tracking-[0.14em] inline-flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(22,21,20,0.14)] hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <span>All Orders</span>
            <ArrowRight size={13.5} />
          </button>
        </motion.div>
      </div>
    </div>
  );
};
