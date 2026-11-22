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
  pending:   { pill: "bg-[#fdf6e9] text-[#8a5d19] border-[#ebd6ad]", dot: "bg-[#c88a28]" },
  confirmed: { pill: "bg-[#eef6fb] text-[#1e5c84] border-[#c4dfef]", dot: "bg-[#2c82b8]" },
  shipped:   { pill: "bg-[#f1f0fb] text-[#43398c] border-[#d3cef0]", dot: "bg-[#5b4fd1]" },
  delivered: { pill: "bg-[#edf7f1] text-[#1c6642] border-[#bee2cc]", dot: "bg-[#258a58]" },
  cancelled: { pill: "bg-[#fdf0f0] text-[#9e2a2b] border-[#f0c7c7]", dot: "bg-[#c93838]" },
};

const OrderStatusPill = ({ status }) => {
  const key = status?.toLowerCase() || "pending";
  const style = STATUS_PILL_STYLES[key] || { pill: "bg-[#faf7f2] text-[#5c544b] border-[#e6ddd0]", dot: "bg-[#9a8e80]" };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.14em] ${style.pill}`}>
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
        <Star key={star} className={`${sizeClasses} ${star <= rating ? "fill-[#e4a63a] text-[#e4a63a]" : "text-[#d5cabd]"}`} />
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
    <div
      className="min-h-[70vh] flex items-center justify-center bg-[#faf8f5] px-4"
      style={{ fontFamily: "'Montserrat', sans-serif" }}
    >
      <div className="text-center bg-white border border-[#e9e1d6] rounded-[22px] p-9 shadow-[0_6px_24px_rgba(32,25,18,0.045)] max-w-md w-full space-y-4">
        <p className="text-[#9e2a2b] font-bold uppercase tracking-[0.16em] text-xs">{error || "Order not found"}</p>
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
    if (s === 'paid') return { pill: 'bg-[#edf7f1] text-[#1c6642] border-[#bee2cc]', dot: 'bg-[#258a58]' };
    if (s === 'failed') return { pill: 'bg-[#fdf0f0] text-[#9e2a2b] border-[#f0c7c7]', dot: 'bg-[#c93838]' };
    if (s === 'refunded') return { pill: 'bg-[#f4efe8] text-[#5c5145] border-[#e4dcd0]', dot: 'bg-[#8d8276]' };
    if (s === 'refund_pending') return { pill: 'bg-[#fdf6e9] text-[#8a5d19] border-[#ebd6ad]', dot: 'bg-[#c88a28]' };
    return { pill: 'bg-[#fdf6e9] text-[#8a5d19] border-[#ebd6ad]', dot: 'bg-[#c88a28]' };
  };

  const getImgUrl = (img) => {
    if (!img) return null;
    if (img.startsWith('http')) return img;
    return `http://localhost:5001${img.startsWith('/') ? img : '/' + img}`;
  };

  const totalUnits = order.items?.reduce((a, i) => a + i.quantity, 0) || 0;

  return (
    <div className="min-h-screen bg-[#faf8f5] selection:bg-[#161514] selection:text-white" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-10 pb-20">

        {/* ──── Back & Breadcrumb Row ──── */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <button
            type="button"
            onClick={() => navigate("/orders")}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-full bg-white border border-[#dfd6ca] text-[#5c544b] hover:border-[#161514] hover:text-[#151413] text-[11px] font-bold uppercase tracking-[0.14em] transition-all cursor-pointer"
          >
            <ArrowLeft size={13} /> Back to Orders
          </button>

          <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8d8276]">
            <button type="button" onClick={() => navigate("/")} className="hover:text-[#151413] transition-colors cursor-pointer">Home</button>
            <ChevronRight size={11} className="text-[#b5a99b]" />
            <button type="button" onClick={() => navigate("/orders")} className="hover:text-[#151413] transition-colors cursor-pointer">My Orders</button>
            <ChevronRight size={11} className="text-[#b5a99b]" />
            <span className="text-[#151413] font-bold font-mono">#{orderId.slice(-8).toUpperCase()}</span>
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
                Order Details
              </h1>
              <p className="text-[12.5px] font-medium text-[#7a7064]">
                Order <span className="font-mono font-bold text-[#151413]">#{orderId.slice(-8).toUpperCase()}</span> • Placed {formatDate(order.createdAt).split(",")[0]}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {order.method === 'return_replacement' && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#161514] text-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em]">
                <RotateCcw size={10} strokeWidth={2.5} /> Replacement
              </span>
            )}
            <OrderStatusPill status={order.status} />
            <button
              type="button"
              onClick={() => navigate(`/orders/${orderId}/track`)}
              className="h-10 px-6 rounded-full bg-[#161514] hover:bg-[#2c2926] text-white text-[11px] font-bold uppercase tracking-[0.14em] inline-flex items-center gap-2 cursor-pointer shadow-[0_8px_22px_rgba(22,21,20,0.14)] hover:-translate-y-0.5 transition-all duration-200"
            >
              <span>Track Order</span>
              <ArrowRight size={13.5} />
            </button>
          </div>
        </motion.div>

        {error && (
          <div className="bg-[#fdf0f0] text-[#9e2a2b] border border-[#f0c7c7] px-4 py-3 rounded-xl text-[12px] font-semibold mb-6">
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
            <div className="bg-white rounded-2xl border border-[#e9e1d6] shadow-[0_2px_14px_rgba(32,25,18,0.035)] overflow-hidden">
              {/* Items Card Header */}
              <div className="px-6 py-4 bg-[#faf7f2] flex items-center justify-between border-b border-[#efe8de]">
                <div className="flex items-center gap-2.5">
                  <Package size={16} className="text-[#9a7b56]" />
                  <h2 className="text-[12.5px] font-extrabold uppercase tracking-[0.16em] text-[#151413]">Order Items</h2>
                </div>
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8d8276]">
                  {totalUnits} {totalUnits === 1 ? "unit" : "units"}
                </span>
              </div>

              {/* Items List */}
              <div className="divide-y divide-[#f2ece3] px-6">
                {order.items?.map((item) => {
                  const variantEntries = item.variantAttributes
                    ? Object.entries(item.variantAttributes).filter(([k]) => k !== 'id')
                    : [];

                  return (
                    <div key={item.id} className="py-5 flex items-start sm:items-center gap-4 sm:gap-5">
                      {/* Thumbnail */}
                      <div className="w-16 h-20 sm:w-20 sm:h-24 bg-[#f1ebe3] rounded-xl border border-[#eae2d7] overflow-hidden shrink-0">
                        {item.product?.images?.[0] || item.product?.imageUrl ? (
                          <img
                            src={getImgUrl(item.product.images?.[0] || item.product.imageUrl)}
                            alt={item.product?.name || "Product"}
                            className="w-full h-full object-cover object-[center_12%]"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#b8ada0]">
                            <Package size={20} />
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] sm:text-[15px] font-bold text-[#151413] tracking-[-0.01em] leading-snug break-words">
                          {item.product?.name || "Product"}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2 text-[11.5px] font-medium text-[#6c6257]">
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
                          <span className="inline-flex items-center gap-1">
                            <span className="text-[#8d8276]">Qty:</span>
                            <span className="text-[#151413] font-bold">{item.quantity}</span>
                          </span>
                        </div>
                      </div>

                      {/* Item Price */}
                      <div className="text-right shrink-0">
                        <p className="text-[15px] sm:text-[16px] font-extrabold text-[#151413] tracking-tight">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                        {item.quantity > 1 && (
                          <p className="text-[11px] text-[#8d8276] font-medium mt-0.5">
                            {formatPrice(item.price)} / ea
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Totals Breakdown */}
              <div className="bg-[#fcfaf7] px-6 py-5 border-t border-[#f0e9df] space-y-2.5 text-[13px]">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[#6c6257]">Subtotal</span>
                  <span className="font-bold text-[#151413]">{formatPrice(subtotal)}</span>
                </div>

                {/* Promo Coupon Discount */}
                {order.orderDiscount?.couponDiscount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[#6c6257]">
                      Promo ({order.orderDiscount.couponCode})
                    </span>
                    <span className="font-bold text-[#1c6642]">-{formatPrice(order.orderDiscount.couponDiscount)}</span>
                  </div>
                )}

                {/* Loyalty Points Redeemed */}
                {order.orderDiscount?.pointsValue > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[#6c6257]">
                      Loyalty Redeemed ({order.orderDiscount.pointsUsed} pts)
                    </span>
                    <span className="font-bold text-[#1c6642]">-{formatPrice(order.orderDiscount.pointsValue)}</span>
                  </div>
                )}

                {/* Fallback for legacy orders or combined display if no explicit discount object exists */}
                {!order.orderDiscount && discounts > 0 && (
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

              {/* Grand Total */}
              <div className="px-6 py-5 bg-white flex items-center justify-between border-t border-[#e8e0d5]">
                <span className="text-[12px] font-extrabold text-[#151413] uppercase tracking-[0.16em]">Grand Total</span>
                <span className="text-[22px] sm:text-[24px] font-extrabold text-[#151413] tracking-[-0.02em]">{formatPrice(grandTotal)}</span>
              </div>
            </div>

            {/* Post-Delivery Section (Reviews & Returns) */}
            {isDelivered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-5"
              >
                {/* Reviews */}
                <div className="bg-white rounded-2xl border border-[#e9e1d6] shadow-[0_2px_14px_rgba(32,25,18,0.035)] overflow-hidden">
                  <div className="px-6 py-4 bg-[#faf7f2] border-b border-[#efe8de] flex items-center gap-2">
                    <Star size={15} className="text-[#9a7b56]" />
                    <h3 className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#151413]">Reviews</h3>
                  </div>
                  <div className="p-5 space-y-3">
                    {order.items?.map((item) => {
                      const review = userReviews[item.productId];
                      return (
                        <div key={item.productId} className="flex items-center justify-between p-3.5 bg-[#faf8f5] border border-[#ebe3d8] rounded-xl gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-bold text-[#151413] truncate mb-1">{item.product?.name}</p>
                            {review ? <StarRating rating={review.rating} /> : <p className="text-[11px] text-[#8d8276] font-medium">No review yet</p>}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => { setSelectedReviewProduct(item); setReviewModalOpen(true); }}
                              className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-[#151413] border border-[#d8cec0] bg-white hover:border-[#161514] hover:bg-[#161514] hover:text-white px-3.5 py-1.5 rounded-full transition-colors cursor-pointer"
                            >
                              {review ? "Edit" : "Write"}
                            </button>
                            {review && (
                              <button
                                type="button"
                                onClick={() => setDeleteReviewTarget(review)}
                                className="p-1.5 rounded-lg text-[#9a8e80] hover:text-[#b43232] hover:bg-[#fdf0f0] transition-colors cursor-pointer"
                                title="Delete Review"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Returns */}
                <div className="bg-white rounded-2xl border border-[#e9e1d6] shadow-[0_2px_14px_rgba(32,25,18,0.035)] overflow-hidden flex flex-col">
                  <div className="px-6 py-4 bg-[#faf7f2] border-b border-[#efe8de] flex items-center gap-2">
                    <RotateCcw size={15} className="text-[#9a7b56]" />
                    <h3 className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#151413]">Returns</h3>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    {order.returns?.length > 0 ? (
                      <div className="flex items-center justify-between p-4 bg-[#faf8f5] border border-[#ebe3d8] rounded-xl">
                        <div>
                          <p className="text-[10px] font-bold text-[#8d8276] uppercase tracking-[0.14em] mb-1.5">Return Status</p>
                          <OrderStatusPill status={order.returns[0].status} />
                        </div>
                        {order.returns[0].status === "pending" && (
                          <button
                            type="button"
                            onClick={() => setShowCancelReturnConfirm(true)}
                            className="text-[11px] font-bold text-[#9e2a2b] uppercase tracking-[0.12em] hover:underline cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col justify-between flex-1 gap-4">
                        <div>
                          <p className="text-[13px] text-[#6c6257] font-medium leading-relaxed">
                            Request a return within 7 days of delivery.
                          </p>
                          {order.deliveredAt && (
                            <p className="text-[11px] font-bold text-[#2c2722] uppercase tracking-[0.1em] mt-2">
                              Expires: {formatDate(new Date(new Date(order.deliveredAt).getTime() + 7 * 24 * 60 * 60 * 1000))}
                            </p>
                          )}
                        </div>
                        {(() => {
                          const deliveredAt = order.deliveredAt ? new Date(order.deliveredAt) : null;
                          const isWithin7Days = !deliveredAt || (new Date() - deliveredAt) <= 7 * 24 * 60 * 60 * 1000;

                          if (!isWithin7Days) return <span className="text-[11px] font-bold text-[#9e2a2b] uppercase tracking-[0.14em]">Window Expired</span>;

                          return (
                            <button
                              type="button"
                              onClick={() => {
                                const initialItems = {};
                                order.items?.forEach(item => initialItems[item.id] = 0);
                                setSelectedReturnItems(initialItems);
                                setReturnModalOpen(true);
                              }}
                              className="w-full h-10 rounded-full bg-white border border-[#d8cec0] hover:border-[#161514] hover:bg-[#faf7f2] text-[#151413] text-[11px] font-bold uppercase tracking-[0.14em] transition-all cursor-pointer"
                            >
                              Request Return
                            </button>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* RIGHT: Summary, Delivery, Payment & Actions (5 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-5 space-y-5"
          >
            {/* Delivery & Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-5">
              {/* Delivery Card */}
              <div className="bg-white rounded-2xl border border-[#e9e1d6] shadow-[0_2px_14px_rgba(32,25,18,0.035)] overflow-hidden">
                <div className="px-6 py-4 bg-[#faf7f2] border-b border-[#efe8de] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin size={15} className="text-[#9a7b56]" />
                    <h3 className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#151413]">Delivery Information</h3>
                  </div>
                  {isPending && !order.isUpdatedByUser && (
                    <button
                      type="button"
                      onClick={() => setEditMode(true)}
                      className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-[#5c544b] hover:text-[#151413] bg-white border border-[#d8cec0] hover:border-[#161514] px-3 py-1 rounded-full transition-all cursor-pointer"
                    >
                      Edit
                    </button>
                  )}
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <p className="text-[10.5px] font-bold text-[#8d8276] uppercase tracking-[0.14em] mb-1">Delivery Address</p>
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

              {/* Order Summary Card */}
              <div className="bg-white rounded-2xl border border-[#e9e1d6] shadow-[0_2px_14px_rgba(32,25,18,0.035)] overflow-hidden">
                <div className="px-6 py-4 bg-[#faf7f2] border-b border-[#efe8de] flex items-center gap-2">
                  <Info size={15} className="text-[#9a7b56]" />
                  <h3 className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#151413]">Order Summary</h3>
                </div>

                <div className="p-6 grid grid-cols-2 lg:grid-cols-3 gap-4 items-start">
                  <div>
                    <p className="text-[10px] font-bold text-[#8d8276] uppercase tracking-[0.14em] mb-1.5 flex items-center gap-1">
                      <Calendar size={10.5} className="text-[#9a7b56]" /> Placed
                    </p>
                    <p className="text-[12.5px] font-bold text-[#151413]">{formatDate(order.createdAt).split(",")[0]}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#8d8276] uppercase tracking-[0.14em] mb-1.5">Items</p>
                    <p className="text-[12.5px] font-bold text-[#151413]">{totalUnits} {totalUnits === 1 ? "unit" : "units"}</p>
                  </div>
                  <div className="col-span-2 lg:col-span-1">
                    <p className="text-[10px] font-bold text-[#8d8276] uppercase tracking-[0.14em] mb-1.5">Status</p>
                    <OrderStatusPill status={order.status} />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Information Card */}
            <div className="bg-white rounded-2xl border border-[#e9e1d6] shadow-[0_2px_14px_rgba(32,25,18,0.035)] overflow-hidden">
              <div className="px-6 py-4 bg-[#faf7f2] border-b border-[#efe8de] flex items-center gap-2">
                <CreditCard size={15} className="text-[#9a7b56]" />
                <h3 className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#151413]">Payment Information</h3>
              </div>

              <div className="p-6">
                {order.payment ? (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10.5px] font-bold text-[#8d8276] uppercase tracking-[0.14em] mb-1">Payment Method</p>
                        <p className="text-[13.5px] font-semibold text-[#151413] capitalize">
                          {order.payment.method?.replace(/_/g, " ")}
                        </p>
                      </div>
                      {(() => {
                        const payBadge = getPayBadge(order.payment.status);
                        return (
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.14em] ${payBadge.pill}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${payBadge.dot}`} />
                            {order.payment.status.replace(/_/g, " ")}
                          </span>
                        );
                      })()}
                    </div>
                    <div className="pt-3.5 border-t border-[#f0e9df] flex items-center justify-between">
                      <p className="text-[10.5px] font-bold text-[#8d8276] uppercase tracking-[0.14em]">Amount Charged</p>
                      <p className="text-[19px] font-extrabold text-[#151413] tracking-tight">{formatPrice(order.payment.amount)}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-medium text-[#6c6257]">Payment is awaiting completion.</span>
                      <OrderStatusPill status="pending" />
                    </div>
                    <Button
                      onClick={() => navigate(`/payment/${orderId}`)}
                      className="w-full h-11 rounded-full text-[11.5px] font-bold uppercase tracking-[0.14em] cursor-pointer bg-[#161514] text-white hover:bg-[#2c2926]"
                    >
                      Complete Payment
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Actions & Support */}
            <div className="bg-white rounded-2xl border border-[#e9e1d6] shadow-[0_2px_14px_rgba(32,25,18,0.035)] p-6 space-y-3">
              <button
                type="button"
                onClick={() => navigate(`/orders/${orderId}/track`)}
                className="w-full h-12 rounded-full bg-[#161514] hover:bg-[#2c2926] text-white text-[11.5px] font-bold uppercase tracking-[0.14em] flex items-center justify-center gap-2.5 cursor-pointer shadow-[0_8px_22px_rgba(22,21,20,0.14)] hover:-translate-y-0.5 transition-all duration-200"
              >
                <Truck size={15} />
                <span>Track Order</span>
                <ArrowRight size={14} />
              </button>

              {isPending && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full h-10 rounded-full bg-white border border-[#dfd6ca] text-[11px] font-bold text-[#7a7064] uppercase tracking-[0.14em] hover:border-[#f0c7c7] hover:text-[#9e2a2b] hover:bg-[#fdf0f0] transition-all cursor-pointer"
                >
                  Cancel Order
                </button>
              )}

              <div className="pt-4 border-t border-[#f0e9df] text-center">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#8d8276] mb-0.5">Need help?</p>
                <p className="text-[12px] text-[#6c6257] font-medium">Customer support available 24/7</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ──── Modals ──── */}
      <Modal isOpen={editMode} onClose={() => setEditMode(false)} title="Update Delivery" size="lg">
        <div className="space-y-5 pt-2" style={{ fontFamily: "'Montserrat', sans-serif" }}>
          <div className="bg-[#fdf6e9] border border-[#ebd6ad] p-4 rounded-xl flex items-start gap-3">
            <Info size={16} className="text-[#c88a28] mt-0.5 flex-shrink-0" />
            <p className="text-[12px] font-semibold text-[#8a5d19] leading-relaxed">
              Note: Delivery details can only be updated once. Please ensure all information is accurate before saving.
            </p>
          </div>
          <div className="w-full">
            <label className="block text-[10.5px] font-bold text-[#5c544b] mb-2 ml-0.5 uppercase tracking-[0.16em]">Address</label>
            <input value={editForm.address} onChange={(e) => setEditForm(f => ({ ...f, address: e.target.value }))} className="w-full h-[50px] px-4 bg-white border border-[#E4DED6] rounded-[14px] transition-all outline-none text-[13.5px] font-semibold text-[#151413] focus:border-[#C9A77A] focus:ring-4 focus:ring-[#C9A77A]/15" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="w-full">
              <label className="block text-[10.5px] font-bold text-[#5c544b] mb-2 ml-0.5 uppercase tracking-[0.16em]">Phone</label>
              <input
                value={editForm.contactNumber}
                onChange={(e) => setEditForm(f => ({ ...f, contactNumber: e.target.value }))}
                onInput={(e) => e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10)}
                className="w-full h-[50px] px-4 bg-white border border-[#E4DED6] rounded-[14px] transition-all outline-none text-[13.5px] font-semibold text-[#151413] focus:border-[#C9A77A] focus:ring-4 focus:ring-[#C9A77A]/15"
                placeholder="0771234567"
              />
            </div>
            <div className="w-full">
              <label className="block text-[10.5px] font-bold text-[#5c544b] mb-2 ml-0.5 uppercase tracking-[0.16em]">Email</label>
              <input type="email" value={editForm.contactEmail} onChange={(e) => setEditForm(f => ({ ...f, contactEmail: e.target.value }))} className="w-full h-[50px] px-4 bg-white border border-[#E4DED6] rounded-[14px] transition-all outline-none text-[13.5px] font-semibold text-[#151413] focus:border-[#C9A77A] focus:ring-4 focus:ring-[#C9A77A]/15" />
            </div>
          </div>
          <div className="w-full">
            <label className="block text-[10.5px] font-bold text-[#5c544b] mb-2 ml-0.5 uppercase tracking-[0.16em]">Delivery Method</label>
            <select value={editForm.deliveryMethod} onChange={(e) => setEditForm(f => ({ ...f, deliveryMethod: e.target.value }))} className="w-full h-[50px] px-4 bg-white border border-[#E4DED6] rounded-[14px] outline-none text-[13.5px] font-semibold text-[#151413] cursor-pointer focus:border-[#C9A77A] focus:ring-4 focus:ring-[#C9A77A]/15">
              {DELIVERY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="flex gap-3 justify-end pt-4 border-t border-[#efe8de]">
            <Button type="button" variant="secondary" onClick={() => setEditMode(false)} className="rounded-full px-6 cursor-pointer">Cancel</Button>
            <Button type="button" loading={saving} variant="dark" onClick={handleUpdateOrder} className="rounded-full px-8 cursor-pointer">Save</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} onConfirm={handleCancelOrder} title="Cancel Order" message="Are you sure? This cannot be undone." loading={cancelling} isDanger confirmText="Cancel Order" />

      {selectedReviewProduct && (
        <ReviewFormModal isOpen={reviewModalOpen} onClose={() => { setReviewModalOpen(false); setSelectedReviewProduct(null); }} onSave={handleSaveReview} productName={selectedReviewProduct.product?.name} existingReview={userReviews[selectedReviewProduct.productId]} saving={reviewSaving} />
      )}

      <ConfirmDialog isOpen={!!deleteReviewTarget} onClose={() => setDeleteReviewTarget(null)} onConfirm={handleDeleteReview} title="Delete Review" message="Remove this review?" loading={deletingReview} isDanger confirmText="Delete Review" />

      <Modal isOpen={returnModalOpen} onClose={() => { setReturnModalOpen(false); setReturnReason(""); setReturnImage(null); }} title="Return Request" size="lg">
        <div className="space-y-5 pt-2" style={{ fontFamily: "'Montserrat', sans-serif" }}>
          <div className="bg-[#faf7f2] rounded-2xl p-4 border border-[#ebe3d8]">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#5c544b] mb-3">Select Items to Return</p>
            <div className="space-y-3">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-[#e6ddd0] gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-12 rounded-lg overflow-hidden bg-[#f1ebe3] border border-[#e6ddd0] flex-shrink-0">
                      <img src={getImgUrl(item.product?.images?.[0] || item.product?.imageUrl)} alt="" className="w-full h-full object-cover object-[center_12%]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-bold text-[#151413] truncate">{item.product?.name}</p>
                      {item.variantAttributes && Object.entries(item.variantAttributes).length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {Object.entries(item.variantAttributes).map(([key, value]) => (
                            <span key={key} className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#5c5145] bg-[#faf7f2] border border-[#e8dfd1] px-1.5 py-0.5 rounded">
                              {key}: {value}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-[10.5px] text-[#8d8276] font-semibold mt-1">Ordered: {item.quantity}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedReturnItems(prev => ({ ...prev, [item.id]: Math.max(0, (prev[item.id] || 0) - 1) }))}
                      className="w-8 h-8 rounded-full border border-[#d8cec0] flex items-center justify-center text-[#5c544b] hover:text-[#151413] hover:border-[#161514] transition-all cursor-pointer font-bold"
                    >-</button>
                    <span className="text-[12.5px] font-extrabold text-[#151413] w-5 text-center">{selectedReturnItems[item.id] || 0}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedReturnItems(prev => ({ ...prev, [item.id]: Math.min(item.quantity, (prev[item.id] || 0) + 1) }))}
                      className="w-8 h-8 rounded-full border border-[#d8cec0] flex items-center justify-center text-[#5c544b] hover:text-[#151413] hover:border-[#161514] transition-all cursor-pointer font-bold"
                    >+</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#5c544b] mb-2 block">Reason (min 10 chars)</label>
            <textarea value={returnReason} onChange={(e) => setReturnReason(e.target.value)} className="w-full p-4 bg-[#faf8f5] border border-[#e4dcd0] rounded-xl outline-none focus:bg-white focus:border-[#161514] focus:ring-2 focus:ring-[#c9a77a]/20 text-[13.5px] text-[#151413] placeholder:text-[#9a8e80] box-border" rows="3" placeholder="Why are you returning these items?" />
          </div>
          <div>
            <label className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#5c544b] mb-2 block">Photo (optional)</label>
            <input type="file" onChange={(e) => setReturnImage(e.target.files?.[0] || null)} className="text-[12px] text-[#5c544b] file:bg-[#161514] file:text-white file:border-none file:px-4 file:py-2 file:rounded-full file:text-[11px] file:font-bold file:uppercase file:tracking-[0.12em] file:mr-3 file:cursor-pointer" />
            {returnImage && <img src={URL.createObjectURL(returnImage)} alt="" className="h-16 w-16 object-cover rounded-xl border border-[#e6ddd0] mt-2.5" />}
          </div>
          <div className="flex gap-3 justify-end pt-3 border-t border-[#efe8de]">
            <Button variant="secondary" onClick={() => setReturnModalOpen(false)} className="rounded-full px-6 cursor-pointer">Cancel</Button>
            <Button
              onClick={handleRequestReturn}
              loading={returnSubmitting}
              disabled={returnReason.length < 10 || !Object.values(selectedReturnItems).some(q => q > 0)}
              variant="dark"
              className="rounded-full px-8 cursor-pointer"
            >Submit Return</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={showCancelReturnConfirm} onClose={() => setShowCancelReturnConfirm(false)} onConfirm={handleCancelReturn} title="Cancel Return" message="Retract your return request?" loading={cancellingReturn} isDanger confirmText="Cancel Return" />
    </div>
  );
};
