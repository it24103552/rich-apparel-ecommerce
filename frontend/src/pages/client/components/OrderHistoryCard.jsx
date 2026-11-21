import { useState } from "react";
import { motion } from "framer-motion";
import { formatPrice, formatDate } from "../../../utils/formatters";
import { getDisplayColor } from "../../../utils/colorUtils";
import {
  Package,
  Truck,
  XCircle,
  RotateCcw,
  Check,
  ArrowRight,
  Store,
  Calendar,
} from "lucide-react";

const STATUS_STYLES = {
  pending: {
    label: "Pending",
    pill: "bg-[#fdf6e9] text-[#8a5d19] border-[#ebd6ad]",
    dot: "bg-[#c88a28]",
  },
  confirmed: {
    label: "Confirmed",
    pill: "bg-[#eef6fb] text-[#1e5c84] border-[#c4dfef]",
    dot: "bg-[#2c82b8]",
  },
  shipped: {
    label: "Shipped",
    pill: "bg-[#f1f0fb] text-[#43398c] border-[#d3cef0]",
    dot: "bg-[#5b4fd1]",
  },
  delivered: {
    label: "Delivered",
    pill: "bg-[#edf7f1] text-[#1c6642] border-[#bee2cc]",
    dot: "bg-[#258a58]",
  },
  cancelled: {
    label: "Cancelled",
    pill: "bg-[#fdf0f0] text-[#9e2a2b] border-[#f0c7c7]",
    dot: "bg-[#c93838]",
  },
};

