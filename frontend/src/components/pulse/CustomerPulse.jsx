import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Sparkles,
  Minus,
  X,
  Star,
  ArrowRight,
  Truck,
  Award,
  Package,
  Clock,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../hooks/useCart";
import {
  reviewsService,
  productsService,
  loyaltyService,
  ordersService,
} from "../../services";
import { formatPrice, formatStatus } from "../../utils/formatters";
import { resolveImageUrl } from "../../utils/imageHelpers";
import { useFloatingWidgets } from "../../hooks/useFloatingWidgets";
import { PULSE_MINIMIZED_STORAGE_KEY } from "../../context/floatingWidgetState";
import "./CustomerPulse.css";

const MINIMIZED_STORAGE_KEY = PULSE_MINIMIZED_STORAGE_KEY;
const ROTATION_INTERVAL_MS = 7000;
const NEW_ARRIVAL_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const LOW_STOCK_THRESHOLD = 5;

const writeStorageFlag = (key, value) => {
  try {
    window.localStorage.setItem(key, value ? "true" : "false");
  } catch {
    // Ignore storage quota / privacy mode errors
  }
};

/**
 * Checks whether the current session JWT is present and unexpired so
 * authenticated-only endpoints are never called with an expired token.
 */
const hasValidSessionToken = () => {
  try {
    const token = window.sessionStorage.getItem("token");
    if (!token) return false;
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return false;
    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));
    if (typeof payload.exp === "number" && payload.exp * 1000 <= Date.now()) {
      return false;
    }
    return Boolean(payload.id);
  } catch {
    return false;
  }
};

const formatReviewerName = (rawName) => {
  if (typeof rawName !== "string") return "Verified customer";
  const parts = rawName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Verified customer";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[1].charAt(0).toUpperCase()}.`;
};

const truncateAtWord = (text, maxLength = 105) => {
  const clean = String(text || "").trim().replace(/\s+/g, " ");
  if (clean.length <= maxLength) return clean;
  const sliced = clean.slice(0, maxLength);
  const lastSpace = sliced.lastIndexOf(" ");
  return `${lastSpace > 40 ? sliced.slice(0, lastSpace) : sliced}...`;
};

const cleanLabel = (value, fallback = "") => {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim().replace(/\s+/g, " ");
  return trimmed || fallback;
};

const getProductImage = (product) => {
  if (!product) return null;
  const imgPath = product.images?.[0] || product.imageUrl;
  return imgPath ? resolveImageUrl(imgPath, null) : null;
};

const isProductEligible = (product) => {
  return Boolean(
    product &&
      !product.isDeleted &&
      product.isActive !== false &&
      Number(product.stock) > 0
  );
};

