import { Navigate, Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../hooks/useCart";
import { Button } from "../../components/common/Button";
import { Spinner } from "../../components/common/Spinner";
import { formatPrice } from "../../utils/formatters";
import { Trash2, Plus, Minus, ShoppingCart } from "lucide-react";

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
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 animate-fade-in">
          <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
            <ShoppingCart size={40} />
            Shopping Cart
          </h1>
          <p className="text-gray-600 mt-2">Review your items before checkout</p>
        </div>

        {/* Main Content */}
        {items.length === 0 ? (
          // Empty State
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
              <ShoppingCart size={40} className="text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">Add some products to get started!</p>
            <Link
              to="/"
              className="inline-block px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-xl transition-all duration-200 transform hover:-translate-y-0.5"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4 animate-fade-in">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg p-6 transition-all duration-200"
                >
                  <div className="flex gap-6">
                    {/* Image */}
                    <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden">
                      {item.imageUrl ? (
                        <img
                          src={`http://localhost:5001${item.imageUrl}`}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingCart size={20} className="text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                      {item.variantAttributes && Object.entries(item.variantAttributes).filter(([k]) => k !== 'id').length > 0 && (
                        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-1">
                          {Object.entries(item.variantAttributes)
                            .filter(([k]) => k !== 'id')
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(' · ')}
                        </p>
                      )}
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {formatPrice(item.price)}
                        <span className="text-sm text-gray-600 font-normal">/unit</span>
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex flex-col items-end gap-4">
                      <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-2">
                        <button
                          onClick={() => handleQuantityChange(item, item.quantity - 1)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors cursor-pointer"
                          disabled={item.quantity <= 1}
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(item, item.quantity + 1)}
                          className={`p-1 rounded transition-colors ${item.quantity >= item.maxStock ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-200 cursor-pointer'}`}
                          disabled={item.quantity >= item.maxStock}
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => {
                          removeFromCart(item.id);
                          toast.success("Removed from cart");
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors font-medium cursor-pointer"
                      >
                        <Trash2 size={16} />
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* Subtotal */}
                  <div className="mt-4 pt-4 border-t border-gray-100 text-right">
                    <p className="text-gray-600">
                      Subtotal: <span className="font-bold text-gray-900">{formatPrice(item.price * item.quantity)}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1 animate-fade-in">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 sticky top-24">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>

                <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
                  <div className="flex justify-between text-gray-600">
                    <span>Item Count:</span>
                    <span className="font-medium text-gray-900">
                      {items.length} {items.length === 1 ? "item" : "items"}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span className="font-medium text-gray-900">{formatPrice(total)}</span>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xl font-semibold text-gray-900">Total:</span>
                    <span className="text-3xl font-bold text-gray-900">{formatPrice(total)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">*Excluding shipping & taxes</p>
                </div>

                <Button
                  onClick={handleCheckout}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 rounded-xl transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  Proceed to Checkout
                </Button>

                <Link
                  to="/"
                  className="block text-center mt-4 text-gray-600 hover:text-gray-900 font-medium transition-colors"
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
