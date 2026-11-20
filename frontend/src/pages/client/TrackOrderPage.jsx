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
  pending:   { pill: "bg-amber-50 text-amber-800 border-amber-200/80",       dot: "bg-amber-500" },
  confirmed: { pill: "bg-sky-50 text-sky-800 border-sky-200/80",             dot: "bg-sky-500" },
  shipped:   { pill: "bg-indigo-50 text-indigo-800 border-indigo-200/80",    dot: "bg-indigo-500" },
  delivered: { pill: "bg-emerald-50 text-emerald-800 border-emerald-200/80", dot: "bg-emerald-500" },
  cancelled: { pill: "bg-red-50 text-red-700 border-red-200/80",             dot: "bg-red-500" },
};

/* ───── skeleton ───── */
const Skeleton = () => (
  <div className="min-h-screen bg-[#fafafa]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
    <div className="max-w-[1200px] mx-auto px-[5%] lg:px-[6%] pt-8 md:pt-12 pb-20">
      <div className="h-9 w-36 bg-neutral-200/60 rounded-full animate-pulse mb-6" />
      <div className="h-14 w-72 bg-neutral-200/60 rounded-xl animate-pulse mb-8" />
      <div className="h-44 bg-white border border-neutral-100 rounded-2xl animate-pulse mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 h-72 bg-white border border-neutral-100 rounded-2xl animate-pulse" />
        <div className="lg:col-span-5 h-72 bg-white border border-neutral-100 rounded-2xl animate-pulse" />
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
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
      <div className="text-center space-y-4">
        <p className="text-red-600 font-bold uppercase tracking-widest text-xs">{error || "Order not found"}</p>
        <button onClick={() => navigate("/orders")} className="bg-black text-white px-8 py-3 rounded-full text-[11px] font-bold uppercase tracking-widest cursor-pointer">Back</button>
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
  const statusPill = STATUS_PILL_STYLES[statusKey] || { pill: "bg-neutral-50 text-neutral-700 border-neutral-200", dot: "bg-neutral-400" };
  const totalItemsCount = order.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  return (
    <div className="min-h-screen bg-[#fafafa] selection:bg-black selection:text-white" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      <div className="max-w-[1200px] mx-auto px-[5%] lg:px-[6%] pt-8 md:pt-12 pb-20">

        {/* ──── Back & Breadcrumb Row ──── */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <button
            onClick={() => navigate(`/orders/${orderId}`)}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-full bg-white border border-neutral-200 text-neutral-700 hover:border-black hover:text-black text-[10px] font-bold uppercase tracking-[0.18em] transition-all cursor-pointer shadow-2xs"
          >
            <ArrowLeft size={13} /> Back to Order
          </button>

          <nav className="hidden sm:flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
            <button onClick={() => navigate("/")} className="hover:text-black transition-colors cursor-pointer">Home</button>
            <ChevronRight size={10} />
            <button onClick={() => navigate("/orders")} className="hover:text-black transition-colors cursor-pointer">My Orders</button>
            <ChevronRight size={10} />
            <button onClick={() => navigate(`/orders/${orderId}`)} className="hover:text-black transition-colors cursor-pointer">#{orderId.slice(-8).toUpperCase()}</button>
            <ChevronRight size={10} />
            <span className="text-black">Track</span>
          </nav>
        </div>

        {/* ──── Order Header ──── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 mb-8 border-b border-neutral-200/70"
        >
          <div className="flex items-start gap-4">
            <div className="w-1.5 h-10 md:h-12 bg-black rounded-full mt-1 shrink-0" />
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter uppercase text-black leading-none mb-2">
                Track Order
              </h1>
              <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-[0.22em]">
                #{orderId.slice(-8).toUpperCase()} • Order Placed {formatDate(order.createdAt).split(",")[0]}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] ${statusPill.pill}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusPill.dot}`} />
              {order.status}
            </span>

            <button
              onClick={() => fetchOrder(true)}
              disabled={refreshing}
              title="Refresh"
              className="h-9 px-4 rounded-full bg-white border border-neutral-200 hover:border-black text-neutral-700 hover:text-black inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] transition-all cursor-pointer disabled:opacity-40 shadow-2xs"
            >
              <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
              <span>{refreshing ? "Refreshing" : "Refresh"}</span>
            </button>
          </div>
        </motion.div>

        {/* ──── Cancelled Banner ──── */}
        {isCancelled && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white border border-red-200/80 rounded-2xl p-8 text-center mb-8 shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
          >
            <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-3">
              <Package size={20} className="text-red-500" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-700 mb-1">Order Cancelled</p>
            <p className="text-xs text-neutral-500 font-medium">This order has been cancelled and is no longer progressing.</p>
          </motion.div>
        )}

        {/* ──── Tracking Progress — PRIMARY FOCUS ──── */}
        {!isCancelled && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="bg-white rounded-2xl border border-neutral-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6 sm:p-8 md:p-10 mb-8"
          >
            {/* Section Title Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-6 mb-8 border-b border-neutral-100">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-[0.22em] text-black">Order Progress</h2>
                <p className="text-[11px] text-neutral-400 font-medium mt-1">
                  Current Stage: <span className="text-black font-semibold">{STEPS[currentIdx]?.label}</span>
                  {currentIdx < STEPS.length - 1 && (
                    <span> · Next: {STEPS[currentIdx + 1]?.label}</span>
                  )}
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-50 border border-neutral-200/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-neutral-700">Live Tracking</span>
              </div>
            </div>

            {/* Desktop / Tablet Horizontal Timeline */}
            <div className="hidden sm:block relative py-2">
              {/* Background connecting line */}
              <div className="absolute left-[12.5%] right-[12.5%] top-8 h-[2px] bg-neutral-200/80 rounded-full" />
              {/* Active connecting line */}
              <motion.div
                className="absolute left-[12.5%] top-8 h-[2px] bg-black rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: `${(currentIdx / (STEPS.length - 1)) * 75}%` }}
                transition={{ duration: 0.9, ease: "easeInOut", delay: 0.15 }}
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
                      transition={{ delay: 0.12 + i * 0.08 }}
                      className="relative z-10 flex flex-col items-center flex-1 text-center px-2"
                    >
                      <div className="relative">
                        {isCurrent && (
                          <motion.div
                            className="absolute inset-0 rounded-full border-2 border-black/20"
                            animate={{ scale: [1, 1.38, 1], opacity: [0.45, 0, 0.45] }}
                            transition={{ duration: 2.2, repeat: Infinity }}
                          />
                        )}
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-400 ${
                            isCurrent
                              ? "bg-black text-white shadow-[0_8px_20px_rgba(0,0,0,0.18)] ring-4 ring-black/10"
                              : isComplete
                                ? "bg-black text-white"
                                : "bg-white border-2 border-neutral-200 text-neutral-400"
                          }`}
                        >
                          {isComplete && !isCurrent ? <CheckCircle2 size={18} /> : <Icon size={18} />}
                        </div>
                      </div>

                      <p className={`mt-3.5 text-[11px] uppercase tracking-[0.18em] ${
                        isCurrent
                          ? "font-bold text-black"
                          : isComplete
                            ? "font-bold text-neutral-800"
                            : "font-semibold text-neutral-400"
                      }`}>
                        {step.label}
                      </p>

                      {isCurrent && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.4 }}
                          className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-full bg-neutral-100 border border-neutral-200/70"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[9px] font-bold text-black uppercase tracking-[0.15em]">Live</span>
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
                            ? "bg-black text-white ring-4 ring-black/10 shadow-md"
                            : isComplete
                              ? "bg-black text-white"
                              : "bg-white border-2 border-neutral-200 text-neutral-400"
                        }`}
                      >
                        {isComplete && !isCurrent ? <CheckCircle2 size={16} /> : <Icon size={16} />}
                      </div>
                      {!isLast && (
                        <div className={`w-[2px] flex-1 min-h-[28px] my-1.5 ${i < currentIdx ? "bg-black" : "bg-neutral-200"}`} />
                      )}
                    </div>

                    <div className={`flex-1 flex items-center justify-between ${!isLast ? "pb-6" : "pt-1"}`}>
                      <div>
                        <p className={`text-xs uppercase tracking-[0.16em] ${
                          isComplete ? "font-bold text-black" : "font-semibold text-neutral-400"
                        }`}>
                          {step.label}
                        </p>
                        <p className="text-[10px] text-neutral-400 font-medium mt-0.5">
                          {isCurrent ? "Current stage" : isComplete ? "Completed" : "Upcoming"}
                        </p>
                      </div>
                      {isCurrent && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 border border-neutral-200/80">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[9px] font-bold text-black uppercase tracking-[0.15em]">Live</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ──── Two Column: Order Items + Delivery ──── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
        >
          {/* Items — 7 cols */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-neutral-100/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Package size={16} className="text-black" />
                <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-black">Order Items</h3>
              </div>
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.18em]">
                {totalItemsCount} {totalItemsCount === 1 ? "item" : "items"}
              </span>
            </div>

            <div className="divide-y divide-neutral-100 px-6">
              {order.items?.map((item) => {
                const variantEntries = item.variantAttributes
                  ? Object.entries(item.variantAttributes).filter(([k]) => k !== 'id')
                  : [];

                return (
                  <div key={item.id} className="py-5 flex items-start sm:items-center gap-4 sm:gap-5">
                    <div className="w-16 h-20 bg-neutral-50 border border-neutral-100 rounded-xl overflow-hidden shrink-0">
                      {item.product?.images?.[0] || item.product?.imageUrl ? (
                        <img
                          src={getImgUrl(item.product.images?.[0] || item.product.imageUrl)}
                          alt={item.product?.name || "Product"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-300">
                          <Package size={18} />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] sm:text-sm font-bold text-black uppercase tracking-tight leading-snug break-words">
                        {item.product?.name || "Product"}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-1.5 text-[11px] font-medium text-neutral-500">
                        {variantEntries.map(([k, v]) => {
                          const isColor = k.toLowerCase().includes('col');
                          return (
                            <span key={k} className="inline-flex items-center gap-1.5 uppercase tracking-wide text-[10px]">
                              <span className="text-neutral-400">{k}:</span>
                              {isColor && (
                                <span
                                  className="w-2.5 h-2.5 rounded-full border border-neutral-300 shrink-0"
                                  style={{ backgroundColor: getDisplayColor(String(v)) }}
                                />
                              )}
                              <span className="text-neutral-700 font-semibold">{String(v)}</span>
                            </span>
                          );
                        })}
                        <span className="text-[10px] uppercase tracking-wide text-neutral-700 font-semibold">
                          ×{item.quantity}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm sm:text-base font-bold text-black whitespace-nowrap shrink-0">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="bg-[#fafafa] px-6 py-5 border-t border-neutral-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-[0.15em]">Subtotal</span>
                <span className="text-xs font-bold text-neutral-900">{formatPrice(subtotal)}</span>
              </div>
              {discounts > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-500 uppercase tracking-[0.15em]">Discounts</span>
                  <span className="text-xs font-bold text-emerald-700">-{formatPrice(discounts)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-[0.15em]">Delivery Charge</span>
                <span className="text-xs font-bold text-neutral-900">{formatPrice(shippingFee)}</span>
              </div>
            </div>

            <div className="px-6 py-5 bg-white flex items-center justify-between border-t border-neutral-200/70">
              <span className="text-xs font-bold text-black uppercase tracking-[0.2em]">Grand Total</span>
              <span className="text-xl sm:text-2xl font-bold text-black tracking-tight">{formatPrice(grandTotal)}</span>
            </div>
          </div>

          {/* Delivery — 5 cols */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-neutral-100/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 pb-4 mb-5 border-b border-neutral-100">
                <MapPin size={15} className="text-black" />
                <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-black">Delivery</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.18em] mb-1">Address</p>
                  <p className="text-[13px] font-semibold text-neutral-900 leading-relaxed break-words">{order.address}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.18em] mb-1 flex items-center gap-1">
                      <Phone size={10} /> Contact
                    </p>
                    <p className="text-[12px] font-semibold text-neutral-900">{order.contactNumber}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.18em] mb-1 flex items-center gap-1">
                      <Truck size={10} /> Method
                    </p>
                    <p className="text-[12px] font-semibold text-neutral-900 capitalize">
                      {order.deliveryMethod?.replace(/_/g, " ") || "Standard"}
                    </p>
                  </div>
                </div>

                <div className="pt-1">
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.18em] mb-1 flex items-center gap-1">
                    <Mail size={10} /> Email
                  </p>
                  <p className="text-[12px] font-semibold text-neutral-900 break-all">{order.contactEmail}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center gap-2">
              <ShieldCheck size={14} className="text-neutral-700 shrink-0" />
              <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-[0.15em]">
                Secure tracking · Auto-refreshing
              </p>
            </div>
          </div>
        </motion.div>

        {/* ──── Footer Navigation ──── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="mt-8 pt-6 border-t border-neutral-200/70 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <button
            onClick={() => navigate(`/orders/${orderId}`)}
            className="w-full sm:w-auto h-11 px-6 rounded-full bg-white border border-neutral-200 hover:border-black text-black text-[10px] font-bold uppercase tracking-[0.18em] inline-flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
          >
            <ArrowLeft size={13} /> Full Order Details
          </button>

          <button
            onClick={() => navigate("/orders")}
            className="w-full sm:w-auto h-11 px-7 rounded-full bg-black text-white hover:bg-neutral-800 text-[10px] font-bold uppercase tracking-[0.18em] inline-flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            All Orders <ArrowRight size={13} />
          </button>
        </motion.div>
      </div>
    </div>
  );
};