const TIMELINE_STEPS = [
  { key: "pending", label: "Ordered" },
  { key: "confirmed", label: "Confirmed" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

const getStepIndex = (status) => {
  const key = status?.toLowerCase();
  if (key === "cancelled") return -1;
  const idx = TIMELINE_STEPS.findIndex((s) => s.key === key);
  return idx === -1 ? 0 : idx;
};

const formatOrderDate = (dateValue) => {
  if (!dateValue) return "—";
  try {
    const formatted = formatDate(dateValue);
    const parts = formatted.split(",");
    if (parts.length >= 2) {
      return `${parts[0]},${parts[1]}`.trim();
    }
    return parts[0].trim();
  } catch {
    return "—";
  }
};

const formatDeliveryLabel = (deliveryMethod) => {
  if (!deliveryMethod) return "Standard Delivery";
  const normalized = deliveryMethod.toLowerCase();
  if (normalized === "standard_delivery") return "Standard Delivery";
  if (normalized === "express_delivery") return "Express Delivery";
  if (normalized === "pickup") return "Store Pickup";
  return deliveryMethod
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const computeDisplayTotal = (order) => {
  const sFee =
    order.shippingFee !== undefined &&
    order.shippingFee !== null &&
    order.shippingFee > 0
      ? order.shippingFee
      : order.method === "return_replacement"
        ? 0
        : order.deliveryMethod === "express_delivery"
          ? 500
          : order.deliveryMethod === "pickup"
            ? 0
            : 350;

  // If it's a new order (has shippingFee stored), total is already correct.
  // If it's a legacy order (shippingFee is 0 or null), total needs the calculated sFee added.
  const isNew =
    order.shippingFee !== undefined &&
    order.shippingFee !== null &&
    order.shippingFee > 0;
  return isNew ? order.total : order.total + sFee;
};

const getStatusHelperText = (order, deliveryLabel) => {
  const statusKey = order.status?.toLowerCase() || "pending";
  if (statusKey === "delivered") {
    return order.deliveredAt
      ? `Delivered on ${formatOrderDate(order.deliveredAt)}`
      : "Order delivered successfully";
  }
  if (statusKey === "shipped") {
    return `In transit via ${deliveryLabel}`;
  }
  if (statusKey === "confirmed") {
    return "Confirmed and being prepared for dispatch";
  }
  if (statusKey === "cancelled") {
    return "This order has been cancelled";
  }
  return "Order received — awaiting confirmation";
};

export const OrderHistoryCard = ({
  order,
  index,
  getImgUrl,
  onNavigateDetails,
  onNavigateTrack,
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  const statusKey = order.status?.toLowerCase() || "pending";
  const statusConfig = STATUS_STYLES[statusKey] || STATUS_STYLES.pending;

  const isCancelled = statusKey === "cancelled";
  const isDelivered = statusKey === "delivered";
  const isActiveTracking = ["pending", "confirmed", "shipped"].includes(statusKey);
  const currentStepIdx = getStepIndex(statusKey);

  const firstItem = order.items?.[0];
  const secondItem = order.items?.[1];
  const firstImgRaw =
    firstItem?.product?.images?.[0] || firstItem?.product?.imageUrl;
  const resolvedImg = firstImgRaw ? getImgUrl(firstImgRaw) : null;

  const totalQuantity =
    order.items?.reduce((acc, item) => acc + (item.quantity || 0), 0) || 0;
  const lineItemsCount = order.items?.length || 0;
  const extraItemsCount = lineItemsCount > 1 ? lineItemsCount - 1 : 0;

  const shortOrderCode = `#${order.id.slice(-6).toUpperCase()}`;
  const primaryProductName = firstItem?.product?.name || `Order ${shortOrderCode}`;
  const orderDateStr = formatOrderDate(order.createdAt);
  const deliveryLabel = formatDeliveryLabel(order.deliveryMethod);
  const displayTotal = computeDisplayTotal(order);

  const firstVariantEntries = firstItem?.variantAttributes
    ? Object.entries(firstItem.variantAttributes).filter(
        ([k, v]) => k !== "id" && v !== null && v !== undefined && v !== ""
      )
    : [];

  const DeliveryIcon =
    order.deliveryMethod?.toLowerCase() === "pickup" ? Store : Truck;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.32), duration: 0.35 }}
      onClick={() => onNavigateDetails(order.id)}
      className="group bg-white rounded-2xl border border-[#e9e1d6] hover:border-[#cfc1ae] shadow-[0_2px_14px_rgba(32,25,18,0.035)] hover:shadow-[0_10px_28px_rgba(32,25,18,0.075)] transition-all duration-300 overflow-hidden cursor-pointer"
    >
      {/* ──── 1. Order Header Bar ──── */}
      <div className="px-5 sm:px-6 py-3.5 sm:py-4 bg-[#faf7f2] border-b border-[#efe8de] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8d8276]">
              Order
            </span>
            <span className="text-[15px] sm:text-[16px] font-extrabold tracking-[0.04em] text-[#151413] font-mono">
              {shortOrderCode}
            </span>
          </div>

          {order.method === "return_replacement" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#161514] text-white px-2.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.14em]">
              <RotateCcw size={10} strokeWidth={2.4} />
              Replacement
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-[#7a7064]">
            <Calendar size={12} className="text-[#a39482]" strokeWidth={1.8} />
            {orderDateStr}
          </span>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${statusConfig.pill}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
            <span>{order.status || statusConfig.label}</span>
          </span>
        </div>
      </div>

      {/* ──── 2. Product Summary + Order Details ──── */}
      <div className="px-5 sm:px-6 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          {/* Compact Product Thumbnail (120–136px on desktop, never dominating) */}
          <div className="relative w-[96px] h-[112px] sm:w-[124px] sm:h-[136px] md:w-[132px] md:h-[144px] rounded-xl bg-[#f4efe8] border border-[#eae2d7] overflow-hidden shrink-0">
            {resolvedImg && !imgFailed ? (
              <img
                src={resolvedImg}
                alt={primaryProductName}
                onError={() => setImgFailed(true)}
                className="w-full h-full object-cover object-[center_15%] group-hover:scale-[1.03] transition-transform duration-500 ease-out"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#b8ada0]">
                <Package size={26} strokeWidth={1.6} />
              </div>
            )}

            {extraItemsCount > 0 && (
              <span className="absolute bottom-2 right-2 rounded-md bg-[#161514]/88 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 tracking-wide">
                +{extraItemsCount}
              </span>
            )}
          </div>

          {/* Product & Metadata Summary */}
          <div className="flex-1 min-w-0 flex flex-col justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[15px] sm:text-[16.5px] font-bold text-[#151413] tracking-[-0.01em] leading-snug group-hover:text-black transition-colors break-words">
                  {primaryProductName}
                </h3>
                {extraItemsCount > 0 && (
                  <span className="inline-flex items-center rounded-full bg-[#f4efe8] border border-[#e6ddd0] px-2.5 py-0.5 text-[10.5px] font-semibold text-[#5c5247]">
                    +{extraItemsCount} more item{extraItemsCount > 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {secondItem?.product?.name && (
                <p className="text-[12px] text-[#7c7267] font-normal mt-1 line-clamp-1">
                  Also includes {secondItem.product.name}
                  {extraItemsCount > 1 ? ` and ${extraItemsCount - 1} other` : ""}
                </p>
              )}

              {/* Variant details from first item if present */}
              {firstVariantEntries.length > 0 && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11.5px] text-[#6d6358]">
                  {firstVariantEntries.slice(0, 3).map(([k, v]) => {
                    const isColor = k.toLowerCase().includes("col");
                    const valText = Array.isArray(v) ? v.join(", ") : String(v);
                    return (
                      <span
                        key={k}
                        className="inline-flex items-center gap-1.5 capitalize"
                      >
                        <span className="text-[#9a8e80]">{k}:</span>
                        {isColor && (
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-[#d6ccbf] shrink-0"
                            style={{ backgroundColor: getDisplayColor(valText) }}
                          />
                        )}
                        <span className="font-medium text-[#3b352f]">{valText}</span>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Key Order Attributes */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-3 border-t border-[#f2ece3] text-[12px]">
              <div className="inline-flex items-center gap-1.5 text-[#5c5247]">
                <Package size={13.5} className="text-[#9a7b56]" strokeWidth={1.85} />
                <span className="font-medium text-[#2c2722]">
                  {totalQuantity} {totalQuantity === 1 ? "item" : "items"}
                </span>
              </div>

              <span className="hidden sm:inline-block h-3 w-px bg-[#e4dcd0]" aria-hidden="true" />

              <div className="inline-flex items-center gap-1.5 text-[#5c5247]">
                <DeliveryIcon
                  size={13.5}
                  className="text-[#9a7b56]"
                  strokeWidth={1.85}
                />
                <span className="font-normal text-[#5c5247]">{deliveryLabel}</span>
              </div>

              {order.payment?.status && (
                <>
                  <span className="hidden sm:inline-block h-3 w-px bg-[#e4dcd0]" aria-hidden="true" />
                  <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#7a7064]">
                    Payment:{" "}
                    <span className="text-[#2c2722] font-semibold capitalize">
                      {order.payment.status.replace(/_/g, " ")}
                    </span>
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Total Price Block */}
          <div className="sm:text-right sm:pl-6 sm:border-l sm:border-[#f0e9df] pt-3 sm:pt-0 border-t sm:border-t-0 border-[#f2ece3] flex sm:flex-col items-baseline sm:items-end justify-between shrink-0">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8d8276]">
              Total Amount
            </span>
            <div className="sm:mt-1">
              <p className="text-[19px] sm:text-[21px] font-extrabold text-[#151413] tracking-[-0.02em] leading-none">
                {formatPrice(displayTotal)}
              </p>
              {order.method === "return_replacement" && (
                <p className="text-[10.5px] font-medium text-[#8d8276] mt-1">
                  Warranty / Return Replacement
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ──── 3. Compact Delivery Progress Timeline ──── */}
      <div className="px-5 sm:px-6 py-4 bg-[#fcfaf7] border-t border-[#f0e9df]">
        {isCancelled ? (
          <div className="flex items-center gap-2.5 text-[12px] text-[#9e2a2b]">
            <XCircle size={15} strokeWidth={2} className="shrink-0" />
            <span className="font-semibold">Order Cancelled</span>
            <span className="text-[#8a7575] font-normal">
              — Delivery tracking is no longer active for this order.
            </span>
          </div>
        ) : (
          <div aria-label={`Delivery progress: ${order.status}`}>
            <div className="grid grid-cols-4 gap-1 sm:flex sm:items-center sm:gap-0 relative">
              {TIMELINE_STEPS.map((step, i) => {
                const isCompleted = isDelivered || i < currentStepIdx;
                const isCurrent = !isDelivered && i === currentStepIdx;
                const isLineFilled = isDelivered || i < currentStepIdx;
                const isLast = i === TIMELINE_STEPS.length - 1;

                return (
                  <div
                    key={step.key}
                    className={`relative flex flex-col sm:flex-row items-center ${
                      isLast ? "sm:flex-none" : "sm:flex-1"
                    }`}
                  >
                    {/* Step indicator + label */}
                    <div
                      className={`flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2 z-10 bg-[#fcfaf7] ${
                        isLast ? "" : "sm:pr-3"
                      }`}
                    >
                      {isCompleted ? (
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                            isDelivered
                              ? "bg-[#1c6642] text-white"
                              : "bg-[#161514] text-white"
                          }`}
                        >
                          <Check size={11} strokeWidth={3} />
                        </span>
                      ) : isCurrent ? (
                        <span className="w-5 h-5 rounded-full border-2 border-[#9a7b56] bg-[#faf2e6] flex items-center justify-center shrink-0">
                          <span className="w-2 h-2 rounded-full bg-[#9a7b56]" />
                        </span>
                      ) : (
                        <span className="w-5 h-5 rounded-full border border-[#d6ccc0] bg-white shrink-0" />
                      )}

                      <span
                        className={`text-[10.5px] sm:text-[11.5px] tracking-[0.02em] text-center sm:text-left whitespace-nowrap ${
                          isCurrent
                            ? "font-bold text-[#151413]"
                            : isCompleted
                              ? "font-semibold text-[#2a2520]"
                              : "font-normal text-[#a19587]"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>

                    {/* Connecting Track Line (desktop & tablet inline, mobile positioned across top) */}
                    {!isLast && (
                      <>
                        {/* Desktop/tablet horizontal connector */}
                        <div
                          className={`hidden sm:block flex-1 h-[1.5px] mr-3 rounded-full transition-colors ${
                            isLineFilled
                              ? isDelivered
                                ? "bg-[#1c6642]/70"
                                : "bg-[#161514]"
                              : "bg-[#e3dbd0]"
                          }`}
                          aria-hidden="true"
                        />
                        {/* Mobile connector between dots */}
                        <div
                          className={`sm:hidden absolute top-[10px] left-[calc(50%+12px)] right-[calc(-50%+12px)] h-[1.5px] rounded-full ${
                            isLineFilled
                              ? isDelivered
                                ? "bg-[#1c6642]/70"
                                : "bg-[#161514]"
                              : "bg-[#e3dbd0]"
                          }`}
                          aria-hidden="true"
                        />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ──── 4. Order Actions Footer ──── */}
      <div className="px-5 sm:px-6 py-3.5 bg-white border-t border-[#efe8de] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-[11.5px] font-normal text-[#7a7064]">
          {getStatusHelperText(order, deliveryLabel)}
        </p>

        <div className="flex items-center gap-2.5 w-full sm:w-auto sm:justify-end">
          {isActiveTracking ? (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigateTrack(order.id);
                }}
                className="flex-1 sm:flex-initial h-10 px-5 rounded-xl bg-[#161514] hover:bg-[#2c2926] active:scale-[0.99] text-white text-[11px] font-bold uppercase tracking-[0.14em] inline-flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer"
              >
                <Truck size={13.5} strokeWidth={2} />
                <span>Track Order</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigateDetails(order.id);
                }}
                className="flex-1 sm:flex-initial h-10 px-5 rounded-xl bg-white border border-[#d8cec0] hover:border-[#161514] hover:bg-[#faf7f2] text-[#1a1816] text-[11px] font-bold uppercase tracking-[0.14em] inline-flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer"
              >
                <span>Details</span>
                <ArrowRight size={13} strokeWidth={2} />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigateTrack(order.id);
                }}
                className="h-10 px-4 rounded-xl text-[#7a7064] hover:text-[#151413] hover:bg-[#f5f0e8] text-[11px] font-semibold uppercase tracking-[0.12em] inline-flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer"
              >
                <Truck size={13} strokeWidth={1.85} />
                <span>Tracking</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigateDetails(order.id);
                }}
                className="flex-1 sm:flex-initial h-10 px-6 rounded-xl bg-[#161514] hover:bg-[#2c2926] active:scale-[0.99] text-white text-[11px] font-bold uppercase tracking-[0.14em] inline-flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer"
              >
                <span>View Details</span>
                <ArrowRight size={13} strokeWidth={2} />
              </button>
            </>
          )}
        </div>
      </div>
    </motion.article>
  );
};
