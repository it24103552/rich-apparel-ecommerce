import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../../api/axios";
import {
  ChevronRight,
  Minus,
  Plus,
  ShoppingBag,
  Heart,
  Share2,
  Ruler,
  Truck,
  ShieldCheck,
  RefreshCcw,
  ArrowLeft,
  Star
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../../hooks/useCart";
import toast from "react-hot-toast";
import { getDisplayColor } from "../../utils/colorUtils";
import { ProductDetailSkeleton } from "../../components/loading/ClientSkeletons";
import { ProductCard } from "../../components/common/ProductCard";

// Utils
const formatPrice = (price) => {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 2,
  }).format(price);
};

const getImageUrl = (imagePath) => {
  if (!imagePath) return "/placeholder.png";
  if (imagePath.startsWith("http")) return imagePath;
  const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
  return `http://localhost:5001${cleanPath}`;
};

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { items, addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeVariant, setActiveVariant] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [sliderIndex, setSliderIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/products/${id}`);
        if (res.data.success) {
          setProduct(res.data.data);
          // Auto-select first variant attributes if available
          const variants = res.data.data.variants || [];
          if (variants.length > 0) {
            const firstAttr = variants[0].attributes || {};
            const initialOpts = {};
            Object.keys(firstAttr).forEach(k => {
              const lower = k.toLowerCase();
              const isColor = lower === 'color' || lower === 'colour';
              const finalKey = isColor ? 'colour' : lower;
              const val = firstAttr[k];
              initialOpts[finalKey] = Array.isArray(val) ? val[0] : val;
            });
            setSelectedOptions(initialOpts);
          }
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        toast.error("Failed to load product details.");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
    window.scrollTo(0, 0);
  }, [id]);

  // Fetch related products
  useEffect(() => {
    if (!product?.categoryId) return;

    const fetchRelated = async () => {
      try {
        const res = await api.get('/products', {
          params: { categoryId: product.categoryId, take: 10 }
        });

        // Handle various response shapes (standardizing from HomePage.jsx logic)
        const responseData = res.data?.data?.products || res.data?.products || res.data?.data || res.data || [];
        const items = Array.isArray(responseData) ? responseData : [];

        // Filter out current product
        setRelatedProducts(items.filter(p => p.id !== product.id));
      } catch (err) {
        console.error("Error fetching related products:", err);
      }
    };

    fetchRelated();
  }, [product?.categoryId, product?.id]);

  // Auto-play timer for slider
  useEffect(() => {
    if (!isAutoPlaying || relatedProducts.length <= 4) return;

    const interval = setInterval(() => {
      setSliderIndex(prev => (prev + 1) % Math.ceil(relatedProducts.length / 1)); // We'll adjust this based on visible items
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, relatedProducts.length]);


  // Dynamically compute all unique variant attributes available
  const availableAttributes = useMemo(() => {
    if (!product?.variants) return {};
    const attrMap = {};

    product.variants.forEach(variant => {
      if (variant.attributes) {
        Object.entries(variant.attributes).forEach(([key, value]) => {
          if (!value) return;
          const lowerKey = key.toLowerCase();
          const finalKey = (lowerKey === 'color' || lowerKey === 'colour') ? 'colour' : lowerKey;

          if (!attrMap[finalKey]) {
            attrMap[finalKey] = new Set();
          }

          const values = Array.isArray(value) ? value : [value];
          values.forEach(v => {
            attrMap[finalKey].add(v.toString().trim());
          });
        });
      }
    });

    const formatted = {};
    Object.keys(attrMap).forEach(k => {
      formatted[k] = Array.from(attrMap[k]);
    });
    return formatted;
  }, [product]);

  // Update active variant when selections change
  useEffect(() => {
    if (!product?.variants) return;

    const variant = product.variants.find(v => {
      if (!v.attributes) return false;
      let matches = true;
      Object.keys(availableAttributes).forEach(key => {
        const vKey = Object.keys(v.attributes).find(k => {
          const lk = k.toLowerCase();
          const fk = (lk === 'color' || lk === 'colour') ? 'colour' : lk;
          return fk === key;
        });

        const selVal = selectedOptions[key];
        if (!selVal) { matches = false; return; }

        if (vKey) {
          const vVal = v.attributes[vKey];
          const vArr = Array.isArray(vVal) ? vVal.map(x => x.toString().toLowerCase()) : [vVal?.toString().toLowerCase()];

          let compareVal = selVal.toString().toLowerCase();
          if (key === 'colour') compareVal = getDisplayColor(selVal).toLowerCase();

          let foundMatch = false;
          for (let vx of vArr) {
            if (key === 'colour') {
              if (getDisplayColor(vx).toLowerCase() === compareVal || vx === selVal.toString().toLowerCase()) foundMatch = true;
            } else {
              if (vx === compareVal) foundMatch = true;
            }
          }
          if (!foundMatch) matches = false;
        } else {
          matches = false;
        }
      });
      return matches;
    });

    setActiveVariant(variant || null);

    const maxStock = variant ? variant.stock : (product.stock || 0);
    if (quantity > maxStock) {
      setQuantity(Math.max(1, maxStock));
    }
  }, [selectedOptions, product, quantity, availableAttributes]);


  const handleAddToCart = () => {
    if (!product) return;

    if (!activeVariant) {
      toast.error("Please select a valid combination of options.");
      return;
    }

    const variantAttributes = {
      id: activeVariant.id,
      ...selectedOptions
    };

    const existingItem = items.find(item =>
      item.productId === product.id &&
      item.variantAttributes?.id === activeVariant.id
    );

    const currentQtyInCart = existingItem?.quantity || 0;
    const maxStock = activeVariant ? activeVariant.stock : (product.stock || 0);

    if (maxStock <= 0) {
      toast.error("This combination is out of stock");
      return;
    }

    if (currentQtyInCart + quantity > maxStock) {
      toast.error(`Cannot add more. You already have ${currentQtyInCart} in cart and only ${maxStock} are available.`, { icon: '📦' });
      return;
    }

    addToCart(product.id, quantity, variantAttributes);
    toast.success(`${product.name} added to cart!`);
  };
  
  const handleQuickCheckout = async () => {
    if (!product) return;

    if (!activeVariant) {
      toast.error("Please select a valid combination of options.");
      return;
    }

    const variantAttributes = {
      id: activeVariant.id,
      ...selectedOptions
    };

    const existingItem = items.find(item =>
      item.productId === product.id &&
      item.variantAttributes?.id === activeVariant.id
    );

    const currentQtyInCart = existingItem?.quantity || 0;
    const maxStock = activeVariant ? activeVariant.stock : (product.stock || 0);

    if (maxStock <= 0) {
      toast.error("This combination is out of stock");
      return;
    }

    if (currentQtyInCart + quantity > maxStock) {
      toast.error(`Stock limit reached. You already have ${currentQtyInCart} in cart.`, { icon: '📦' });
      return;
    }

    try {
      await addToCart(product.id, quantity, variantAttributes);
      navigate("/checkout");
    } catch (err) {
      console.error("Quick checkout failed:", err);
    }
  };

  const isOptionDisabled = (attrKey, attrValue) => {
    if (!product?.variants) return false;
    // Check if there is ANY variant that has this attribute value AND matching all OTHER selected options
    const variant = product.variants.find(v => {
      if (!v.attributes) return false;
      let matchesAllOthers = true;
      let matchesThis = false;

      Object.keys(availableAttributes).forEach(key => {
        const vKey = Object.keys(v.attributes).find(k => {
          const lk = k.toLowerCase();
          return (lk === 'color' || lk === 'colour' ? 'colour' : lk) === key;
        });

        let checkVal = key === attrKey ? attrValue : selectedOptions[key];
        if (!checkVal && key !== attrKey) return; // ignore unselected other keys for availability

        if (vKey && checkVal) {
          const vVal = v.attributes[vKey];
          const vArr = Array.isArray(vVal) ? vVal.map(x => x.toString().toLowerCase()) : [vVal?.toString().toLowerCase()];

          let compareVal = checkVal.toString().toLowerCase();
          if (key === 'colour') compareVal = getDisplayColor(checkVal).toLowerCase();

          let foundMatch = false;
          for (let vx of vArr) {
            if (key === 'colour') {
              if (getDisplayColor(vx).toLowerCase() === compareVal || vx === checkVal.toString().toLowerCase()) foundMatch = true;
            } else {
              if (vx === compareVal) foundMatch = true;
            }
          }
          if (key === attrKey) {
            if (foundMatch) matchesThis = true;
          } else {
            if (!foundMatch) matchesAllOthers = false;
          }
        } else if (key === attrKey) {
          matchesThis = false;
        }
      });
      return matchesThis && matchesAllOthers && v.stock > 0;
    });

    return !variant;
  };

  if (loading) {
    return <ProductDetailSkeleton />;
  }

  if (!product) {
    return (
      <div
        className="min-h-[70vh] flex flex-col items-center justify-center bg-[#faf8f5] p-6 text-center"
        style={{ fontFamily: "'Montserrat', sans-serif" }}
      >
        <div className="bg-white border border-[#e9e1d6] rounded-[22px] shadow-[0_6px_24px_rgba(32,25,18,0.045)] p-10 max-w-md w-full">
          <div className="w-14 h-14 rounded-2xl bg-[#f6f1ea] border border-[#eae1d5] flex items-center justify-center mx-auto mb-5">
            <ShoppingBag size={24} strokeWidth={1.7} className="text-[#9a7b56]" />
          </div>
          <h2 className="text-2xl font-extrabold uppercase tracking-[-0.02em] text-[#151413] mb-3">
            Product Not Found
          </h2>
          <p className="text-[13.5px] text-[#6c6257] font-medium mb-7 leading-relaxed">
            Sorry, we couldn&apos;t find the product you&apos;re looking for. It might have been removed or the URL is incorrect.
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-8 py-3.5 bg-[#161514] hover:bg-[#2c2926] text-white rounded-full text-[12px] font-bold uppercase tracking-[0.14em] shadow-[0_8px_22px_rgba(22,21,20,0.16)] transition-all"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  // availableAttributes is already computed via useMemo

  const visibleReviews = product?.reviews?.filter(r => !r.isDeleted) || [];
  const averageRating = visibleReviews.length > 0
    ? visibleReviews.reduce((sum, rev) => sum + rev.rating, 0) / visibleReviews.length
    : 0;
  const currentStock = activeVariant ? activeVariant.stock : product.stock;

  return (
    <div
      className="bg-white min-h-screen pt-6 md:pt-10 pb-20 overflow-x-clip selection:bg-[#161514] selection:text-white"
      style={{ fontFamily: "'Montserrat', sans-serif" }}
    >
      <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">

        {/* Breadcrumbs */}
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-2 mb-7 md:mb-9 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8d8276]"
        >
          <Link to="/" className="hover:text-[#151413] transition-colors shrink-0">
            Home
          </Link>
          <ChevronRight size={11} className="text-[#b5a99b] shrink-0" />
          {product.category?.name && (
            <>
              <Link to="/category/all" className="hover:text-[#151413] transition-colors shrink-0">
                {product.category.name}
              </Link>
              <ChevronRight size={11} className="text-[#b5a99b] shrink-0" />
            </>
          )}
          <span className="text-[#151413] font-bold truncate max-w-[220px] sm:max-w-[420px]">
            {product.name}
          </span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-10 lg:gap-12 xl:gap-16 items-start">

          {/* Left: Image Gallery */}
          <div className="w-full lg:w-[54%] xl:w-[53%]">
            <div className="flex flex-col md:flex-row gap-3.5 md:gap-4">
              {/* Thumbnails (Desktop: Vertical) */}
              {product.images?.length > 1 && (
                <div className="order-2 md:order-1 flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto no-scrollbar md:max-h-[680px] p-0.5 scroll-smooth">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImage(idx)}
                      aria-label={`View image ${idx + 1}`}
                      className={`relative w-16 sm:w-20 aspect-[4/5] shrink-0 rounded-xl overflow-hidden bg-[#f1ebe3] transition-all duration-250 cursor-pointer ${
                        selectedImage === idx
                          ? 'border-2 border-[#161514] ring-2 ring-[#c9a77a]/30 shadow-xs opacity-100'
                          : 'border border-[#e6ddd0] opacity-70 hover:opacity-100 hover:border-[#bfa88a]'
                      }`}
                    >
                      <img
                        src={getImageUrl(img)}
                        className="w-full h-full object-cover object-[center_12%]"
                        alt={`Thumb ${idx + 1}`}
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Main Image */}
              <div className="order-1 md:order-2 flex-1 relative aspect-[4/5] max-h-[680px] bg-[#f1ebe3] rounded-[20px] overflow-hidden group shadow-[0_10px_30px_rgba(32,25,18,0.06)] border border-[#ebe4da]">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={selectedImage}
                    src={getImageUrl(product.images?.[selectedImage])}
                    initial={{ opacity: 0, scale: 1.02 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.99 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full h-full object-cover object-[center_12%]"
                    alt={product.name}
                  />
                </AnimatePresence>

                {/* Status Badge */}
                <div className="absolute top-4 left-4 bg-[#161514] text-white text-[10px] font-bold uppercase tracking-[0.14em] px-3 py-1.5 rounded-md shadow-xs">
                  New Arrival
                </div>

                {/* Floating Actions */}
                <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-100 md:opacity-90 md:group-hover:opacity-100 transition-all duration-200">
                  <button
                    type="button"
                    onClick={() => setIsWishlisted(!isWishlisted)}
                    aria-label="Toggle wishlist"
                    aria-pressed={isWishlisted}
                    className={`w-10 h-10 rounded-full shadow-sm backdrop-blur-sm border flex items-center justify-center transition-all cursor-pointer ${
                      isWishlisted
                        ? 'bg-[#161514] text-white border-[#161514]'
                        : 'bg-white/92 text-[#2a2520] border-[#e8e0d5] hover:bg-[#161514] hover:text-white hover:border-[#161514]'
                    }`}
                  >
                    <Heart size={16} strokeWidth={1.85} fill={isWishlisted ? "currentColor" : "none"} />
                  </button>
                  <button
                    type="button"
                    aria-label="Share product"
                    className="w-10 h-10 rounded-full bg-white/92 backdrop-blur-sm text-[#2a2520] border border-[#e8e0d5] shadow-sm flex items-center justify-center hover:bg-[#161514] hover:text-white hover:border-[#161514] transition-all cursor-pointer"
                  >
                    <Share2 size={16} strokeWidth={1.85} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Product Details */}
          <div className="w-full lg:w-[46%] xl:w-[47%]">
            <div className="lg:sticky lg:top-[124px]">

              {/* Product Header */}
              <div className="pb-6 mb-6 border-b border-[#f0e9df]">
                <div className="flex flex-wrap items-center gap-2.5 mb-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-bold uppercase tracking-[0.12em] border ${
                      currentStock > 0
                        ? 'bg-[#edf7f1] border-[#bee2cc] text-[#1c6642]'
                        : 'bg-[#fdf0f0] border-[#f0c7c7] text-[#9e2a2b]'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        currentStock > 0 ? 'bg-[#258a58]' : 'bg-[#c93838]'
                      }`}
                    />
                    {currentStock > 0 ? 'In Stock' : 'Out of Stock'}
                  </span>
                  {activeVariant && (
                    <span className="text-[11px] font-semibold text-[#6c6257] uppercase tracking-[0.1em]">
                      {activeVariant.stock} units available
                    </span>
                  )}
                  <span className="text-[11px] font-semibold text-[#8d8276] uppercase tracking-[0.14em] sm:ml-auto font-mono">
                    REF: {product.id.slice(-8).toUpperCase()}
                  </span>
                </div>

                <h1 className="text-[26px] sm:text-[32px] lg:text-[36px] font-extrabold text-[#151413] uppercase tracking-[-0.025em] leading-[1.1] break-words mb-4">
                  {product.name}
                </h1>

                {visibleReviews.length > 0 && (
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={15}
                          className={
                            star <= Math.round(averageRating)
                              ? "fill-[#e4a63a] text-[#e4a63a]"
                              : "text-[#d5cabd]"
                          }
                        />
                      ))}
                    </div>
                    <span className="text-[12.5px] font-bold text-[#151413]">
                      {averageRating.toFixed(1)}{" "}
                      <span className="text-[#7a7064] font-medium">
                        ({visibleReviews.length} {visibleReviews.length === 1 ? "Review" : "Reviews"})
                      </span>
                    </span>
                  </div>
                )}

                <div className="flex items-baseline gap-3.5 mt-2">
                  <span className="text-[26px] sm:text-[30px] font-extrabold text-[#141312] tracking-[-0.02em]">
                    {formatPrice(product.price)}
                  </span>
                  {product.oldPrice && (
                    <span className="text-[18px] text-[#9a8e80] line-through font-semibold">
                      {formatPrice(product.oldPrice)}
                    </span>
                  )}
                </div>
              </div>

              {/* Product Attributes */}
              <div className="space-y-6 mb-7">
                {Object.entries(availableAttributes).filter(([_, opts]) => opts.length === 1).length > 0 && (
                  <div className="flex flex-wrap gap-2.5 border-b border-[#f0e9df] pb-5">
                    {Object.entries(availableAttributes)
                      .filter(([_, opts]) => opts.length === 1)
                      .map(([attrKey, attrOptions]) => (
                        <div
                          key={attrKey}
                          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#faf7f2] border border-[#ebe3d8]"
                        >
                          <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#8d8276]">
                            {attrKey}:
                          </span>
                          {attrKey === 'colour' && (
                            <span
                              className="w-3 h-3 rounded-full border border-[#d6ccbf] shrink-0"
                              style={{ backgroundColor: getDisplayColor(attrOptions[0]) }}
                            />
                          )}
                          <span className="text-[11.5px] font-bold uppercase tracking-[0.06em] text-[#151413]">
                            {attrOptions[0]}
                          </span>
                        </div>
                      ))}
                  </div>
                )}

                {/* Dynamic Attributes Mapping (Only for items with > 1 option) */}
                {Object.entries(availableAttributes).map(([attrKey, attrOptions]) => {
                  if (attrOptions.length <= 1) return null;

                  if (attrKey === 'colour') {
                    return (
                      <div key={attrKey}>
                        <span className="text-[11.5px] font-bold uppercase tracking-[0.16em] text-[#151413] mb-3 block">
                          Colour:{" "}
                          <span className="text-[#6c6257] font-semibold capitalize ml-1">
                            {selectedOptions[attrKey]}
                          </span>
                        </span>
                        <div className="flex flex-wrap items-center gap-3">
                          {attrOptions.map((color, idx) => (
                            <button
                              key={idx}
                              type="button"
                              title={color}
                              aria-label={`Select colour ${color}`}
                              onClick={() => setSelectedOptions({ ...selectedOptions, [attrKey]: color })}
                              className={`w-9 h-9 rounded-full p-0.5 transition-all duration-200 cursor-pointer flex items-center justify-center ${
                                selectedOptions[attrKey] === color
                                  ? 'ring-2 ring-[#161514] ring-offset-2 border border-[#161514]/20'
                                  : 'border border-[#dcd2c5] hover:border-[#9a7b56]'
                              }`}
                            >
                              <div
                                className="w-full h-full rounded-full border border-[#d6ccbf]"
                                style={{ backgroundColor: getDisplayColor(color) }}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  // Generics (Size, etc)
                  return (
                    <div key={attrKey}>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[11.5px] font-bold uppercase tracking-[0.16em] text-[#151413]">
                          {attrKey}:{" "}
                          <span className="text-[#6c6257] font-semibold ml-1">
                            {selectedOptions[attrKey]}
                          </span>
                        </span>
                        {attrKey === 'size' && (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#6c6257] hover:text-[#151413] border-b border-[#d6ccbf] hover:border-[#151413] transition-all pb-0.5 cursor-pointer"
                          >
                            <Ruler size={12.5} /> Size Guide
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                        {attrOptions.map((opt, idx) => {
                          const disabled = isOptionDisabled(attrKey, opt);
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => !disabled && setSelectedOptions({ ...selectedOptions, [attrKey]: opt })}
                              className={`relative h-11 flex items-center justify-center rounded-xl text-[12px] font-bold uppercase tracking-[0.1em] border transition-all duration-200 ${
                                selectedOptions[attrKey] === opt
                                  ? 'bg-[#161514] text-white border-[#161514] shadow-[0_6px_16px_rgba(22,21,20,0.16)] cursor-pointer'
                                  : disabled
                                    ? 'bg-[#f6f1ea] text-[#bfb5a8] border-[#ebe3d8] cursor-not-allowed'
                                    : 'bg-white text-[#1a1816] border-[#dcd2c5] hover:border-[#161514] hover:bg-[#faf7f2] cursor-pointer'
                              }`}
                            >
                              {opt}
                              {disabled && (
                                <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
                                  <div className="w-[130%] h-[1px] bg-[#cfc4b6] rotate-[32deg] transform-origin-center" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quantity & Add to Cart */}
              <div className="flex flex-col gap-3 mb-7">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex items-center justify-between bg-[#f6f1ea] rounded-full border border-[#e6ddd0] px-2 h-[52px] sm:w-[144px]">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      aria-label="Decrease quantity"
                      className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white hover:shadow-xs transition-all text-[#5c544b] hover:text-[#151413] cursor-pointer"
                    >
                      <Minus size={14} strokeWidth={2.2} />
                    </button>
                    <span className="flex-1 text-center text-[13.5px] font-bold text-[#151413]">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() => {
                        const maxStock = activeVariant ? activeVariant.stock : product.stock;
                        if (quantity < maxStock) {
                          setQuantity(quantity + 1);
                        } else {
                          toast.error(`Only ${maxStock} items in stock`, { icon: '📦' });
                        }
                      }}
                      className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white hover:shadow-xs transition-all text-[#5c544b] hover:text-[#151413] cursor-pointer"
                    >
                      <Plus size={14} strokeWidth={2.2} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={currentStock === 0}
                    className="h-[52px] flex-1 bg-[#161514] hover:bg-[#2c2926] text-white rounded-full flex items-center justify-center gap-2.5 px-8 text-[12px] font-bold uppercase tracking-[0.14em] shadow-[0_10px_26px_rgba(22,21,20,0.18)] hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-35 disabled:hover:translate-y-0 active:scale-[0.99] cursor-pointer"
                  >
                    <ShoppingBag size={16} strokeWidth={1.9} />
                    <span>Add to Cart</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleQuickCheckout}
                  disabled={currentStock === 0}
                  className="h-[50px] w-full bg-white text-[#151413] border border-[#d8cec0] rounded-full text-[12px] font-bold uppercase tracking-[0.14em] hover:border-[#161514] hover:bg-[#faf7f2] transition-all duration-200 active:scale-[0.99] cursor-pointer disabled:opacity-35"
                >
                  Quick Checkout
                </button>
              </div>

              {/* Benefits Icons (matching HomePage benefit cards) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-6 border-t border-[#f0e9df]">
                <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#faf7f2] border border-[#ece4d9]">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#9a7b56] border border-[#e7ddd0] shrink-0">
                    <Truck size={18} strokeWidth={1.75} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-[#151413]">
                      Free Delivery
                    </span>
                    <span className="text-[11.5px] text-[#6c6257] font-medium">
                      On orders over LKR 10,000
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#faf7f2] border border-[#ece4d9]">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#9a7b56] border border-[#e7ddd0] shrink-0">
                    <ShieldCheck size={18} strokeWidth={1.75} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-[#151413]">
                      Authentic Gear
                    </span>
                    <span className="text-[11.5px] text-[#6c6257] font-medium">
                      100% Genuine product
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Info Section (Full Width) */}
        <div className="mt-16 md:mt-20 pt-12 md:pt-14 border-t border-[#f0e9df]">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-14">

            {/* Left Column: Description */}
            <div className="lg:col-span-7">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-1 h-6 bg-[#9a7b56] rounded-full" />
                <h2 className="text-[13px] font-extrabold uppercase tracking-[0.2em] text-[#151413]">
                  Product Narrative
                </h2>
              </div>
              <div className="space-y-4">
                <p className="text-[15px] text-[#2c2722] font-medium leading-[1.8]">
                  {product.description || "Meticulously crafted from high-precision materials, this item embodies the core values of Rich Apparel: quality, durability, and timeless style."}
                </p>
                <p className="text-[14px] text-[#6c6257] leading-[1.8]">
                  Designed to withstand the rigors of active use while maintaining a sophisticated aesthetic that seamlessly transitions from technical performance to lifestyle contexts. Every detail reflects our commitment to premium craftsmanship.
                </p>
              </div>
            </div>

            {/* Right Column: Material & Shipping */}
            <div className="lg:col-span-5 bg-[#faf7f2] rounded-[20px] border border-[#ebe3d8] p-6 sm:p-8 flex flex-col gap-7">
              <div>
                <h3 className="text-[12px] font-extrabold uppercase tracking-[0.2em] text-[#151413] mb-4">
                  Material &amp; Care
                </h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-y-2.5 gap-x-6">
                  {['100% Premium Cotton', 'Machine wash cold', 'Dry flat', 'Do not bleach', 'Warm iron if needed'].map((item, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-[13px] text-[#4e453c] font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#9a7b56] shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 border-t border-[#e8dfd3]">
                <h3 className="text-[12px] font-extrabold uppercase tracking-[0.2em] text-[#151413] mb-4">
                  Logistics
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <span className="block text-[10.5px] font-bold uppercase tracking-[0.15em] text-[#8d8276] mb-1">
                      Delivery
                    </span>
                    <span className="text-[13px] font-semibold text-[#151413]">
                      3–5 Working Days
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10.5px] font-bold uppercase tracking-[0.15em] text-[#8d8276] mb-1">
                      Policy
                    </span>
                    <span className="text-[13px] font-semibold text-[#151413]">
                      7-Day Free Returns
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Customer Reviews Section (Read-only from already loaded product.reviews) */}
        {visibleReviews.length > 0 && (
          <div className="mt-14 md:mt-16 pt-12 border-t border-[#f0e9df]">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
              <div className="flex items-start gap-3.5">
                <div className="w-1 h-8 bg-[#9a7b56] rounded-full mt-0.5 shrink-0" />
                <div>
                  <h2 className="text-[22px] sm:text-[26px] font-extrabold text-[#151413] uppercase tracking-[-0.02em] leading-none">
                    Customer Reviews
                  </h2>
                  <p className="text-[13px] font-medium text-[#6c6257] mt-1.5">
                    Rated {averageRating.toFixed(1)} out of 5 based on {visibleReviews.length}{" "}
                    {visibleReviews.length === 1 ? "review" : "reviews"}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {visibleReviews.slice(0, 6).map((rev) => (
                <div
                  key={rev.id}
                  className="bg-[#faf7f2] border border-[#ebe3d8] rounded-2xl p-5 flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <span className="text-[13px] font-bold text-[#151413] truncate">
                        {rev.user?.name?.trim() || "Verified Customer"}
                      </span>
                      <div className="flex items-center gap-0.5 shrink-0">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={13}
                            className={
                              star <= Math.round(rev.rating || 0)
                                ? "fill-[#e4a63a] text-[#e4a63a]"
                                : "text-[#d5cabd]"
                            }
                          />
                        ))}
                      </div>
                    </div>
                    {rev.comment && (
                      <p className="text-[13.5px] font-medium text-[#3b352f] leading-relaxed">
                        &ldquo;{rev.comment}&rdquo;
                      </p>
                    )}
                  </div>
                  {rev.imageUrl && (
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-[#e3d9cc] bg-[#f1ebe3]">
                      <img
                        src={getImageUrl(rev.imageUrl)}
                        alt="Customer review"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- Related Products Section (Reusing Shared ProductCard) --- */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 md:mt-20 pt-12 md:pt-14 border-t border-[#f0e9df] overflow-hidden pb-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-5">
              <div className="flex items-start gap-3.5">
                <div className="w-1 h-9 bg-[#9a7b56] rounded-full mt-1 shrink-0" />
                <div>
                  <h2 className="text-[24px] sm:text-[30px] lg:text-[34px] font-extrabold text-[#151413] uppercase tracking-[-0.025em] leading-none mb-1.5">
                    Related Collection
                  </h2>
                  <p className="text-[13.5px] font-medium text-[#6c6257]">
                    You may also like these curated pieces.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Custom Progress Bar */}
                <div className="hidden md:block w-28 h-[2px] bg-[#ece4d9] rounded-full relative overflow-hidden">
                  <motion.div
                    className="absolute inset-0 bg-[#161514] origin-left"
                    animate={{ scaleX: (sliderIndex + 1) / Math.ceil(relatedProducts.length / 1) }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                  />
                </div>

                {/* Navigation Arrows */}
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    aria-label="Previous related products"
                    onClick={() => {
                      setSliderIndex(prev => (prev - 1 + relatedProducts.length) % relatedProducts.length);
                      setIsAutoPlaying(false);
                    }}
                    className="w-11 h-11 rounded-full border border-[#dcd2c5] bg-white flex items-center justify-center text-[#161514] hover:border-[#161514] hover:bg-[#161514] hover:text-white transition-all active:scale-95 cursor-pointer"
                  >
                    <ArrowLeft size={17} />
                  </button>
                  <button
                    type="button"
                    aria-label="Next related products"
                    onClick={() => {
                      setSliderIndex(prev => (prev + 1) % relatedProducts.length);
                      setIsAutoPlaying(false);
                    }}
                    className="w-11 h-11 rounded-full border border-[#161514] bg-[#161514] flex items-center justify-center text-white hover:bg-[#2c2926] transition-all active:scale-95 cursor-pointer"
                  >
                    <ChevronRight size={17} />
                  </button>
                </div>
              </div>
            </div>

            {/* Slider Container */}
            <div
              className="relative"
              onMouseEnter={() => setIsAutoPlaying(false)}
              onMouseLeave={() => setIsAutoPlaying(true)}
            >
              <motion.div
                className="flex gap-4 sm:gap-5 cursor-grab active:cursor-grabbing"
                drag="x"
                dragConstraints={{ left: -1000, right: 0 }}
                onDragEnd={(e, info) => {
                  const threshold = 50;
                  if (info.offset.x < -threshold) {
                    setSliderIndex(prev => (prev + 1) % relatedProducts.length);
                  } else if (info.offset.x > threshold) {
                    setSliderIndex(prev => (prev - 1 + relatedProducts.length) % relatedProducts.length);
                  }
                  setIsAutoPlaying(false);
                }}
                animate={{ x: `-${sliderIndex * (100 / (relatedProducts.length || 1))}%` }}
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
              >
                {relatedProducts.map((p) => (
                  <div
                    key={p.id}
                    className="shrink-0 w-[72vw] sm:w-[236px] md:w-[244px] lg:w-[calc((100%-60px)/4)] xl:w-[calc((100%-80px)/5)]"
                    onClick={() => window.scrollTo(0, 0)}
                  >
                    <ProductCard product={p} />
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ProductDetailPage;
