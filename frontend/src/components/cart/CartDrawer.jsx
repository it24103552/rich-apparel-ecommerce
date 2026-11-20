import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "../../hooks/useCart";
import { Link, useNavigate } from "react-router-dom";

// Utils (standardized from other components)
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

const getDisplayColor = (color) => {
  if (!color || typeof color !== 'string') return '#e5e5e5';
  const c = color.toLowerCase().trim();
  if (c.startsWith('#')) return c;
  const colorMap = {
    'white': '#ffffff', 'black': '#000000', 'red': '#ff3b30', 'blue': '#007aff',
    'green': '#34c759', 'yellow': '#ffcc00', 'orange': '#ff9500', 'pink': '#ff2d55',
    'purple': '#af52de', 'grey': '#8e8e93', 'gray': '#8e8e93', 'navy': '#000080',
    'beige': '#f5f5dc', 'brown': '#a2845e'
  };
  return colorMap[c] || c;
};

export const CartDrawer = () => {
  const { items, total, isCartOpen, toggleCart, updateCartItem, removeFromCart } = useCart();
  const navigate = useNavigate();
  const [orderNoteOpen, setOrderNoteOpen] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleCheckout = () => {
    if (!agreedToTerms) {
      alert("Please agree to the terms and conditions before checking out.");
      return;
    }
    toggleCart(false);
    navigate("/checkout");
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => toggleCart(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[1000]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-[450px] bg-white shadow-2xl z-[1001] flex flex-col"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-6 border-b border-neutral-100">
              <h2 className="text-[14px] font-black uppercase tracking-[0.3em] text-black">Cart</h2>
              <button 
                onClick={() => toggleCart(false)}
                className="hover:rotate-90 transition-transform duration-300 cursor-pointer"
              >
                <X size={20} className="text-neutral-400 hover:text-black" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-6">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center pb-20">
                  <div className="w-20 h-20 rounded-full bg-neutral-50 flex items-center justify-center mb-6">
                    <ShoppingBag size={32} className="text-neutral-300" />
                  </div>
                  <p className="text-[13px] font-bold text-neutral-400 uppercase tracking-widest mb-6">Your cart is currently empty.</p>
                  <button 
                    onClick={() => { toggleCart(false); navigate("/"); }}
                    className="bg-black text-white px-8 py-3.5 rounded-full text-[11px] font-bold uppercase tracking-[0.2em] shadow-lg hover:shadow-black/20 hover:-translate-y-0.5 transition-all"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-8">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      {/* Image */}
                      <div className="w-24 aspect-[4/5] bg-neutral-50 rounded-xl overflow-hidden border border-neutral-100 flex-shrink-0">
                        <img 
                          src={getImageUrl(item.imageUrl)} 
                          alt={item.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Details */}
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                          <div className="flex justify-between items-start mb-1">
                            <h3 className="text-[13px] font-bold text-black uppercase tracking-tight line-clamp-2 pr-4">{item.name}</h3>
                            <span className="text-[13px] font-bold text-black whitespace-nowrap">{formatPrice(item.price * item.quantity)}</span>
                          </div>
                          
                          {/* Variant Details */}
                          <div className="flex items-center gap-2 mb-4">
                            {item.variantAttributes?.colour && (
                              <div 
                                className="w-3 h-3 rounded-full border border-neutral-200"
                                style={{ backgroundColor: getDisplayColor(item.variantAttributes.colour) }}
                              />
                            )}
                            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                              {!item.variantAttributes?.colour?.startsWith('#') && item.variantAttributes?.colour} 
                              {item.variantAttributes?.size ? `${(!item.variantAttributes?.colour || item.variantAttributes?.colour?.startsWith('#')) ? '' : ', '}${item.variantAttributes.size}` : ""}
                              {!item.variantAttributes?.colour && !item.variantAttributes?.size && "Standard"}
                            </p>
                          </div>

                          {/* Controls */}
                          <div className="flex items-center gap-4">
                            <div className="flex items-center bg-neutral-50 rounded-lg border border-neutral-100 p-1">
                              <button 
                                onClick={() => updateCartItem(item.id, Math.max(1, item.quantity - 1))}
                                className="w-7 h-7 flex items-center justify-center text-neutral-400 hover:text-black transition-colors cursor-pointer"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="w-8 text-center text-[12px] font-bold">{item.quantity}</span>
                              <button 
                                onClick={() => {
                                  if (item.quantity < item.maxStock) {
                                    updateCartItem(item.id, item.quantity + 1);
                                  } else {
                                    // Optional: toast or subtle feedback
                                    console.log("Max stock reached");
                                  }
                                }}
                                disabled={item.quantity >= item.maxStock}
                                className={`w-7 h-7 flex items-center justify-center transition-colors ${item.quantity >= item.maxStock ? 'text-neutral-200 cursor-not-allowed' : 'text-neutral-400 hover:text-black'}`}
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                            <button 
                              onClick={() => removeFromCart(item.id)}
                              className="text-neutral-300 hover:text-red-500 transition-colors cursor-pointer"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-neutral-100 bg-white px-6 py-8 space-y-6">
                {/* Order Note Toggle */}
                <button 
                  onClick={() => setOrderNoteOpen(!orderNoteOpen)}
                  className="w-full flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-800 hover:text-black transition-colors py-2 border-y border-neutral-50 group cursor-pointer"
                >
                  Add order note
                  <Plus size={14} className={`transition-transform duration-300 ${orderNoteOpen ? 'rotate-45' : ''}`} />
                </button>
                
                {orderNoteOpen && (
                  <textarea 
                    placeholder="Enter your instructions here..."
                    className="w-full h-24 bg-neutral-50 rounded-xl border border-neutral-100 p-4 text-[12px] outline-none focus:ring-1 focus:ring-black/5 transition-all resize-none"
                  />
                )}

                <div className="space-y-4">
                  <p className="text-[11px] text-neutral-400 font-medium text-center">
                    Taxes and <span className="underline cursor-pointer">shipping</span> calculated at checkout
                  </p>

                  <label className="flex items-center justify-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="hidden"
                    />
                    <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all ${agreedToTerms ? 'bg-black border-black' : 'border-neutral-200 group-hover:border-black'}`}>
                      {agreedToTerms && <Plus size={12} className="text-white rotate-45" />}
                    </div>
                    <span className="text-[11px] font-medium text-neutral-600">I agree with the <span className="underline">terms and conditions</span></span>
                  </label>

                  <button 
                    onClick={handleCheckout}
                    className="w-full bg-black text-white py-4 rounded-xl flex items-center justify-center gap-3 text-[12px] font-black uppercase tracking-[0.2em] shadow-[0_12px_40px_rgba(0,0,0,0.15)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.25)] hover:-translate-y-1 transition-all duration-500 active:scale-[0.98]"
                  >
                    Checkout • {formatPrice(total)}
                  </button>

                  <button 
                    onClick={() => { toggleCart(false); navigate("/cart"); }}
                    className="w-full text-center text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400 hover:text-black transition-colors underline underline-offset-8 cursor-pointer"
                  >
                    View Cart
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
