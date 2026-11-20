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
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-neutral-100 border-t-black rounded-full animate-spin" />
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">Loading Product</span>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
        <h2 className="text-2xl font-bold uppercase tracking-tight mb-4">Product Not Found</h2>
        <p className="text-neutral-500 mb-8 max-w-md">Sorry, we couldn't find the product you're looking for. It might have been removed or the URL is incorrect.</p>
        <Link to="/" className="px-8 py-3 bg-black text-white rounded-full text-[11px] font-bold uppercase tracking-[0.2em] shadow-lg">Return to Home</Link>
      </div>
    );
  }

  // availableAttributes is already computed via useMemo

  const visibleReviews = product?.reviews?.filter(r => !r.isDeleted) || [];
  const averageRating = visibleReviews.length > 0
    ? visibleReviews.reduce((sum, rev) => sum + rev.rating, 0) / visibleReviews.length
    : 0;

  return (
    <div className="bg-white min-h-screen pt-8 md:pt-12 pb-24 selection:bg-black selection:text-white" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      <div className="max-w-[1400px] mx-auto px-[5%] lg:px-[6%]">

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2.5 mb-8 md:mb-10 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
          <Link to="/" className="hover:text-black transition-colors shrink-0">Home</Link>
          <ChevronRight size={10} className="shrink-0" />
          <span className="text-black truncate max-w-[240px] sm:max-w-[420px]">{product.name}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-10 lg:gap-14 xl:gap-16 items-start">

          {/* Left: Image Gallery */}
          <div className="w-full lg:w-[54%] xl:w-[52%]">
            <div className="flex flex-col md:flex-row gap-3.5 md:gap-4">
              {/* Thumbnails (Desktop: Vertical) */}
              {product.images?.length > 1 && (
                <div className="order-2 md:order-1 flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto no-scrollbar md:max-h-[680px] p-0.5 scroll-smooth">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`relative w-16 sm:w-20 aspect-[4/5] shrink-0 rounded-xl overflow-hidden bg-neutral-50 transition-all duration-300 cursor-pointer ${
                        selectedImage === idx
                          ? 'border-2 border-black ring-2 ring-black/10 shadow-sm opacity-100'
                          : 'border border-neutral-200/80 opacity-65 hover:opacity-100 hover:border-neutral-400'
                      }`}
                    >
                      <img src={getImageUrl(img)} className="w-full h-full object-cover" alt={`Thumb ${idx}`} />
                    </button>
                  ))}
                </div>
              )}

              {/* Main Image */}
              <div className="order-1 md:order-2 flex-1 relative aspect-[4/5] max-h-[680px] bg-neutral-50 rounded-2xl overflow-hidden group shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-neutral-100/80">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={selectedImage}
                    src={getImageUrl(product.images?.[selectedImage])}
                    initial={{ opacity: 0, scale: 1.03 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full h-full object-cover"
                    alt={product.name}
                  />
                </AnimatePresence>

                {/* Sale/New Badge */}
                <div className="absolute top-4 left-4 bg-black text-white text-[9px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-md shadow-sm">
                  New Arrival
                </div>

                {/* Floating Actions */}
                <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300">
                  <button
                    onClick={() => setIsWishlisted(!isWishlisted)}
                    aria-label="Toggle wishlist"
                    className={`w-10 h-10 rounded-full shadow-md backdrop-blur-md border flex items-center justify-center transition-all cursor-pointer ${
                      isWishlisted
                        ? 'bg-black text-white border-black'
                        : 'bg-white/95 text-black border-neutral-200/80 hover:bg-black hover:text-white hover:border-black'
                    }`}
                  >
                    <Heart size={16} fill={isWishlisted ? "currentColor" : "none"} />
                  </button>
                  <button
                    aria-label="Share product"
                    className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-md text-black border border-neutral-200/80 shadow-md flex items-center justify-center hover:bg-black hover:text-white hover:border-black transition-all cursor-pointer"
                  >
                    <Share2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Product Details */}
          <div className="w-full lg:w-[46%] xl:w-[48%]">
            <div className="lg:sticky lg:top-28">

              {/* Product Header */}
              <div className="pb-7 mb-7 border-b border-neutral-100">
                <div className="flex flex-wrap items-center gap-2.5 mb-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-[0.15em] border ${
                    (activeVariant ? activeVariant.stock : product.stock) > 0
                      ? 'bg-neutral-50 border-neutral-200/80 text-neutral-800'
                      : 'bg-red-50/80 border-red-200/80 text-red-700'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${(activeVariant ? activeVariant.stock : product.stock) > 0 ? 'bg-emerald-600' : 'bg-red-500'}`} />
                    {(activeVariant ? activeVariant.stock : product.stock) > 0 ? 'In Stock' : 'Out of Stock'}
                  </span>
                  {activeVariant && (
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.15em]">
                      {activeVariant.stock} units available
                    </span>
                  )}
                  <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-[0.18em] sm:ml-auto">
                    REF: {product.id.slice(-8).toUpperCase()}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black uppercase tracking-tight leading-[1.15] break-words mb-4">
                  {product.name}
                </h1>

                {visibleReviews.length > 0 && (
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={14}
                          className={`${star <= Math.round(averageRating)
                              ? "fill-black text-black"
                              : "fill-neutral-100 text-neutral-200"
                            }`}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] font-bold text-neutral-700 tracking-wide pt-0.5">
                      {averageRating.toFixed(1)} <span className="text-neutral-400 font-medium">({visibleReviews.length} Reviews)</span>
                    </span>
                  </div>
                )}

                <div className="flex items-baseline gap-3.5 mt-2">
                  <span className="text-2xl sm:text-3xl font-bold text-black tracking-tight">{formatPrice(product.price)}</span>
                  {product.oldPrice && <span className="text-lg text-neutral-300 line-through font-medium">{formatPrice(product.oldPrice)}</span>}
                </div>
              </div>


              {/* Product Attributes */}
              <div className="space-y-7 mb-8">
                {Object.entries(availableAttributes).filter(([_, opts]) => opts.length === 1).length > 0 && (
                  <div className="flex flex-wrap gap-x-6 gap-y-2.5 border-b border-neutral-100 pb-6">
                    {Object.entries(availableAttributes)
                      .filter(([_, opts]) => opts.length === 1)
                      .map(([attrKey, attrOptions]) => (
                        <div key={attrKey} className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">{attrKey}:</span>
                          {attrKey === 'colour' && (
                            <span
                              className="w-3 h-3 rounded-full border border-neutral-300 shrink-0"
                              style={{ backgroundColor: getDisplayColor(attrOptions[0]) }}
                            />
                          )}
                          <span className="text-[11px] font-bold uppercase tracking-wider text-black">{attrOptions[0]}</span>
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
                        <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-neutral-800 mb-3.5 block">
                          Colour: <span className="text-neutral-500 font-semibold ml-1">{selectedOptions[attrKey]}</span>
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
                                  ? 'ring-2 ring-black ring-offset-2 border border-black/20'
                                  : 'border border-neutral-200 hover:border-neutral-400'
                              }`}
                            >
                              <div
                                className="w-full h-full rounded-full border border-neutral-300/90 shadow-2xs"
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
                      <div className="flex justify-between items-center mb-3.5">
                        <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-neutral-800">
                          {attrKey}: <span className="text-neutral-500 font-semibold ml-1">{selectedOptions[attrKey]}</span>
                        </span>
                        {attrKey === 'size' && (
                          <button type="button" className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-600 hover:text-black border-b border-neutral-300 hover:border-black transition-all pb-0.5 cursor-pointer">
                            <Ruler size={12} /> Size Guide
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
                        {attrOptions.map((opt, idx) => {
                          const disabled = isOptionDisabled(attrKey, opt);
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => !disabled && setSelectedOptions({ ...selectedOptions, [attrKey]: opt })}
                              className={`relative h-11 flex items-center justify-center rounded-xl text-[11px] font-bold uppercase tracking-[0.15em] border transition-all duration-200 ${
                                selectedOptions[attrKey] === opt
                                  ? 'bg-black text-white border-black shadow-[0_6px_16px_rgba(0,0,0,0.14)] cursor-pointer'
                                  : disabled
                                    ? 'bg-neutral-50 text-neutral-300 border-neutral-100 cursor-not-allowed'
                                    : 'bg-white text-neutral-900 border-neutral-200 hover:border-black hover:bg-neutral-50 cursor-pointer'
                                }`}
                            >
                              {opt}
                              {disabled && (
                                <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
                                  <div className="w-[130%] h-[1px] bg-neutral-300 rotate-[32deg] transform-origin-center" />
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
              <div className="flex flex-col gap-3 mb-9">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex items-center justify-between bg-[#f7f7f7] rounded-full border border-neutral-200/80 px-2 h-[52px] sm:w-[140px]">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      aria-label="Decrease quantity"
                      className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white hover:shadow-xs transition-all text-neutral-600 hover:text-black cursor-pointer"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="flex-1 text-center text-[13px] font-bold text-black">{quantity}</span>
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
                      className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white hover:shadow-xs transition-all text-neutral-600 hover:text-black cursor-pointer"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={(activeVariant ? activeVariant.stock : product.stock) === 0}
                    className="h-[52px] flex-1 bg-black text-white rounded-full flex items-center justify-center gap-3 px-8 text-[11px] font-bold uppercase tracking-[0.2em] shadow-[0_10px_28px_rgba(0,0,0,0.16)] hover:bg-neutral-800 hover:shadow-[0_14px_36px_rgba(0,0,0,0.22)] hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-30 disabled:hover:translate-y-0 active:scale-[0.98] cursor-pointer"
                  >
                    <ShoppingBag size={16} /> Add to Cart
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleQuickCheckout}
                  disabled={(activeVariant ? activeVariant.stock : product.stock) === 0}
                  className="h-[50px] w-full bg-white text-black border border-neutral-200 rounded-full text-[11px] font-bold uppercase tracking-[0.2em] hover:border-black hover:bg-neutral-50 transition-all duration-200 active:scale-[0.98] cursor-pointer disabled:opacity-30"
                >
                  Quick Checkout
                </button>
              </div>

              {/* Benefits Icons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-7 border-t border-neutral-100">
                <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#fafafa] border border-neutral-100">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-black shadow-2xs border border-neutral-100 shrink-0">
                    <Truck size={17} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-black">Free Delivery</span>
                    <span className="text-[10px] text-neutral-500 font-medium">On orders over LKR 10k</span>
                  </div>
                </div>
                <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#fafafa] border border-neutral-100">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-black shadow-2xs border border-neutral-100 shrink-0">
                    <ShieldCheck size={17} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-black">Authentic Gear</span>
                    <span className="text-[10px] text-neutral-500 font-medium">100% Genuine product</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Info Section (Full Width) */}
        <div className="mt-20 md:mt-24 pt-16 border-t border-neutral-100">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-16">

            {/* Left Column: Description */}
            <div className="lg:col-span-7">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-6 bg-black rounded-full" />
                <h2 className="text-xs font-bold uppercase tracking-[0.28em] text-black">Product Narrative</h2>
              </div>
              <div className="space-y-5">
                <p className="text-[15px] text-neutral-800 font-medium leading-[1.8]">
                  {product.description || "Meticulously crafted from high-precision materials, this item embodies the core values of Rich Apparel: quality, durability, and timeless style."}
                </p>
                <p className="text-[14px] text-neutral-500 leading-[1.8]">
                  Designed to withstand the rigors of active use while maintaining a sophisticated aesthetic that seamlessly transitions from technical performance to lifestyle contexts. Every detail reflects our commitment to premium craftsmanship.
                </p>
              </div>
            </div>

            {/* Right Column: Material & Shipping */}
            <div className="lg:col-span-5 bg-[#fafafa] rounded-2xl border border-neutral-100 p-6 sm:p-8 flex flex-col gap-8">
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-[0.25em] text-black mb-5">Material & Care</h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-y-2.5 gap-x-6">
                  {['100% Premium Cotton', 'Machine wash cold', 'Dry flat', 'Do not bleach', 'Warm iron if needed'].map((item, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-[12px] text-neutral-600 font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-black/30 shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 border-t border-neutral-200/70">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.25em] text-black mb-5">Logistics</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-400 mb-1.5">Delivery</span>
                    <span className="text-[12px] font-semibold text-neutral-800">3-5 Working Days</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-400 mb-1.5">Policy</span>
                    <span className="text-[12px] font-semibold text-neutral-800">7-Day Free Returns</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* --- Related Products Section (Swapping Grid) --- */}
        {relatedProducts.length > 0 && (
          <div className="mt-20 md:mt-24 pt-16 border-t border-neutral-100 overflow-hidden pb-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6 px-1">
              <div className="flex items-start gap-4 animate-fade-in">
                <div className="w-1.5 h-10 bg-black rounded-full mt-1 shrink-0" />
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-black uppercase tracking-tight mb-1">Related Collection</h2>
                  <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-neutral-400 block">You May Also Like</span>
                </div>
              </div>

              <div className="flex items-center gap-5">
                {/* Custom Progress Bar */}
                <div className="hidden md:block w-32 h-[2px] bg-neutral-100 rounded-full relative overflow-hidden">
                  <motion.div
                    className="absolute inset-0 bg-black origin-left"
                    animate={{ scaleX: (sliderIndex + 1) / Math.ceil(relatedProducts.length / 1) }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                  />
                </div>

                {/* Navigation Arrows */}
                <div className="flex gap-2.5">
                  <button
                    onClick={() => {
                      setSliderIndex(prev => (prev - 1 + relatedProducts.length) % relatedProducts.length);
                      setIsAutoPlaying(false);
                    }}
                    className="w-11 h-11 rounded-full border border-neutral-200 flex items-center justify-center text-black hover:border-black hover:bg-black hover:text-white transition-all active:scale-90 shadow-2xs cursor-pointer"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <button
                    onClick={() => {
                      setSliderIndex(prev => (prev + 1) % relatedProducts.length);
                      setIsAutoPlaying(false);
                    }}
                    className="w-11 h-11 rounded-full border border-neutral-200 flex items-center justify-center text-black hover:border-black hover:bg-black hover:text-white transition-all active:scale-90 shadow-2xs cursor-pointer"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Slider Container */}
            <div
              className="relative pr-[10%] md:pr-0"
              onMouseEnter={() => setIsAutoPlaying(false)}
              onMouseLeave={() => setIsAutoPlaying(true)}
            >
              <motion.div
                className="flex gap-5 cursor-grab active:cursor-grabbing"
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
                  <div key={p.id} className="w-[260px] md:w-[calc(25%-15px)] flex-shrink-0 animate-fade-in-up">
                    <Link
                      to={`/product/${p.id}`}
                      className="group bg-white rounded-2xl border border-neutral-100/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.1)] transition-all duration-500 flex flex-col overflow-hidden h-full hover:-translate-y-1"
                      onClick={() => window.scrollTo(0, 0)}
                    >
                      <div className="relative aspect-[4/5] overflow-hidden bg-neutral-50 w-full">
                        <img
                          src={getImageUrl(p.images?.[0] || p.imageUrl)}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        />
                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute top-3 right-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-400">
                          <div className="w-9 h-9 rounded-full bg-white/95 backdrop-blur-md shadow-md flex items-center justify-center text-black">
                            <Plus size={16} />
                          </div>
                        </div>
                      </div>
                      <div className="p-4 flex flex-col flex-1 bg-white">
                        <h3 className="text-[12px] font-bold text-neutral-800 uppercase tracking-wide mb-2 line-clamp-1 group-hover:text-black transition-colors">{p.name}</h3>
                        <div className="mt-auto pt-2.5 border-t border-neutral-100">
                          <p className="text-[15px] font-bold text-black">{formatPrice(p.price)}</p>
                        </div>
                      </div>
                    </Link>
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
