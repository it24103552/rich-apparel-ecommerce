import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../hooks/useAuth";
import { ordersService, reviewsService, returnsService } from "../../services";
import { OrderDetailsSkeleton } from "../../components/loading/ClientSkeletons";
import { Modal } from "../../components/common/Modal";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { Select } from "../../components/common/Select";
import { StatusBadge } from "../../components/common/StatusBadge";
import { ReviewFormModal } from "../../components/features/ReviewFormModal";
import { formatPrice, formatDate } from "../../utils/formatters";
import { getDisplayColor } from "../../utils/colorUtils";
import { Package, MapPin, Phone, Mail, Truck, CreditCard, Trash2, Star, RotateCcw, ArrowLeft, ArrowRight, ChevronRight, Calendar, Info } from "lucide-react";

const STATUS_PILL_STYLES = {
  pending:   { pill: "bg-amber-50 text-amber-800 border-amber-200/80",     dot: "bg-amber-500" },
  confirmed: { pill: "bg-sky-50 text-sky-800 border-sky-200/80",           dot: "bg-sky-500" },
  shipped:   { pill: "bg-indigo-50 text-indigo-800 border-indigo-200/80",  dot: "bg-indigo-500" },
  delivered: { pill: "bg-emerald-50 text-emerald-800 border-emerald-200/80", dot: "bg-emerald-500" },
  cancelled: { pill: "bg-red-50 text-red-700 border-red-200/80",           dot: "bg-red-500" },
};

const OrderStatusPill = ({ status }) => {
  const key = status?.toLowerCase() || "pending";
  const style = STATUS_PILL_STYLES[key] || { pill: "bg-neutral-50 text-neutral-700 border-neutral-200", dot: "bg-neutral-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${style.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {status}
    </span>
  );
};

const DELIVERY_OPTIONS = [
  { value: "standard_delivery", label: "Standard Delivery (5-7 days)" },
  { value: "express_delivery", label: "Express Delivery (1-2 days)" },
  { value: "pickup", label: "Pickup from Store" },
];

const StarRating = ({ rating, size = "sm" }) => {
  const sizeClasses = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} className={`${sizeClasses} ${star <= rating ? "fill-black text-black" : "text-neutral-200"}`} />
      ))}
    </div>
  );
};

