import { Navigate, Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../hooks/useCart";
import { Button } from "../../components/common/Button";
import { CartSkeleton } from "../../components/loading/ClientSkeletons";
import { formatPrice } from "../../utils/formatters";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ChevronRight } from "lucide-react";

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

export const CartPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { items, total, loading, updateCartItem, removeFromCart } = useCart();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleQuantityChange = async (item, newQuantity) => {
    if (newQuantity <= 0) return;
    if (newQuantity > item.maxStock) {
      toast.error(`Only ${item.maxStock} items available in stock`);
      return;
    }
    await updateCartItem(item.id, newQuantity);
    toast.success("Cart updated");
  };

  const handleCheckout = () => {
    navigate("/checkout");
  };

  return (
    <div
      className="bg-[#faf8f5] min-h-screen selection:bg-[#161514] selection:text-white"
      style={{ fontFamily: "'Montserrat', sans-serif" }}
    >
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-10 pb-20">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 mb-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8d8276]"
        >
          <Link to="/" className="hover:text-[#151413] transition-colors">
            Home
          </Link>
          <ChevronRight size={11} className="text-[#b5a99b]" />
          <span className="text-[#151413] font-bold">Shopping Bag</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 pb-7 mb-9 border-b border-[#e8e0d5] animate-fade-in">
          <div className="flex items-start gap-3.5">
            <div className="w-1 h-9 sm:h-11 bg-[#9a7b56] rounded-full mt-1 shrink-0" />
            <div>
              <h1 className="text-[28px] sm:text-[36px] md:text-[40px] font-extrabold uppercase tracking-[-0.03em] text-[#151413] leading-none mb-2">
                Shopping Bag
              </h1>
              <p className="text-[12.5px] font-medium text-[#7a7064]">
                {loading
                  ? "Loading your bag..."
                  : `${items.length} item${items.length !== 1 ? "s" : ""} • Review your selections before checkout`}
              </p>
            </div>
          </div>

          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 h-10 px-6 rounded-full bg-white border border-[#d8cec0] hover:border-[#161514] text-[#151413] text-[11.5px] font-bold uppercase tracking-[0.14em] transition-all duration-200 w-fit"
          >
            <span>Continue Shopping</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Main Content */}
        {loading ? (
          <CartSkeleton />
        ) : items.length === 0 ? (
          // Empty State
          <div className="bg-white rounded-[22px] border border-[#e9e1d6] shadow-[0_2px_14px_rgba(32,25,18,0.035)] py-16 px-6 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-[#f6f1ea] border border-[#eae1d5] flex items-center justify-center mx-auto mb-5">
              <ShoppingBag size={26} strokeWidth={1.7} className="text-[#9a7b56]" />
            </div>
            <h2 className="text-xl font-extrabold uppercase tracking-[-0.02em] text-[#151413] mb-2">
              Your bag is empty
            </h2>
            <p className="text-[13.5px] text-[#7a7064] font-medium mb-7 max-w-sm mx-auto leading-relaxed">
              Discover curated apparel essentials and add your favorites to get started.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#161514] hover:bg-[#2c2926] text-white text-[12px] font-bold uppercase tracking-[0.14em] rounded-full transition-all duration-200 shadow-[0_10px_24px_rgba(22,21,20,0.16)] hover:-translate-y-0.5"
            >
              <span>Continue Shopping</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
            {/* Cart Items */}
            <div className="lg:col-span-8 space-y-4 animate-fade-in">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-[#e9e1d6] hover:border-[#d3c5b2] shadow-[0_2px_14px_rgba(32,25,18,0.035)] hover:shadow-[0_10px_28px_rgba(32,25,18,0.065)] p-5 sm:p-6 transition-all duration-250"
                >
                  <div className="flex flex-col sm:flex-row gap-5 sm:gap-6">
                    {/* Image */}
                    <div className="w-24 h-28 sm:w-28 sm:h-32 flex-shrink-0 bg-[#f1ebe3] border border-[#eae2d7] rounded-xl overflow-hidden">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl.startsWith("http") ? item.imageUrl : `http://localhost:5001${item.imageUrl}`}
                          alt={item.name}
                          className="w-full h-full object-cover object-[center_12%]"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag size={22} className="text-[#a89d90]" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[16px] sm:text-[17px] font-bold text-[#151413] tracking-[-0.01em] leading-snug">
                        {item.name}
                      </h3>
                      {item.variantAttributes && Object.entries(item.variantAttributes).filter(([k]) => k !== 'id').length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2.5">
                          {Object.entries(item.variantAttributes)
                            .filter(([k]) => k !== 'id')
                            .map(([k, v]) => {
                              const isColor = k.toLowerCase().includes("col") || (typeof v === 'string' && v.startsWith('#'));
                              return (
                                <span
                                  key={k}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#faf7f2] border border-[#e8dfd1] rounded-lg text-[11px] text-[#5c5145] font-semibold uppercase tracking-[0.06em]"
                                >
                                  {isColor && (
                                    <span
                                      className="w-2.5 h-2.5 rounded-full border border-[#d6ccbf]"
                                      style={{ backgroundColor: getDisplayColor(String(v)) }}
                                    />
                                  )}
                                  <span className="text-[#8d8276]">{k}:</span> {v}
                                </span>
                              );
                            })}
                        </div>
                      )}
                      <p className="text-[18px] font-extrabold text-[#151413] tracking-[-0.015em] mt-3.5">
                        {formatPrice(item.price)}
                        <span className="text-[12px] text-[#8d8276] font-medium ml-1.5">/ unit</span>
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-4">
                      <div className="inline-flex items-center gap-1 bg-[#faf7f2] border border-[#e4dcd0] rounded-full p-1">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-full text-[#5c544b] hover:bg-white hover:text-[#151413] transition-colors cursor-pointer disabled:opacity-40"
                          disabled={item.quantity <= 1}
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} strokeWidth={2.2} />
                        </button>
                        <span className="w-8 text-center text-[13px] font-bold text-[#151413]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item, item.quantity + 1)}
                          className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                            item.quantity >= item.maxStock
                              ? 'text-[#cfc6ba] cursor-not-allowed'
                              : 'text-[#5c544b] hover:bg-white hover:text-[#151413] cursor-pointer'
                          }`}
                          disabled={item.quantity >= item.maxStock}
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} strokeWidth={2.2} />
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => {
                          removeFromCart(item.id);
                          toast.success("Removed from cart");
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#9e2a2b] hover:bg-[#fdf0f0] rounded-full transition-colors cursor-pointer"
                      >
                        <Trash2 size={13.5} />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>

                  {/* Subtotal */}
                  <div className="mt-5 pt-4 border-t border-[#f0e9df] flex items-center justify-between">
                    <span className="text-[11px] uppercase tracking-[0.16em] font-bold text-[#8d8276]">
                      Item Subtotal
                    </span>
                    <span className="text-[16px] font-extrabold text-[#151413]">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-4 lg:sticky lg:top-[124px] animate-fade-in">
              <div className="bg-white rounded-2xl border border-[#e9e1d6] shadow-[0_6px_26px_rgba(32,25,18,0.045)] overflow-hidden">
                <div className="px-6 py-4 bg-[#faf7f2] border-b border-[#efe8de]">
                  <h2 className="text-[14px] font-extrabold uppercase tracking-[0.14em] text-[#151413]">
                    Order Summary
                  </h2>
                </div>

                <div className="p-6">
                  <div className="space-y-3.5 mb-5 pb-5 border-b border-[#f0e9df] text-[13.5px]">
                    <div className="flex justify-between text-[#6c6257] font-medium">
                      <span>Items</span>
                      <span className="font-bold text-[#151413]">
                        {items.length} {items.length === 1 ? "item" : "items"}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#6c6257] font-medium">
                      <span>Subtotal</span>
                      <span className="font-bold text-[#151413]">{formatPrice(total)}</span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#5c544b]">
                        Total
                      </span>
                      <span className="text-[24px] font-extrabold text-[#151413] tracking-[-0.02em]">
                        {formatPrice(total)}
                      </span>
                    </div>
                    <p className="text-[11.5px] text-[#8d8276] font-medium mt-1.5">
                      *Excluding shipping &amp; applied discounts
                    </p>
                  </div>

                  <Button
                    onClick={handleCheckout}
                    className="w-full h-12 rounded-full bg-[#161514] hover:bg-[#2c2926] text-[12px] uppercase tracking-[0.14em] font-bold shadow-[0_10px_24px_rgba(22,21,20,0.16)]"
                  >
                    Proceed to Checkout
                  </Button>

                  <Link
                    to="/"
                    className="mt-3 flex items-center justify-center w-full h-11 rounded-full bg-white border border-[#d8cec0] hover:border-[#161514] text-[11.5px] font-bold uppercase tracking-[0.14em] text-[#151413] transition-colors"
                  >
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
