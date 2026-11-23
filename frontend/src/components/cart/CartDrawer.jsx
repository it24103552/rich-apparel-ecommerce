import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight, Check } from "lucide-react";
import { useCart } from "../../hooks/useCart";
import { Link, useNavigate } from "react-router-dom";
import { getDisplayColor } from "../../utils/colorUtils";

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
            className="fixed inset-0 bg-[#151413]/45 backdrop-blur-sm z-[1000]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-[440px] bg-white border-l border-[#ece6dd] shadow-[0_24px_64px_rgba(24,20,16,0.2)] z-[1001] flex flex-col"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 bg-[#faf7f2] border-b border-[#ece6dd]">
              <div className="flex items-center gap-2.5">
                <h2 className="text-[15px] font-extrabold uppercase tracking-[0.14em] text-[#151413]">
                  Shopping Bag
                </h2>
                <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-[#efe7dc] border border-[#e3d7c6] text-[11px] font-bold text-[#5c5145]">
                  {items.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => toggleCart(false)}
                aria-label="Close shopping bag"
                className="w-9 h-9 rounded-full bg-white border border-[#e5ddd2] hover:bg-[#161514] hover:border-[#161514] text-[#5c544b] hover:text-white flex items-center justify-center transition-all duration-200 cursor-pointer"
              >
                <X size={17} strokeWidth={2} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-5 sm:px-6 py-5 bg-white">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-4 pb-16">
                  <div className="w-16 h-16 rounded-2xl bg-[#f6f1ea] border border-[#eae1d5] flex items-center justify-center mb-5">
                    <ShoppingBag size={26} strokeWidth={1.6} className="text-[#9a7b56]" />
                  </div>
                  <p className="text-[16px] font-bold text-[#151413] tracking-[-0.01em] mb-1.5">
                    Your bag is empty
                  </p>
                  <p className="text-[13px] font-medium text-[#7a7064] leading-relaxed max-w-[260px] mb-7">
                    Explore our latest collections and add your favourite pieces to get started.
                  </p>
                  <button
                    type="button"
                    onClick={() => { toggleCart(false); navigate("/"); }}
                    className="inline-flex items-center gap-2 bg-[#161514] hover:bg-[#2c2926] text-white px-7 py-3.5 rounded-full text-[12px] font-bold uppercase tracking-[0.14em] shadow-[0_10px_24px_rgba(22,21,20,0.16)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                  >
                    <span>Start Shopping</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 p-3.5 rounded-2xl bg-[#fcfaf7] border border-[#ebe4da] hover:border-[#d7cab9] transition-colors"
                    >
                      {/* Image */}
                      <div className="w-[82px] h-[100px] bg-[#f1ebe3] rounded-xl overflow-hidden border border-[#e6ddd0] flex-shrink-0">
                        <img
                          src={getImageUrl(item.imageUrl)}
                          alt={item.name}
                          className="w-full h-full object-cover object-[center_12%]"
                        />
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start gap-3">
                            <h3 className="text-[13px] font-bold text-[#151413] leading-snug line-clamp-2">
                              {item.name}
                            </h3>
                            <span className="text-[13.5px] font-extrabold text-[#151413] whitespace-nowrap shrink-0">
                              {formatPrice(item.price * item.quantity)}
                            </span>
                          </div>

                          {/* Variant Details */}
                          <div className="flex items-center gap-1.5 mt-1.5">
                            {item.variantAttributes?.colour && (
                              <span
                                className="w-3 h-3 rounded-full border border-[#d6ccbf] shrink-0"
                                style={{ backgroundColor: getDisplayColor(item.variantAttributes.colour) }}
                              />
                            )}
                            <p className="text-[11px] font-semibold text-[#7a7064] uppercase tracking-[0.08em] truncate">
                              {!item.variantAttributes?.colour?.startsWith('#') && item.variantAttributes?.colour}
                              {item.variantAttributes?.size ? `${(!item.variantAttributes?.colour || item.variantAttributes?.colour?.startsWith('#')) ? '' : ' · '}${item.variantAttributes.size}` : ""}
                              {!item.variantAttributes?.colour && !item.variantAttributes?.size && "Standard"}
                            </p>
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-between gap-3 mt-3 pt-2.5 border-t border-[#efe8de]">
                          <div className="inline-flex items-center bg-white rounded-full border border-[#e4dcd0] p-0.5">
                            <button
                              type="button"
                              aria-label="Decrease quantity"
                              onClick={() => updateCartItem(item.id, Math.max(1, item.quantity - 1))}
                              className="w-7 h-7 rounded-full flex items-center justify-center text-[#5c544b] hover:bg-[#f4f0ea] hover:text-[#151413] transition-colors cursor-pointer"
                            >
                              <Minus size={12} strokeWidth={2.2} />
                            </button>
                            <span className="w-7 text-center text-[12px] font-bold text-[#151413]">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              aria-label="Increase quantity"
                              onClick={() => {
                                if (item.quantity < item.maxStock) {
                                  updateCartItem(item.id, item.quantity + 1);
                                } else {
                                  // Optional: toast or subtle feedback
                                  console.log("Max stock reached");
                                }
                              }}
                              disabled={item.quantity >= item.maxStock}
                              className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                                item.quantity >= item.maxStock
                                  ? 'text-[#cfc6ba] cursor-not-allowed'
                                  : 'text-[#5c544b] hover:bg-[#f4f0ea] hover:text-[#151413] cursor-pointer'
                              }`}
                            >
                              <Plus size={12} strokeWidth={2.2} />
                            </button>
                          </div>

                          <button
                            type="button"
                            aria-label="Remove item"
                            onClick={() => removeFromCart(item.id)}
                            className="p-1.5 rounded-lg text-[#9a8e80] hover:text-[#b43232] hover:bg-[#fdf0f0] transition-colors cursor-pointer"
                          >
                            <Trash2 size={15} strokeWidth={1.85} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-[#ece6dd] bg-[#faf7f2] px-6 py-5 space-y-4">
                {/* Order Note Toggle */}
                <div>
                  <button
                    type="button"
                    onClick={() => setOrderNoteOpen(!orderNoteOpen)}
                    className="w-full flex items-center justify-between text-[11.5px] font-bold uppercase tracking-[0.14em] text-[#3f3831] hover:text-[#151413] transition-colors py-1.5 cursor-pointer"
                  >
                    <span>Add order note</span>
                    <Plus
                      size={14}
                      strokeWidth={2.2}
                      className={`text-[#8d8276] transition-transform duration-300 ${orderNoteOpen ? 'rotate-45 text-[#151413]' : ''}`}
                    />
                  </button>

                  {orderNoteOpen && (
                    <textarea
                      placeholder="Enter your delivery or gift instructions..."
                      className="w-full mt-2.5 h-20 bg-white rounded-xl border border-[#e3d9cc] focus:border-[#161514] focus:ring-2 focus:ring-[#c9a77a]/20 p-3.5 text-[12.5px] font-medium text-[#151413] placeholder:text-[#9a8e80] outline-none transition-all resize-none"
                    />
                  )}
                </div>

                {/* Subtotal Summary */}
                <div className="pt-3 border-t border-[#eae1d5] space-y-3.5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#6c6257]">
                      Subtotal
                    </span>
                    <span className="text-[19px] font-extrabold text-[#151413] tracking-[-0.02em]">
                      {formatPrice(total)}
                    </span>
                  </div>

                  <p className="text-[11.5px] text-[#7a7064] font-medium">
                    Taxes and <span className="underline underline-offset-2 text-[#453d35]">shipping</span> calculated at checkout.
                  </p>

                  <label className="flex items-center gap-2.5 cursor-pointer group select-none">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="hidden"
                    />
                    <div
                      className={`w-[18px] h-[18px] rounded-[5px] border flex items-center justify-center transition-all shrink-0 ${
                        agreedToTerms
                          ? 'bg-[#161514] border-[#161514]'
                          : 'bg-white border-[#cbbca8] group-hover:border-[#161514]'
                      }`}
                    >
                      {agreedToTerms && <Check size={12} strokeWidth={3} className="text-white" />}
                    </div>
                    <span className="text-[12px] font-medium text-[#5c544b]">
                      I agree with the <span className="underline underline-offset-2 text-[#151413]">terms and conditions</span>
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={handleCheckout}
                    className="w-full bg-[#161514] hover:bg-[#2c2926] text-white py-3.5 px-6 rounded-full flex items-center justify-center gap-2.5 text-[12px] font-bold uppercase tracking-[0.14em] shadow-[0_10px_24px_rgba(22,21,20,0.16)] hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-200 cursor-pointer"
                  >
                    <span>Checkout · {formatPrice(total)}</span>
                    <ArrowRight size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={() => { toggleCart(false); navigate("/cart"); }}
                    className="w-full py-2.5 px-5 rounded-full bg-white border border-[#dcd2c5] hover:border-[#161514] text-[#1a1816] text-[11.5px] font-bold uppercase tracking-[0.14em] transition-colors cursor-pointer"
                  >
                    View Shopping Bag
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
