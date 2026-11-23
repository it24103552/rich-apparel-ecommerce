import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Heart, Star } from "lucide-react";
import toast from "react-hot-toast";
import { useCart } from "../../hooks/useCart";
import { formatPrice } from "../../utils/formatters";
import { getDisplayColor } from "../../utils/colorUtils";

const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith("http")) return imagePath;
  const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
  return `http://localhost:5001${cleanPath}`;
};

const getAvailableAttributes = (product) => {
  const colorsMap = new Map();
  const sizes = new Set();

  if (product.variants && Array.isArray(product.variants)) {
    product.variants.forEach((variant) => {
      if (variant.attributes) {
        Object.entries(variant.attributes).forEach(([key, value]) => {
          if (value === null || value === undefined) return;
          const lowerKey = key.toLowerCase();
          const values = Array.isArray(value) ? value : [value];

          values.forEach((val) => {
            if (lowerKey.includes("color") || lowerKey.includes("colour")) {
              const hex = getDisplayColor(val).toLowerCase();
              if (!colorsMap.has(hex)) {
                colorsMap.set(hex, val);
              }
            } else if (lowerKey.includes("size")) {
              sizes.add(val.toString().trim().toUpperCase());
            }
          });
        });
      }
    });
  }

  return {
    colors: Array.from(colorsMap.values()),
    sizes: Array.from(sizes),
  };
};

const getProductRating = (product) => {
  const activeReviews = Array.isArray(product.reviews)
    ? product.reviews.filter((r) => !r.isDeleted && typeof r.rating === "number")
    : [];

  const reviewCount =
    typeof product.reviewCount === "number" ? product.reviewCount : activeReviews.length;

  if (typeof product.averageRating === "number") {
    return { average: product.averageRating, count: reviewCount };
  }
  if (typeof product.rating === "number") {
    return { average: product.rating, count: reviewCount };
  }
  if (activeReviews.length > 0) {
    const sum = activeReviews.reduce((acc, r) => acc + r.rating, 0);
    return { average: sum / activeReviews.length, count: activeReviews.length };
  }
  return { average: null, count: 0 };
};