export const CustomerPulse = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { isCartOpen, items: cartItems } = useCart();

  const [dismissed, setDismissed] = useState(false);
  // Expanded only while it is the active floating widget (shared with Support Chat).
  const { activeFloatingWidget, setActiveFloatingWidget } = useFloatingWidgets();
  const minimized = activeFloatingWidget !== "pulse";
  const [mobileProductExpandedPath, setMobileProductExpandedPath] =
    useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [catalogData, setCatalogData] = useState({
    reviews: [],
    popularProducts: [],
    popularWindowDays: null,
    products: [],
    fetchedAt: 0,
    loaded: false,
  });
  const [userData, setUserData] = useState({
    userId: null,
    loyaltyBalance: 0,
    activeOrder: null,
  });

  const containerRef = useRef(null);

  const userId = user?.id ?? null;
  const cartItemCount = cartItems.length;
  const pathname = location.pathname;
  const isCheckoutOrCartPage =
    pathname.startsWith("/checkout") || pathname.startsWith("/cart");
  const isProductDetailPage = pathname.startsWith("/product/");
  const activeProductId = isProductDetailPage
    ? pathname.split("/product/")[1]?.split("/")[0] || null
    : null;

  const [isCompactViewport, setIsCompactViewport] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsCompactViewport(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // On mobile product detail pages, default to compact pill so Add to Cart /
  // variant controls are never obscured unless the shopper chooses to expand.
  const isEffectiveMinimized =
    minimized ||
    (isProductDetailPage &&
      isCompactViewport &&
      mobileProductExpandedPath !== pathname);

  // Fetch public storefront data once on mount (if not dismissed)
  useEffect(() => {
    if (dismissed) return undefined;

    let cancelled = false;

    const loadCatalogSignals = async () => {
      const [reviewsRes, popularRes, productsRes] = await Promise.allSettled([
        reviewsService.getAll(0, 30),
        productsService.getPopular(5),
        productsService.getAll(0, 50),
      ]);

      if (cancelled) return;

      const reviews =
        reviewsRes.status === "fulfilled"
          ? reviewsRes.value?.data?.data?.reviews || []
          : [];

      const popularPayload =
        popularRes.status === "fulfilled"
          ? popularRes.value?.data?.data || {}
          : {};

      const products =
        productsRes.status === "fulfilled"
          ? productsRes.value?.data?.data?.products || []
          : [];

      setCatalogData({
        reviews: Array.isArray(reviews) ? reviews : [],
        popularProducts: Array.isArray(popularPayload.products)
          ? popularPayload.products
          : [],
        popularWindowDays: popularPayload.windowDays ?? null,
        products: Array.isArray(products) ? products : [],
        fetchedAt: Date.now(),
        loaded: true,
      });
    };

    loadCatalogSignals();

    return () => {
      cancelled = true;
    };
  }, [dismissed]);

  // Fetch authenticated customer's own loyalty & active order status only when logged in
  useEffect(() => {
    if (dismissed || !isAuthenticated || !userId || !hasValidSessionToken()) {
      return undefined;
    }

    let cancelled = false;

    const loadCustomerSignals = async () => {
      const [loyaltyRes, ordersRes] = await Promise.allSettled([
        loyaltyService.getBalance(),
        ordersService.getAll(0, 5),
      ]);

      if (cancelled) return;

      const balanceRaw =
        loyaltyRes.status === "fulfilled"
          ? loyaltyRes.value?.data?.data?.balance
          : 0;
      const loyaltyBalance = Number(balanceRaw) > 0 ? Number(balanceRaw) : 0;

      const orders =
        ordersRes.status === "fulfilled"
          ? ordersRes.value?.data?.data?.orders || []
          : [];

      const activeOrder =
        (Array.isArray(orders) ? orders : []).find((order) =>
          ["pending", "confirmed", "shipped"].includes(
            String(order?.status || "").toLowerCase()
          )
        ) || null;

      setUserData({
        userId,
        loyaltyBalance,
        activeOrder,
      });
    };

    loadCustomerSignals();

    return () => {
      cancelled = true;
    };
  }, [dismissed, isAuthenticated, userId]);

  // Build prioritized real-data messages without ever inventing missing data
  const messages = useMemo(() => {
    if (!catalogData.loaded) return [];

    const signals = [];
    const featuredProductIds = new Set();

    // 1. Customer Reviews (real reviews from existing review system)
    const validReviews = catalogData.reviews.filter((review) => {
      if (!review || review.isDeleted) return false;
      const rating = Number(review.rating);
      if (!Number.isFinite(rating) || rating < 4) return false;
      if (typeof review.comment !== "string" || review.comment.trim().length < 3) {
        return false;
      }
      if (
        review.product &&
        (review.product.isDeleted || review.product.isActive === false)
      ) {
        return false;
      }
      return true;
    });

    // Prioritize reviews for the product currently being viewed when on a product page
    const sortedReviews = [...validReviews].sort((a, b) => {
      const aMatchesCurrent =
        activeProductId && a.productId === activeProductId ? 1 : 0;
      const bMatchesCurrent =
        activeProductId && b.productId === activeProductId ? 1 : 0;
      if (aMatchesCurrent !== bMatchesCurrent) {
        return bMatchesCurrent - aMatchesCurrent;
      }
      return Number(b.rating) - Number(a.rating);
    });

    sortedReviews.slice(0, 2).forEach((review) => {
      const product = review.product;
      const reviewer = formatReviewerName(review.user?.name);
      const ratingNum = Number(review.rating);
      const formattedRating = Number.isInteger(ratingNum)
        ? `${ratingNum}.0`
        : ratingNum.toFixed(1);

      const cleanProductName = cleanLabel(product?.name);
      signals.push({
        id: `review-${review.id}`,
        type: "review",
        rating: `${formattedRating} / 5`,
        quote: `"${truncateAtWord(review.comment, 100)}"`,
        sub: cleanProductName ? `${reviewer} · ${cleanProductName}` : reviewer,
        image: getProductImage(product),
        actionLabel: product?.id ? "View product" : null,
        actionPath: product?.id ? `/product/${product.id}` : null,
      });
    });

    // 2. Popular / Bestseller Product (real order item aggregation)
    const validPopular = catalogData.popularProducts.filter(isProductEligible);
    if (validPopular.length > 0) {
      const topProduct = validPopular[0];
      featuredProductIds.add(topProduct.id);
      signals.push({
        id: `popular-${topProduct.id}`,
        type: "popular",
        kicker: "Customer Favourite",
        icon: "sparkle",
        title: cleanLabel(topProduct.name),
        sub:
          catalogData.popularWindowDays === 7
            ? "One of the most popular pieces this week."
            : "A popular choice among Rich Apparel shoppers.",
        meta: formatPrice(topProduct.price),
        image: getProductImage(topProduct),
        actionLabel: "View product",
        actionPath: `/product/${topProduct.id}`,
      });
    }

    // 3. New Arrival (only genuinely recent products created within the last 30 days)
    const recentArrivals = catalogData.products.filter((product) => {
      if (!isProductEligible(product)) return false;
      if (!product.createdAt) return false;
      const createdMs = new Date(product.createdAt).getTime();
      if (!Number.isFinite(createdMs)) return false;
      return catalogData.fetchedAt - createdMs <= NEW_ARRIVAL_WINDOW_MS;
    });

    const newArrival =
      recentArrivals.find((p) => !featuredProductIds.has(p.id)) ||
      recentArrivals[0];

    if (newArrival) {
      featuredProductIds.add(newArrival.id);
      signals.push({
        id: `new-arrival-${newArrival.id}`,
        type: "new_arrival",
        kicker: "New Arrival",
        icon: "sparkle",
        title: cleanLabel(newArrival.name),
        sub: "Recently added to Rich Apparel.",
        meta: formatPrice(newArrival.price),
        image: getProductImage(newArrival),
        actionLabel: "Shop now",
        actionPath: `/product/${newArrival.id}`,
      });
    }

    // 4. Safe Shipping Message (based strictly on existing checkout delivery rules)
    const hasInStockCatalog = catalogData.products.some(isProductEligible);
    if (hasInStockCatalog) {
      const targetCategory =
        pathname.toLowerCase() === "/category/women"
          ? "/category/men"
          : "/category/women";
      signals.push({
        id: "shipping-options",
        type: "shipping",
        kicker: "Delivery Options",
        icon: "truck",
        title: "Free Self-Pickup Available",
        sub: "Select free self-pickup at checkout, or islandwide delivery in 3–5 working days.",
        actionLabel: "Browse collection",
        actionPath: targetCategory,
      });
    }

    // 5. Authenticated Customer's Own Loyalty & Order Signals (never shown to guests)
    const hasScopedUserData =
      isAuthenticated && userId && userData.userId === userId;

    if (hasScopedUserData && userData.loyaltyBalance > 0) {
      const pts = userData.loyaltyBalance;
      const hasCartItems = cartItemCount > 0;
      signals.push({
        id: "customer-loyalty",
        type: "loyalty",
        kicker: "Your Loyalty",
        icon: "award",
        title: `You have ${pts.toLocaleString()} point${pts === 1 ? "" : "s"}`,
        sub: "Redeem your loyalty points at checkout.",
        actionLabel: hasCartItems ? "Redeem at checkout" : "View account",
        actionPath: hasCartItems ? "/checkout" : "/profile",
      });
    }

    if (hasScopedUserData && userData.activeOrder) {
      const order = userData.activeOrder;
      signals.push({
        id: `order-${order.id}`,
        type: "order",
        kicker: "Your Order",
        icon: "clock",
        title: `Order #${order.id.slice(-6).toUpperCase()}`,
        sub: `Current status: ${formatStatus(order.status)}.`,
        actionLabel: "Track order",
        actionPath: `/orders/${order.id}/track`,
      });
    }

    // 6. Other Valid Product Discovery (Low Stock / Curated In-Stock Piece)
    const lowStockProduct = catalogData.products.find(
      (p) =>
        isProductEligible(p) &&
        Number(p.stock) <= LOW_STOCK_THRESHOLD &&
        !featuredProductIds.has(p.id)
    );

    if (lowStockProduct) {
      featuredProductIds.add(lowStockProduct.id);
      signals.push({
        id: `limited-${lowStockProduct.id}`,
        type: "limited_stock",
        kicker: "Limited Stock",
        icon: "package",
        title: cleanLabel(lowStockProduct.name),
        sub: `Only ${lowStockProduct.stock} left in stock.`,
        meta: formatPrice(lowStockProduct.price),
        image: getProductImage(lowStockProduct),
        actionLabel: "View product",
        actionPath: `/product/${lowStockProduct.id}`,
      });
    } else if (signals.length <= 2) {
      const discoveryProduct = catalogData.products.find(
        (p) => isProductEligible(p) && !featuredProductIds.has(p.id)
      );
      if (discoveryProduct) {
        featuredProductIds.add(discoveryProduct.id);
        signals.push({
          id: `discover-${discoveryProduct.id}`,
          type: "discovery",
          kicker: cleanLabel(discoveryProduct.category?.name, "Collection"),
          icon: "sparkle",
          title: cleanLabel(discoveryProduct.name),
          sub: "Available now in our collection.",
          meta: formatPrice(discoveryProduct.price),
          image: getProductImage(discoveryProduct),
          actionLabel: "View product",
          actionPath: `/product/${discoveryProduct.id}`,
        });
      }
    }

    return signals;
  }, [
    catalogData,
    userData,
    isAuthenticated,
    userId,
    cartItemCount,
    activeProductId,
    pathname,
  ]);

  // Rotate calmly every 7 seconds when expanded, visible, and not hovered/focused
  useEffect(() => {
    if (
      dismissed ||
      isEffectiveMinimized ||
      isPaused ||
      isCartOpen ||
      isCheckoutOrCartPage ||
      messages.length <= 1
    ) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      if (document.hidden) return;
      setActiveIndex((prev) => (prev + 1) % messages.length);
    }, ROTATION_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [
    dismissed,
    isEffectiveMinimized,
    isPaused,
    isCartOpen,
    isCheckoutOrCartPage,
    messages.length,
  ]);

  const handleMinimize = useCallback(() => {
    if (isProductDetailPage && isCompactViewport) {
      setMobileProductExpandedPath(null);
    } else {
      setActiveFloatingWidget(null);
      writeStorageFlag(MINIMIZED_STORAGE_KEY, true);
    }
  }, [isProductDetailPage, isCompactViewport, setActiveFloatingWidget]);

  const handleExpand = useCallback(() => {
    setActiveFloatingWidget("pulse");
    writeStorageFlag(MINIMIZED_STORAGE_KEY, false);
    if (isProductDetailPage && isCompactViewport) {
      setMobileProductExpandedPath(pathname);
    }
  }, [isProductDetailPage, isCompactViewport, pathname, setActiveFloatingWidget]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  const handleActionClick = useCallback(
    (path) => {
      if (!path) return;
      navigate(path);
    },
    [navigate]
  );

  const handleBlur = useCallback((e) => {
    if (
      containerRef.current &&
      !containerRef.current.contains(e.relatedTarget)
    ) {
      setIsPaused(false);
    }
  }, []);

  // Hide completely when dismissed, cart drawer is open, on cart/checkout, or no real data exists
  if (
    dismissed ||
    isCartOpen ||
    isCheckoutOrCartPage ||
    messages.length === 0
  ) {
    return null;
  }

  const safeIndex = activeIndex % messages.length;
  const currentMessage = messages[safeIndex];
  const showAction =
    Boolean(currentMessage.actionLabel && currentMessage.actionPath) &&
    currentMessage.actionPath !== pathname;

  const renderKickerIcon = (iconType) => {
    switch (iconType) {
      case "truck":
        return <Truck size={13} className="customer-pulse-sparkle" aria-hidden="true" />;
      case "award":
        return <Award size={13} className="customer-pulse-sparkle" aria-hidden="true" />;
      case "package":
        return <Package size={13} className="customer-pulse-sparkle" aria-hidden="true" />;
      case "clock":
        return <Clock size={13} className="customer-pulse-sparkle" aria-hidden="true" />;
      default:
        return <Sparkles size={13} className="customer-pulse-sparkle" aria-hidden="true" />;
    }
  };

  return (
    <aside
      ref={containerRef}
      className="customer-pulse-container"
      aria-label="Rich Apparel Customer Pulse"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={handleBlur}
    >
      {isEffectiveMinimized ? (
        <button
          type="button"
          onClick={handleExpand}
          className="customer-pulse-pill"
          aria-label="Open Customer Pulse"
        >
          <Sparkles size={13} className="customer-pulse-sparkle" aria-hidden="true" />
          <span>Rich Pulse</span>
        </button>
      ) : (
        <div
          className="customer-pulse-card"
          role="region"
          aria-label="Rich Apparel highlights"
        >
          {/* Header */}
          <div className="customer-pulse-header">
            <span className="customer-pulse-brand">
              <Sparkles size={13} className="customer-pulse-sparkle" aria-hidden="true" />
              <span>Rich Apparel</span>
            </span>

            <div className="customer-pulse-controls">
              <button
                type="button"
                onClick={handleMinimize}
                className="customer-pulse-icon-btn"
                aria-label="Minimize Customer Pulse"
                title="Minimize"
              >
                <Minus size={15} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="customer-pulse-icon-btn"
                aria-label="Close Customer Pulse"
                title="Close"
              >
                <X size={15} aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Active Signal */}
          <div className="customer-pulse-body">
            <div key={currentMessage.id} className="customer-pulse-slide">
              <div className="customer-pulse-content-row">
                {currentMessage.image && (
                  <div className="customer-pulse-thumb-wrap">
                    <img
                      src={currentMessage.image}
                      alt={currentMessage.title || "Rich Apparel product"}
                      className="customer-pulse-thumb"
                      loading="lazy"
                    />
                  </div>
                )}

                <div className="customer-pulse-text-col">
                  {currentMessage.type === "review" ? (
                    <>
                      <div className="customer-pulse-rating">
                        <Star size={14} className="customer-pulse-star" aria-hidden="true" />
                        <span>{currentMessage.rating}</span>
                      </div>
                      <p className="customer-pulse-quote">{currentMessage.quote}</p>
                      <p className="customer-pulse-sub">— {currentMessage.sub}</p>
                    </>
                  ) : (
                    <>
                      <div className="customer-pulse-kicker">
                        {renderKickerIcon(currentMessage.icon)}
                        <span>{currentMessage.kicker}</span>
                      </div>
                      <p className="customer-pulse-title">{currentMessage.title}</p>
                      <p className="customer-pulse-sub">{currentMessage.sub}</p>
                      {currentMessage.meta && (
                        <p className="customer-pulse-meta">{currentMessage.meta}</p>
                      )}
                    </>
                  )}
                </div>
              </div>

              {(messages.length > 1 || showAction) && (
                <div className="customer-pulse-footer">
                  {messages.length > 1 && (
                    <div
                      className="customer-pulse-dots"
                      role="tablist"
                      aria-label="Highlight slides"
                    >
                      {messages.map((msg, idx) => (
                        <button
                          key={msg.id}
                          type="button"
                          role="tab"
                          aria-selected={idx === safeIndex}
                          aria-label={`Show highlight ${idx + 1} of ${messages.length}`}
                          onClick={() => setActiveIndex(idx)}
                          className={`customer-pulse-dot ${
                            idx === safeIndex ? "customer-pulse-dot--active" : ""
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {showAction && (
                    <button
                      type="button"
                      onClick={() => handleActionClick(currentMessage.actionPath)}
                      className="customer-pulse-action"
                    >
                      <span>{currentMessage.actionLabel}</span>
                      <ArrowRight
                        size={13}
                        className="customer-pulse-arrow"
                        aria-hidden="true"
                      />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
