import { Navigate, Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../hooks/useCart";
import { Button } from "../../components/common/Button";
import { Spinner } from "../../components/common/Spinner";
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

  if (loading) {
    return <Spinner fullPage />;
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
    <div className="bg-[#fafafa] min-h-screen selection:bg-black selection:text-white" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      <div className="max-w-[1320px] mx-auto px-[5%] lg:px-[6%] pt-8 md:pt-12 pb-20">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2.5 mb-8 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
          <Link to="/" className="hover:text-black transition-colors">Home</Link>
          <ChevronRight size={10} />
          <span className="text-black">Shopping Bag</span>
        </nav>

        {/* Header */}
        <div className="flex items-start gap-4 pb-8 mb-10 border-b border-neutral-200/70 animate-fade-in">
          <div className="w-1.5 h-10 md:h-12 bg-black rounded-full mt-1 shrink-0" />
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold uppercase tracking-tighter text-black leading-none mb-2">
              Shopping Bag
            </h1>
            <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-[0.25em]">
              {items.length} item{items.length !== 1 ? "s" : ""} • Review before checkout
            </p>
          </div>
        </div>

        {/* Main Content */}
        {items.length === 0 ? (
          // Empty State
          <div className="bg-white rounded-2xl border border-neutral-100/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-16 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-[#f5efe6] border border-[#e8dfd1] flex items-center justify-center mx-auto mb-5">
              <ShoppingBag size={28} className="text-[#8a6d43]" />
            </div>
            <h2 className="text-lg font-bold uppercase tracking-tight text-black mb-2">Your bag is empty</h2>
            <p className="text-xs text-neutral-400 font-medium mb-7 max-w-sm mx-auto">
              Discover curated apparel essentials and add your favorites to get started.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-black hover:bg-neutral-800 text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-full transition-all duration-300 shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:-translate-y-0.5"
            >
              Continue Shopping <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Cart Items */}
            <div className="lg:col-span-8 space-y-4 animate-fade-in">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-neutral-100/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)] p-6 transition-all duration-300"
                >
                  <div className="flex flex-col sm:flex-row gap-6">
                    {/* Image */}
                    <div className="w-24 h-28 flex-shrink-0 bg-[#f5efe6]/60 border border-[#e8dfd1] rounded-xl overflow-hidden">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl.startsWith("http") ? item.imageUrl : `http://localhost:5001${item.imageUrl}`}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag size={20} className="text-neutral-400" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-black tracking-tight">{item.name}</h3>
                      {item.variantAttributes && Object.entries(item.variantAttributes).filter(([k]) => k !== 'id').length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {Object.entries(item.variantAttributes)
                            .filter(([k]) => k !== 'id')
                            .map(([k, v]) => (
                              <span
                                key={k}
                                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#faf8f5] border border-[#e8dfd1] rounded-md text-[10px] text-[#5c4d3c] font-bold uppercase tracking-wider"
                              >
                                {typeof v === 'string' && v.startsWith('#') && (
                                  <span
                                    className="w-2.5 h-2.5 rounded-full border border-neutral-300"
                                    style={{ backgroundColor: getDisplayColor(v) }}
                                  />
                                )}
                                {k}: {v}
                              </span>
                            ))}
                        </div>
                      )}
                      <p className="text-xl font-bold text-black mt-3">
                        {formatPrice(item.price)}
                        <span className="text-xs text-neutral-400 font-medium ml-1">/ unit</span>
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-4">
                      <div className="flex items-center gap-1 bg-[#faf8f5] border border-[#e8dfd1] rounded-xl p-1">
                        <button
                          onClick={() => handleQuantityChange(item, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                          disabled={item.quantity <= 1}
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center text-sm font-bold text-black">{item.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(item, item.quantity + 1)}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${item.quantity >= item.maxStock ? 'text-neutral-300 cursor-not-allowed' : 'hover:bg-white cursor-pointer'}`}
                          disabled={item.quantity >= item.maxStock}
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => {
                          removeFromCart(item.id);
                          toast.success("Removed from cart");
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                      >
                        <Trash2 size={14} />
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* Subtotal */}
                  <div className="mt-5 pt-4 border-t border-neutral-100 flex items-center justify-between text-xs">
                    <span className="uppercase tracking-[0.18em] font-bold text-neutral-400">Item Subtotal</span>
                    <span className="text-base font-bold text-black">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-4 lg:sticky lg:top-28 animate-fade-in">
              <div className="bg-white rounded-2xl border border-neutral-100/80 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-7">
                <h2 className="text-lg font-bold uppercase tracking-tight text-black mb-6 pb-4 border-b border-neutral-100">
                  Order Summary
                </h2>

                <div className="space-y-3.5 mb-6 pb-6 border-b border-neutral-100 text-sm">
                  <div className="flex justify-between text-neutral-500">
                    <span>Items</span>
                    <span className="font-bold text-black">
                      {items.length} {items.length === 1 ? "item" : "items"}
                    </span>
                  </div>
                  <div className="flex justify-between text-neutral-500">
                    <span>Subtotal</span>
                    <span className="font-bold text-black">{formatPrice(total)}</span>
                  </div>
                </div>

                <div className="mb-7">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">Total</span>
                    <span className="text-2xl font-bold text-black tracking-tight">{formatPrice(total)}</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1.5">*Excluding shipping & applied discounts</p>
                </div>

                <Button
                  onClick={handleCheckout}
                  className="w-full py-3.5 rounded-full text-[11px] uppercase tracking-[0.2em] font-bold"
                >
                  Proceed to Checkout
                </Button>

                <Link
                  to="/"
                  className="block text-center mt-4 text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 hover:text-black transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