export const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const { colors, sizes } = getAvailableAttributes(product);
  const { average: avgRating, count: reviewCount } = getProductRating(product);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock <= 0) return;

    setAdding(true);
    try {
      addToCart(product.id, 1);
      toast.success("Added to cart!");
    } catch (error) {
      console.error("Failed to add to cart:", error);
      toast.error("Failed to add to cart");
    } finally {
      setAdding(false);
    }
  };

  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlisted((prev) => !prev);
  };

  const images = product.images || [];
  const mainImage = images[0] || product.imageUrl;
  const hoverImage = images[1] || mainImage;
  const isOutOfStock = product.stock <= 0;
  const isBestseller = Boolean(
    product.isBestseller ||
      product.bestseller ||
      product.badge?.toLowerCase?.() === "bestseller"
  );

  return (
    <div className="h-full">
      <Link
        to={`/product/${product.id}`}
        className="group bg-[#fcfaf7] rounded-[16px] border border-[#ebe4da] hover:border-[#d7cab9] shadow-[0_2px_10px_rgba(32,25,18,0.035)] hover:shadow-[0_10px_24px_rgba(32,25,18,0.08)] transition-all duration-250 hover:-translate-y-0.5 flex flex-col cursor-pointer overflow-hidden h-full p-2"
      >
        {/* Compact Square Image Container */}
        <div className="relative overflow-hidden rounded-[11px] bg-[#f1ebe3] aspect-square w-full">
          {mainImage ? (
            <>
              <img
                src={getImageUrl(mainImage)}
                alt={product.name?.trim() || "Product"}
                className={`absolute inset-0 w-full h-full object-cover object-[center_12%] transition-all duration-400 ease-out ${
                  images.length > 1
                    ? "group-hover:opacity-0"
                    : "group-hover:scale-[1.03]"
                }`}
              />
              {images.length > 1 && (
                <img
                  src={getImageUrl(hoverImage)}
                  alt={`${product.name?.trim() || "Product"} alternate`}
                  className="absolute inset-0 w-full h-full object-cover object-[center_12%] opacity-0 group-hover:opacity-100 group-hover:scale-[1.03] transition-all duration-400 ease-out"
                />
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#f1ebe3]">
              <span className="text-[#a89d90] text-[10px] font-bold uppercase tracking-[0.22em]">
                No Image
              </span>
            </div>
          )}

          {/* Top-Left Status Badge (Sold Out / Bestseller / New) */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
            {isOutOfStock ? (
              <span className="bg-[#9e2a2b] text-white text-[9px] font-bold uppercase tracking-[0.1em] px-2 py-0.5 rounded-md shadow-xs">
                Sold Out
              </span>
            ) : isBestseller ? (
              <span className="bg-[#a48155] text-white text-[9px] font-bold uppercase tracking-[0.1em] px-2 py-0.5 rounded-md shadow-xs">
                Bestseller
              </span>
            ) : product.isActive ? (
              <span className="bg-[#161514] text-white text-[9px] font-bold uppercase tracking-[0.1em] px-2 py-0.5 rounded-md shadow-xs">
                New
              </span>
            ) : null}
          </div>

          {/* Top-Right Wishlist Heart */}
          <button
            type="button"
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            aria-pressed={wishlisted}
            onClick={handleWishlistClick}
            className={`absolute top-2 right-2 z-10 w-7.5 h-7.5 rounded-full flex items-center justify-center backdrop-blur-sm border transition-all duration-200 cursor-pointer ${
              wishlisted
                ? "bg-[#161514] border-[#161514] text-white shadow-xs"
                : "bg-white/88 border-[#e8e0d5] text-[#2a2520] hover:bg-white hover:border-[#cbbca8]"
            }`}
          >
            <Heart
              size={14}
              strokeWidth={1.85}
              className={wishlisted ? "fill-current" : ""}
            />
          </button>
        </div>

        {/* Compact Info & CTA Container */}
        <div className="pt-2.5 px-1 pb-0.5 flex flex-col flex-1">
          {/* Product Name */}
          <h4 className="text-[13.5px] font-semibold text-[#181614] leading-[1.3] line-clamp-2 min-h-[2.2rem] group-hover:text-black transition-colors">
            {product.name?.trim()}
          </h4>

          {/* Rating Row (Strictly from live product reviews) */}
          <div className="mt-1 flex items-center gap-1 text-[11.5px]">
            {avgRating !== null && reviewCount > 0 ? (
              <>
                <Star size={12} className="fill-[#e4a63a] text-[#e4a63a] shrink-0" />
                <span className="font-bold text-[#2b2621]">{avgRating.toFixed(1)}</span>
                <span className="text-[#8a7f73] font-medium">({reviewCount})</span>
              </>
            ) : (
              <>
                <Star size={12} className="text-[#d0c6b8] shrink-0" />
                <span className="text-[#94897c] font-medium text-[11px]">No reviews yet</span>
              </>
            )}
          </div>

          {/* Compact Variant Swatches / Sizes */}
          <div className="mt-1.5 flex items-center justify-between gap-2 min-h-[16px]">
            {colors.length > 0 ? (
              <div className="flex items-center gap-1">
                {colors.slice(0, 4).map((color, idx) => (
                  <span
                    key={idx}
                    title={String(color)}
                    className="w-2.5 h-2.5 rounded-full border border-[#d6ccbf]"
                    style={{ backgroundColor: getDisplayColor(color) }}
                  />
                ))}
                {colors.length > 4 && (
                  <span className="text-[9px] text-[#8a7f73] font-semibold">
                    +{colors.length - 4}
                  </span>
                )}
              </div>
            ) : (
              <span />
            )}
            {sizes.length > 0 && (
              <span className="text-[10px] font-semibold text-[#8c8175] uppercase tracking-tight">
                {sizes.slice(0, 3).join(" / ")}
                {sizes.length > 3 ? ` +${sizes.length - 3}` : ""}
              </span>
            )}
          </div>

          {/* Prominent Price */}
          <div className="mt-2 mb-2.5">
            <span className="text-[15px] sm:text-[15.5px] font-extrabold text-[#141312] tracking-[-0.015em]">
              {formatPrice(product.price)}
            </span>
          </div>

          {/* Compact Black Add to Cart Button */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock || adding}
            className="mt-auto w-full py-2 px-3 rounded-[10px] bg-[#161514] hover:bg-[#2c2926] active:scale-[0.99] disabled:bg-[#cbc5bc] disabled:cursor-not-allowed text-white text-[12px] font-semibold tracking-[0.015em] inline-flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer"
          >
            <ShoppingCart size={13.5} strokeWidth={1.9} />
            <span>{isOutOfStock ? "Sold Out" : adding ? "Adding..." : "Add to Cart"}</span>
          </button>
        </div>
      </Link>
    </div>
  );
};
