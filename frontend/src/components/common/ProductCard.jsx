import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Heart, Eye } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useCart } from "../../hooks/useCart";
import { formatPrice } from "../../utils/formatters";
import { getDisplayColor } from "../../utils/colorUtils";

const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `http://localhost:5001${cleanPath}`;
};

const getAvailableAttributes = (product) => {
  const colorsMap = new Map();
  const sizes = new Set();
  
  if (product.variants && Array.isArray(product.variants)) {
    product.variants.forEach(variant => {
      if (variant.attributes) {
        Object.entries(variant.attributes).forEach(([key, value]) => {
          if (value === null || value === undefined) return;
          const lowerKey = key.toLowerCase();
          const values = Array.isArray(value) ? value : [value];
          
          values.forEach(val => {
            if (lowerKey.includes('color') || lowerKey.includes('colour')) {
              const hex = getDisplayColor(val).toLowerCase();
              if (!colorsMap.has(hex)) {
                colorsMap.set(hex, val);
              }
            } else if (lowerKey.includes('size')) {
              sizes.add(val.toString().trim().toUpperCase());
            }
          });
        });
      }
    });
  }
  
  return { 
    colors: Array.from(colorsMap.values()), 
    sizes: Array.from(sizes) 
  };
};

export const ProductCard = ({ product, layout = "grid" }) => {
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);
  const { colors, sizes } = getAvailableAttributes(product);

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

  const images = product.images || [];
  const mainImage = images[0] || product.imageUrl;
  const hoverImage = images[1] || mainImage;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
      className="h-full"
    >
      <Link
        to={`/product/${product.id}`}
        className="group bg-white rounded-2xl border border-neutral-100/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.1)] transition-all duration-500 flex flex-col cursor-pointer overflow-hidden h-full transform hover:-translate-y-1"
      >
        {/* Image Container */}
        <div className="relative overflow-hidden bg-neutral-50 aspect-[4/5] w-full">
          {mainImage ? (
            <>
              <img
                src={getImageUrl(mainImage)}
                alt={product.name}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-out ${images.length > 1 ? 'group-hover:opacity-0' : 'group-hover:scale-110 transition-transform duration-700'}`}
              />
              {images.length > 1 && (
                <img
                  src={getImageUrl(hoverImage)}
                  alt={`${product.name} alternate`}
                  className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out"
                />
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-neutral-100">
              <span className="text-neutral-300 text-[10px] font-bold uppercase tracking-[0.3em]">No Image</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
            {product.stock <= 0 && (
              <span className="bg-red-500 text-white text-[8px] font-bold uppercase tracking-[0.15em] px-2.5 py-1 rounded-md shadow-lg">
                Sold Out
              </span>
            )}
            {product.isActive && !product.stock <= 0 && (
              <span className="bg-black text-white text-[8px] font-bold uppercase tracking-[0.15em] px-2.5 py-1 rounded-md shadow-lg">
                New
              </span>
            )}
          </div>

          {/* Quick Actions Overlay */}
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          
          <div className="absolute top-3 right-3 flex flex-col gap-2 z-10 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-400">
            <button 
              className="p-2.5 bg-white/90 backdrop-blur-xl rounded-full shadow-lg hover:bg-black hover:text-white transition-all duration-300 pointer-events-auto"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            >
              <Heart size={14} />
            </button>
            <button 
              className="p-2.5 bg-white/90 backdrop-blur-xl rounded-full shadow-lg hover:bg-black hover:text-white transition-all duration-300 pointer-events-auto"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            >
              <Eye size={14} />
            </button>
          </div>
        </div>

        {/* Info Container */}
        <div className="p-4 flex flex-col flex-1 bg-white">
          <div className="mb-2">
            <h4 className="text-[12px] font-bold text-neutral-800 uppercase tracking-wide line-clamp-2 leading-snug group-hover:text-black transition-colors">
              {product.name}
            </h4>
          </div>

          {/* Attributes Summary */}
          <div className="flex flex-col gap-2 mb-4">
            {colors.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {colors.slice(0, 5).map((color, idx) => (
                  <div 
                    key={idx} 
                    className="w-2.5 h-2.5 rounded-full border border-neutral-300 shadow-xs"
                    style={{ backgroundColor: getDisplayColor(color) }}
                  />
                ))}
                {colors.length > 5 && (
                  <span className="text-[8px] text-neutral-400 font-bold ml-0.5">+{colors.length - 5}</span>
                )}
              </div>
            )}
            {sizes.length > 0 ? (
              <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-tighter">
                {sizes.slice(0, 3).join(' / ')} {sizes.length > 3 ? `+${sizes.length - 3}` : ''}
              </div>
            ) : (
              <div className="h-3" /> // Spacer for layout consistency
            )}
          </div>

          {/* Price & Add to Cart */}
          <div className="mt-auto pt-3 border-t border-neutral-100 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[16px] font-bold text-black">{formatPrice(product.price)}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};