export const OrderDetailsPage = () => {
  const navigate = useNavigate();
  const params = useParams();
  const { isAuthenticated } = useAuth();
  const orderId = params.id;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const [userReviews, setUserReviews] = useState({});
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedReviewProduct, setSelectedReviewProduct] = useState(null);
  const [reviewSaving, setReviewSaving] = useState(false);
  const [deleteReviewTarget, setDeleteReviewTarget] = useState(null);
  const [deletingReview, setDeletingReview] = useState(false);

  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [returnImage, setReturnImage] = useState(null);
  const [selectedReturnItems, setSelectedReturnItems] = useState({}); // { orderItemId: quantity }
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const [showCancelReturnConfirm, setShowCancelReturnConfirm] = useState(false);
  const [cancellingReturn, setCancellingReturn] = useState(false);

  const [editForm, setEditForm] = useState({ address: "", contactNumber: "", contactEmail: "", deliveryMethod: "standard_delivery" });

  useEffect(() => { if (!isAuthenticated) { navigate("/login"); return; } fetchOrder(); }, [orderId, isAuthenticated, navigate]);
  useEffect(() => { if (order) setEditForm({ address: order.address || "", contactNumber: order.contactNumber || "", contactEmail: order.contactEmail || "", deliveryMethod: order.deliveryMethod || "standard_delivery" }); }, [order]);
  useEffect(() => { if (order?.status === "delivered") fetchUserReviews(); }, [order?.status]);

  const fetchOrder = async () => { setLoading(true); setError(""); try { const res = await ordersService.getById(orderId); setOrder(res.data.data); } catch (err) { setError(err.response?.data?.message || "Failed to load order"); } finally { setLoading(false); } };
  const fetchUserReviews = async () => { try { const res = await reviewsService.getMine(0, 200); const map = {}; res.data.data.reviews?.forEach((r) => { map[r.productId] = r; }); setUserReviews(map); } catch (err) { console.error(err); } };

  const handleUpdateOrder = async () => {
    if (!editForm.address || editForm.address.trim().length < 10) { toast.error("Address must be at least 10 characters"); return; }
    if (!editForm.contactNumber || !/^\d{10}$/.test(editForm.contactNumber)) { toast.error("Phone number must be exactly 10 digits"); return; }
    if (!editForm.contactEmail) { toast.error("Email is required"); return; }
    setSaving(true);
    try {
      const res = await ordersService.update(orderId, editForm);
      setOrder(res.data.data); // Update state immediately
      setEditMode(false);
      toast.success("Order updated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update order");
      fetchOrder(); // Sync back on error
    } finally {
      setSaving(false);
    }
  };
  const handleCancelOrder = async () => { setCancelling(true); try { await ordersService.cancel(orderId); toast.success("Order cancelled"); await fetchOrder(); } catch (err) { toast.error(err.response?.data?.message || "Failed"); } finally { setCancelling(false); setShowDeleteConfirm(false); } };

  const handleSaveReview = async (formData) => { setReviewSaving(true); try { const existing = userReviews[selectedReviewProduct.productId]; if (existing) await reviewsService.update(existing.id, formData); else { formData.append("productId", selectedReviewProduct.productId); await reviewsService.create(formData); } await fetchUserReviews(); setReviewModalOpen(false); setSelectedReviewProduct(null); toast.success("Review saved"); } catch (err) { toast.error(err.response?.data?.message || "Failed"); } finally { setReviewSaving(false); } };
  const handleDeleteReview = async () => { setDeletingReview(true); try { await reviewsService.delete(deleteReviewTarget.id); await fetchUserReviews(); setDeleteReviewTarget(null); toast.success("Review deleted"); } catch (err) { toast.error(err.response?.data?.message || "Failed"); } finally { setDeletingReview(false); } };

  const handleRequestReturn = async () => {
    if (returnReason.length < 10) { toast.error("Reason must be at least 10 characters"); return; }
    
    const returnItems = Object.entries(selectedReturnItems)
      .filter(([_, qty]) => qty > 0)
      .map(([id, qty]) => {
        const item = order.items.find(i => i.id === id);
        return {
          productId: item.productId,
          quantity: qty,
          variantAttributes: item.variantAttributes
        };
      });

    if (returnItems.length === 0) {
      toast.error("Please select at least one item to return");
      return;
    }

    setReturnSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("orderId", orderId);
      fd.append("reason", returnReason);
      fd.append("items", JSON.stringify(returnItems));
      if (returnImage) fd.append("image", returnImage);
      
      await returnsService.create(fd);
      setReturnReason("");
      setReturnImage(null);
      setSelectedReturnItems({});
      setReturnModalOpen(false);
      await fetchOrder();
      toast.success("Return request submitted successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit return request");
    } finally {
      setReturnSubmitting(false);
    }
  };
  const handleCancelReturn = async () => { setCancellingReturn(true); try { await returnsService.cancel(order.returns[0].id); setShowCancelReturnConfirm(false); await fetchOrder(); toast.success("Return cancelled"); } catch (err) { toast.error(err.response?.data?.message || "Failed"); } finally { setCancellingReturn(false); } };

  if (loading) return <OrderDetailsSkeleton />;
  if (!order) return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] px-4">
      <div className="text-center bg-white border border-neutral-100 rounded-2xl p-8 shadow-xs max-w-md w-full space-y-4">
        <p className="text-red-600 font-bold uppercase tracking-widest text-xs">{error || "Order not found"}</p>
        <div className="flex items-center justify-center gap-3 pt-1">
          <Button onClick={() => navigate("/orders")} variant="secondary" className="rounded-full px-7 cursor-pointer">Back</Button>
          {error && (
            <Button onClick={fetchOrder} variant="dark" className="rounded-full px-7 cursor-pointer">Retry</Button>
          )}
        </div>
      </div>
    </div>
  );

  const isPending = order.status === "pending";
  const isDelivered = order.status === "delivered";
  
  // Use DB shipping fee if available (new orders), otherwise fallback to legacy calculation
  const shippingFee = (order.shippingFee !== undefined && order.shippingFee !== null && order.shippingFee > 0) 
    ? order.shippingFee 
    : (order.method === 'return_replacement' ? 0 : (order.deliveryMethod === "express_delivery" ? 500 : (order.deliveryMethod === "pickup" ? 0 : 350)));
    
  const subtotal = order.items?.reduce((acc, item) => acc + (item.price * item.quantity), 0) || 0;
  
  // For new orders, order.total is the absolute final total (Subtotal + Shipping - Discounts)
  // For old orders, it was (Subtotal - Discounts) and needs the shippingFee added manually
  const isNewOrder = order.shippingFee !== undefined && order.shippingFee !== null && order.shippingFee > 0;
  const dbTotal = order.total || 0;
  const grandTotal = isNewOrder ? dbTotal : (dbTotal + shippingFee);
  
  const totalItemsWithDiscounts = isNewOrder ? (grandTotal - shippingFee) : dbTotal;
  const discounts = Math.max(0, subtotal - totalItemsWithDiscounts);



  const getPayBadge = (s) => {
    if (s === 'paid') return { pill: 'bg-emerald-50 text-emerald-800 border-emerald-200/80', dot: 'bg-emerald-500' };
    if (s === 'failed') return { pill: 'bg-red-50 text-red-700 border-red-200/80', dot: 'bg-red-500' };
    if (s === 'refunded') return { pill: 'bg-neutral-100 text-neutral-800 border-neutral-200', dot: 'bg-neutral-500' };
    if (s === 'refund_pending') return { pill: 'bg-amber-50 text-amber-800 border-amber-200/80', dot: 'bg-amber-500' };
    return { pill: 'bg-amber-50 text-amber-800 border-amber-200/80', dot: 'bg-amber-500' };
  };

  const getImgUrl = (img) => {
    if (!img) return null;
    if (img.startsWith('http')) return img;
    return `http://localhost:5001${img.startsWith('/') ? img : '/' + img}`;
  };

  const totalUnits = order.items?.reduce((a, i) => a + i.quantity, 0) || 0;

  return (
    <div className="min-h-screen bg-[#fafafa] selection:bg-black selection:text-white" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      <div className="max-w-[1320px] mx-auto px-[5%] lg:px-[6%] pt-8 md:pt-12 pb-20">

        {/* ──── Back & Breadcrumb Row ──── */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <button
            onClick={() => navigate("/orders")}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-full bg-white border border-neutral-200 text-neutral-700 hover:border-black hover:text-black text-[10px] font-bold uppercase tracking-[0.18em] transition-all cursor-pointer shadow-2xs"
          >
            <ArrowLeft size={13} /> Back to Orders
          </button>

          <nav className="hidden sm:flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
            <button onClick={() => navigate("/")} className="hover:text-black transition-colors cursor-pointer">Home</button>
            <ChevronRight size={10} />
            <button onClick={() => navigate("/orders")} className="hover:text-black transition-colors cursor-pointer">My Orders</button>
            <ChevronRight size={10} />
            <span className="text-black">#{orderId.slice(-8).toUpperCase()}</span>
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
                Order Details
              </h1>
              <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-[0.22em]">
                Order #{orderId.slice(-8).toUpperCase()} • Placed {formatDate(order.createdAt).split(",")[0]}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {order.method === 'return_replacement' && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-black text-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em]">
                <RotateCcw size={10} strokeWidth={2.5} /> Replacement
              </span>
            )}
            <OrderStatusPill status={order.status} />
            <button
              onClick={() => navigate(`/orders/${orderId}/track`)}
              className="h-10 px-6 rounded-full bg-black text-white text-[10px] font-bold uppercase tracking-[0.2em] inline-flex items-center gap-2 cursor-pointer shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:bg-neutral-800 hover:-translate-y-0.5 transition-all duration-300"
            >
              Track Order <ArrowRight size={13} />
            </button>
          </div>
        </motion.div>

        {error && (
          <div className="bg-red-50 text-red-700 border border-red-200/80 px-4 py-3 rounded-2xl text-[11px] font-semibold uppercase tracking-wider mb-6">
            {error}
          </div>
        )}

        {/* ──── Main Content Layout ──── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* LEFT: Order Items (Primary Focus — 7 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="lg:col-span-7 space-y-6"
          >
            <div className="bg-white rounded-2xl border border-neutral-100/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
              {/* Items Card Header */}
              <div className="px-6 py-5 flex items-center justify-between border-b border-neutral-100">
                <div className="flex items-center gap-2.5">
                  <Package size={16} className="text-black" />
                  <h2 className="text-xs font-bold uppercase tracking-[0.22em] text-black">Order Items</h2>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                  {totalUnits} {totalUnits === 1 ? "unit" : "units"}
                </span>
              </div>

              {/* Items List */}
              <div className="divide-y divide-neutral-100 px-6">
                {order.items?.map((item) => {
                  const variantEntries = item.variantAttributes
                    ? Object.entries(item.variantAttributes).filter(([k]) => k !== 'id')
                    : [];

                  return (
                    <div key={item.id} className="py-5 flex items-start sm:items-center gap-4 sm:gap-5">
                      {/* Thumbnail */}
                      <div className="w-16 h-20 sm:w-20 sm:h-24 bg-neutral-50 rounded-xl border border-neutral-100 overflow-hidden shrink-0">
                        {item.product?.images?.[0] || item.product?.imageUrl ? (
                          <img
                            src={getImgUrl(item.product.images?.[0] || item.product.imageUrl)}
                            alt={item.product?.name || "Product"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-300">
                            <Package size={20} />
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] sm:text-sm font-bold text-black uppercase tracking-tight leading-snug break-words">
                          {item.product?.name || "Product"}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2 text-[11px] font-medium text-neutral-500">
                          {variantEntries.map(([k, v]) => {
                            const isColor = k.toLowerCase().includes('col');
                            return (
                              <span key={k} className="inline-flex items-center gap-1.5 capitalize">
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
                          <span className="inline-flex items-center gap-1">
                            <span className="text-neutral-400">Qty:</span>
                            <span className="text-neutral-800 font-semibold">{item.quantity}</span>
                          </span>
                        </div>
                      </div>

                      {/* Item Price */}
                      <div className="text-right shrink-0">
                        <p className="text-sm sm:text-base font-bold text-black tracking-tight">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                        {item.quantity > 1 && (
                          <p className="text-[10px] text-neutral-400 font-semibold mt-0.5">
                            {formatPrice(item.price)} / ea
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Totals Breakdown */}
              <div className="bg-[#fafafa] px-6 py-5 border-t border-neutral-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-500 uppercase tracking-[0.15em]">Subtotal</span>
                  <span className="text-xs font-bold text-neutral-900">{formatPrice(subtotal)}</span>
                </div>

                {/* Promo Coupon Discount */}
                {order.orderDiscount?.couponDiscount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-500 uppercase tracking-[0.15em]">
                      Promo ({order.orderDiscount.couponCode})
                    </span>
                    <span className="text-xs font-bold text-emerald-700">-{formatPrice(order.orderDiscount.couponDiscount)}</span>
                  </div>
                )}

                {/* Loyalty Points Redeemed */}
                {order.orderDiscount?.pointsValue > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-500 uppercase tracking-[0.15em]">
                      Loyalty Redeemed ({order.orderDiscount.pointsUsed} pts)
                    </span>
                    <span className="text-xs font-bold text-emerald-700">-{formatPrice(order.orderDiscount.pointsValue)}</span>
                  </div>
                )}

                {/* Fallback for legacy orders or combined display if no explicit discount object exists */}
                {!order.orderDiscount && discounts > 0 && (
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

              {/* Grand Total */}
              <div className="px-6 py-5 bg-white flex items-center justify-between border-t border-neutral-200/70">
                <span className="text-xs font-bold text-black uppercase tracking-[0.2em]">Grand Total</span>
                <span className="text-xl sm:text-2xl font-bold text-black tracking-tight">{formatPrice(grandTotal)}</span>
              </div>
            </div>

            {/* Post-Delivery Section (Reviews & Returns) on Desktop inside left flow or full width below */}
            {isDelivered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-5"
              >
                {/* Reviews */}
                <div className="bg-white rounded-2xl border border-neutral-100/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
                  <div className="flex items-center gap-2 pb-4 mb-4 border-b border-neutral-100">
                    <Star size={15} className="text-black" />
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.22em] text-black">Reviews</h3>
                  </div>
                  <div className="space-y-3">
                    {order.items?.map((item) => {
                      const review = userReviews[item.productId];
                      return (
                        <div key={item.productId} className="flex items-center justify-between p-3 bg-[#fafafa] border border-neutral-100 rounded-xl gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold text-black uppercase truncate mb-0.5">{item.product?.name}</p>
                            {review ? <StarRating rating={review.rating} /> : <p className="text-[10px] text-neutral-400 font-medium">No review yet</p>}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => { setSelectedReviewProduct(item); setReviewModalOpen(true); }}
                              className="text-[10px] font-bold uppercase tracking-[0.15em] text-black border border-neutral-200 bg-white hover:border-black px-3 py-1 rounded-full transition-colors cursor-pointer"
                            >
                              {review ? "Edit" : "Write"}
                            </button>
                            {review && (
                              <button
                                onClick={() => setDeleteReviewTarget(review)}
                                className="p-1.5 text-neutral-400 hover:text-red-600 transition-colors cursor-pointer"
                                title="Delete Review"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Returns */}
                <div className="bg-white rounded-2xl border border-neutral-100/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 flex flex-col">
                  <div className="flex items-center gap-2 pb-4 mb-4 border-b border-neutral-100">
                    <RotateCcw size={15} className="text-black" />
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.22em] text-black">Returns</h3>
                  </div>
                  {order.returns?.length > 0 ? (
                    <div className="flex items-center justify-between p-3.5 bg-[#fafafa] border border-neutral-100 rounded-xl">
                      <div>
                        <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-[0.18em] mb-1.5">Return Status</p>
                        <OrderStatusPill status={order.returns[0].status} />
                      </div>
                      {order.returns[0].status === "pending" && (
                        <button
                          onClick={() => setShowCancelReturnConfirm(true)}
                          className="text-[10px] font-bold text-red-600 uppercase tracking-[0.15em] hover:underline cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col justify-between flex-1 gap-4">
                      <div>
                        <p className="text-xs text-neutral-500 font-medium leading-relaxed">
                          Request a return within 7 days of delivery.
                        </p>
                        {order.deliveredAt && (
                          <p className="text-[10px] font-bold text-neutral-800 uppercase tracking-wider mt-2">
                            Expires: {formatDate(new Date(new Date(order.deliveredAt).getTime() + 7 * 24 * 60 * 60 * 1000))}
                          </p>
                        )}
                      </div>
                      {(() => {
                        const deliveredAt = order.deliveredAt ? new Date(order.deliveredAt) : null;
                        const isWithin7Days = !deliveredAt || (new Date() - deliveredAt) <= 7 * 24 * 60 * 60 * 1000;

                        if (!isWithin7Days) return <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Window Expired</span>;

                        return (
                          <button
                            onClick={() => {
                              const initialItems = {};
                              order.items?.forEach(item => initialItems[item.id] = 0);
                              setSelectedReturnItems(initialItems);
                              setReturnModalOpen(true);
                            }}
                            className="w-full h-10 rounded-full bg-white border border-neutral-200 hover:border-black text-black text-[10px] font-bold uppercase tracking-[0.18em] transition-all cursor-pointer"
                          >
                            Request Return
                          </button>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* RIGHT: Summary, Delivery, Payment & Actions (5 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="lg:col-span-5 space-y-5"
          >
            {/* Delivery & Summary 2-column sub-grid on medium/wide, stacked on mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-5">
              {/* Delivery Card */}
              <div className="bg-white rounded-2xl border border-neutral-100/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
                <div className="flex items-center justify-between pb-4 mb-5 border-b border-neutral-100">
                  <div className="flex items-center gap-2">
                    <MapPin size={15} className="text-black" />
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.22em] text-black">Delivery Information</h3>
                  </div>
                  {isPending && !order.isUpdatedByUser && (
                    <button
                      onClick={() => setEditMode(true)}
                      className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-600 hover:text-black border border-neutral-200 hover:border-black px-3 py-1 rounded-full transition-all cursor-pointer"
                    >
                      Edit
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.18em] mb-1">Delivery Address</p>
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

              {/* Order Summary Card */}
              <div className="bg-white rounded-2xl border border-neutral-100/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
                <div className="flex items-center gap-2 pb-4 mb-5 border-b border-neutral-100">
                  <Info size={15} className="text-black" />
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.22em] text-black">Order Summary</h3>
                </div>

                <div className="grid grid-cols-3 gap-4 items-start">
                  <div>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.18em] mb-1.5 flex items-center gap-1">
                      <Calendar size={10} /> Placed
                    </p>
                    <p className="text-[12px] font-bold text-black">{formatDate(order.createdAt).split(",")[0]}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.18em] mb-1.5">Items</p>
                    <p className="text-[12px] font-bold text-black">{totalUnits} {totalUnits === 1 ? "unit" : "units"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.18em] mb-1.5">Status</p>
                    <OrderStatusPill status={order.status} />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Information Card */}
            <div className="bg-white rounded-2xl border border-neutral-100/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
              <div className="flex items-center gap-2 pb-4 mb-5 border-b border-neutral-100">
                <CreditCard size={15} className="text-black" />
                <h3 className="text-[11px] font-bold uppercase tracking-[0.22em] text-black">Payment Information</h3>
              </div>

              {order.payment ? (
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.18em] mb-1">Payment Method</p>
                      <p className="text-[13px] font-semibold text-neutral-900 capitalize">
                        {order.payment.method?.replace(/_/g, " ")}
                      </p>
                    </div>
                    {(() => {
                      const payBadge = getPayBadge(order.payment.status);
                      return (
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${payBadge.pill}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${payBadge.dot}`} />
                          {order.payment.status.replace(/_/g, " ")}
                        </span>
                      );
                    })()}
                  </div>
                  <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.18em]">Amount Charged</p>
                    <p className="text-lg font-bold text-black tracking-tight">{formatPrice(order.payment.amount)}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-neutral-500">Payment is awaiting completion.</span>
                    <OrderStatusPill status="pending" />
                  </div>
                  <Button
                    onClick={() => navigate(`/payment/${orderId}`)}
                    className="w-full rounded-full py-3 text-[10px] font-bold uppercase tracking-[0.2em] cursor-pointer bg-black text-white hover:bg-neutral-800"
                  >
                    COMPLETE PAYMENT
                  </Button>
                </div>
              )}
            </div>

            {/* Actions & Support */}
            <div className="bg-white rounded-2xl border border-neutral-100/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 space-y-3">
              <button
                onClick={() => navigate(`/orders/${orderId}/track`)}
                className="w-full h-12 rounded-full bg-black text-white text-[11px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2.5 cursor-pointer shadow-[0_8px_24px_rgba(0,0,0,0.14)] hover:bg-neutral-800 hover:-translate-y-0.5 transition-all duration-300"
              >
                <Truck size={14} /> Track Order <ArrowRight size={13} />
              </button>

              {isPending && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full h-10 rounded-full bg-white border border-neutral-200 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.18em] hover:border-red-300 hover:text-red-600 hover:bg-red-50/40 transition-all cursor-pointer"
                >
                  Cancel Order
                </button>
              )}

              <div className="pt-4 border-t border-neutral-100 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 mb-0.5">Need help?</p>
                <p className="text-[11px] text-neutral-500 font-medium">Available 24/7</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ──── Modals ──── */}
      <Modal isOpen={editMode} onClose={() => setEditMode(false)} title="Update Delivery" size="lg">
        <div className="space-y-5 pt-3">
          <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-start gap-3">
            <Info size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-[11px] font-bold text-amber-900 uppercase tracking-wide leading-relaxed">
              Note: Delivery details can only be updated once. Please ensure all information is accurate before saving.
            </p>
          </div>
          <div className="w-full">
            <label className="block text-[12px] font-bold text-black mb-3 ml-1 uppercase tracking-widest">Address</label>
            <input value={editForm.address} onChange={(e) => setEditForm(f => ({ ...f, address: e.target.value }))} className="w-full px-5 py-4 bg-white border border-neutral-100 rounded-[20px] transition-all outline-none text-[13.5px] font-bold shadow-sm focus:border-black focus:ring-4 focus:ring-black/5" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="w-full">
              <label className="block text-[12px] font-bold text-black mb-3 ml-1 uppercase tracking-widest">Phone</label>
              <input
                value={editForm.contactNumber}
                onChange={(e) => setEditForm(f => ({ ...f, contactNumber: e.target.value }))}
                onInput={(e) => e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10)}
                className="w-full px-5 py-4 bg-white border border-neutral-100 rounded-[20px] transition-all outline-none text-[13.5px] font-bold shadow-sm focus:border-black focus:ring-4 focus:ring-black/5"
                placeholder="0771234567"
              />
            </div>
            <div className="w-full">
              <label className="block text-[12px] font-bold text-black mb-3 ml-1 uppercase tracking-widest">Email</label>
              <input type="email" value={editForm.contactEmail} onChange={(e) => setEditForm(f => ({ ...f, contactEmail: e.target.value }))} className="w-full px-5 py-4 bg-white border border-neutral-100 rounded-[20px] transition-all outline-none text-[13.5px] font-bold shadow-sm focus:border-black focus:ring-4 focus:ring-black/5" />
            </div>
          </div>
          <div className="w-full">
            <label className="block text-[13px] font-bold text-neutral-800 mb-2 ml-1">Method</label>
            <select value={editForm.deliveryMethod} onChange={(e) => setEditForm(f => ({ ...f, deliveryMethod: e.target.value }))} className="w-full pl-5 pr-10 py-3.5 bg-white border border-neutral-200/50 rounded-[18px] outline-none text-[13.5px] font-bold appearance-none cursor-pointer focus:ring-8 focus:ring-black/5">
              {DELIVERY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="secondary" onClick={() => setEditMode(false)} className="rounded-xl px-6 cursor-pointer">Cancel</Button>
            <Button type="button" loading={saving} variant="dark" onClick={handleUpdateOrder} className="rounded-xl px-8 cursor-pointer">Save</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} onConfirm={handleCancelOrder} title="Cancel Order" message="Are you sure? This cannot be undone." loading={cancelling} isDanger confirmText="Cancel Order" />

      {selectedReviewProduct && (
        <ReviewFormModal isOpen={reviewModalOpen} onClose={() => { setReviewModalOpen(false); setSelectedReviewProduct(null); }} onSave={handleSaveReview} productName={selectedReviewProduct.product?.name} existingReview={userReviews[selectedReviewProduct.productId]} saving={reviewSaving} />
      )}

      <ConfirmDialog isOpen={!!deleteReviewTarget} onClose={() => setDeleteReviewTarget(null)} onConfirm={handleDeleteReview} title="Delete Review" message="Remove this review?" loading={deletingReview} isDanger confirmText="Delete Review" />

      <Modal isOpen={returnModalOpen} onClose={() => { setReturnModalOpen(false); setReturnReason(""); setReturnImage(null); }} title="Return Request" size="lg">
        <div className="space-y-4 pt-3">
          <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-100">
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-3">Select Items to Return</p>
            <div className="space-y-3">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-neutral-100/50 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-100 flex-shrink-0">
                      <img src={getImgUrl(item.product?.images?.[0] || item.product?.imageUrl)} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-black truncate max-w-[120px]">{item.product?.name}</p>
                      {item.variantAttributes && Object.entries(item.variantAttributes).length > 0 && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {Object.entries(item.variantAttributes).map(([key, value]) => (
                            <span key={key} className="text-[8px] font-bold uppercase tracking-wider text-black/50 bg-black/5 px-1.5 py-0.5 rounded">
                              {key}: {value}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-[8px] text-neutral-400 font-bold uppercase mt-1">Ordered: {item.quantity}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setSelectedReturnItems(prev => ({ ...prev, [item.id]: Math.max(0, (prev[item.id] || 0) - 1) }))}
                      className="w-7 h-7 rounded-lg border border-neutral-100 flex items-center justify-center text-neutral-400 hover:text-black hover:border-black transition-all cursor-pointer"
                    >-</button>
                    <span className="text-[11px] font-black w-4 text-center">{selectedReturnItems[item.id] || 0}</span>
                    <button 
                      onClick={() => setSelectedReturnItems(prev => ({ ...prev, [item.id]: Math.min(item.quantity, (prev[item.id] || 0) + 1) }))}
                      className="w-7 h-7 rounded-lg border border-neutral-100 flex items-center justify-center text-neutral-400 hover:text-black hover:border-black transition-all cursor-pointer"
                    >+</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1 block">Reason (min 10 chars)</label>
            <textarea value={returnReason} onChange={(e) => setReturnReason(e.target.value)} className="w-full p-4 bg-neutral-50 border border-neutral-100 rounded-2xl outline-none focus:border-black text-sm box-border" rows="3" placeholder="Why are you returning these items?" />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1 block">Photo (optional)</label>
            <input type="file" onChange={(e) => setReturnImage(e.target.files?.[0] || null)} className="text-xs file:bg-black file:text-white file:border-none file:px-3 file:py-1.5 file:rounded-lg file:cursor-pointer" />
            {returnImage && <img src={URL.createObjectURL(returnImage)} alt="" className="h-16 w-16 object-cover rounded-xl border mt-2" />}
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setReturnModalOpen(false)} className="rounded-xl px-6 cursor-pointer">Cancel</Button>
            <Button 
              onClick={handleRequestReturn} 
              loading={returnSubmitting} 
              disabled={returnReason.length < 10 || !Object.values(selectedReturnItems).some(q => q > 0)} 
              variant="dark" 
              className="rounded-xl px-8 cursor-pointer"
            >Submit Return</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={showCancelReturnConfirm} onClose={() => setShowCancelReturnConfirm(false)} onConfirm={handleCancelReturn} title="Cancel Return" message="Retract your return request?" loading={cancellingReturn} isDanger confirmText="Cancel Return" />
    </div>
  );
};
