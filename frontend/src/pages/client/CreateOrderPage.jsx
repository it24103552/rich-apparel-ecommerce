import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  ShoppingBag,
  ChevronRight,
  MapPin,
  Phone,
  Mail,
  Truck,
  ShieldCheck,
  ArrowLeft,
  CreditCard,
  Banknote,
  Building2,
  CheckCircle2,
  Lock
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../hooks/useCart";
import {
  ordersService,
  paymentsService,
  loyaltyService,
  orderDiscountService,
  couponsService
} from "../../services";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { Spinner } from "../../components/common/Spinner";
import { FileUpload } from "../../components/common/FileUpload";
import { formatPrice } from "../../utils/formatters";

export const CreateOrderPage = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { items, total, dispatch } = useCart();

  // States from CreateOrderPage
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // States from CreatePaymentPage
  const [processing, setProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState("card");
  const [proofImage, setProofImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [pointsToUse, setPointsToUse] = useState(0);
  const [userPoints, setUserPoints] = useState(0);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm({
    defaultValues: {
      address: "",
      contactNumber: "",
      contactEmail: user?.email || "",
      deliveryMethod: "standard_delivery",
      cardNumber: "",
      cardHolder: "",
      expiryDate: "",
      cvv: "",
    },
    shouldUnregister: true,
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const [pointsRes, couponsRes] = await Promise.all([
          loyaltyService.getBalance(),
          couponsService.getAvailable()
        ]);
        setUserPoints(pointsRes.data.data.balance || 0);
        setAvailableCoupons(couponsRes.data.data.coupons || []);
      } catch (err) {
        console.error("Failed to fetch user checkout data:", err);
      }
    };

    if (token) {
      fetchUserData();
    }
  }, [token]);

  const orderItems = useMemo(() => {
    return items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
      variantAttributes: item.variantAttributes,
    }));
  }, [items]);

  const handleImageChange = (file) => {
    setProofImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const useMaxPoints = () => {
    const maxPoints = Math.floor(total);
    const usablePoints = Math.min(userPoints, maxPoints);
    setPointsToUse(usablePoints);
  };

  const deliveryMethod = watch("deliveryMethod");
  const shippingFee = useMemo(() => {
    if (deliveryMethod === "express_delivery") return 500;
    if (deliveryMethod === "standard_delivery") return 350;
    return 0;
  }, [deliveryMethod]);

  const couponDiscount = appliedCoupon ? appliedCoupon.couponDiscount : 0;
  const pointsDiscount = pointsToUse * 1;

  const finalTotal = Math.max(0, total + shippingFee - couponDiscount - pointsDiscount);

  const applyCouponLogic = async (codeToApply = couponCode) => {
    if (!codeToApply.trim()) return;
    setApplyingCoupon(true);
    setCouponError("");
    try {
      const res = await couponsService.evaluate({ 
        couponCode: codeToApply, 
        items: orderItems,
        total
      });
      const data = res.data.data;
      toast.success("Coupon verified and applied.");
      setAppliedCoupon({ couponCode: codeToApply, couponDiscount: data.discountAmount, pointsUsed: pointsToUse });
      if (codeToApply !== couponCode) setCouponCode(codeToApply);
    } catch (err) {
      setCouponError(err.response?.data?.message || "Invalid coupon");
      setAppliedCoupon(null);
    } finally {
      setApplyingCoupon(false);
    }
  };

  const onSubmit = async (data) => {
    if (items.length === 0) {
      setError("Your cart is empty");
      return;
    }

    if (selectedMethod === "bank_deposit" && !proofImage) {
      setError("Please upload your deposit slip image");
      toast.error("Please upload your deposit slip image");
      return;
    }

    setProcessing(true);
    setLoading(true);
    setError("");

    try {
      // 1. Create Order
      const orderData = {
        items: orderItems,
        total,
        shippingFee,
        address: data.address,
        contactNumber: data.contactNumber,
        contactEmail: data.contactEmail,
        deliveryMethod: data.deliveryMethod,
        couponCode: appliedCoupon?.couponCode || "",
        pointsUsed: appliedCoupon?.pointsUsed || 0
      };

      const orderRes = await ordersService.create(orderData);
      const order = orderRes.data.data;
      const orderId = order.id;

      // 2. Apply Discounts (if any)
      if (couponCode || pointsToUse > 0) {
        try {
          await orderDiscountService.saveDiscount(orderId, {
            couponCode: couponCode || "",
            pointsUsed: pointsToUse || 0
          });
        } catch (discountErr) {
          console.error("Failed to apply discount:", discountErr);
          // Continue even if discount fails, but maybe log it.
        }
      }

      // 3. Process Payment
      let payload;
      if (selectedMethod === "bank_deposit") {
        payload = new FormData();
        payload.append("orderId", orderId);
        payload.append("amount", finalTotal);
        payload.append("method", selectedMethod);
        payload.append("status", "pending");
        if (proofImage) payload.append("proofImage", proofImage);
      } else {
        payload = {
          orderId: orderId,
          amount: finalTotal,
          method: selectedMethod,
          status: selectedMethod === "card" ? "paid" : "pending",
        };
      }

      await paymentsService.create(payload);

      // 4. Cleanup
      dispatch({ type: "CART_CLEAR" });
      toast.success("Order and payment processed successfully!");
      navigate("/orders", { state: { success: true } });

    } catch (err) {
      const message = err.response?.data?.message || "Failed to finalize order";
      setError(message);
      toast.error(message);
    } finally {
      setProcessing(false);
      setLoading(false);
    }
  };


  const getImageUrl = (imagePath) => {
    if (!imagePath) return "/placeholder.png";
    if (imagePath.startsWith("http")) return imagePath;
    const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
    return `http://localhost:5001${cleanPath}`;
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6 max-w-sm">
          <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-neutral-100">
            <ShoppingBag size={32} className="text-neutral-300" />
          </div>
          <h2 className="text-2xl font-bold tracking-tighter uppercase">Sign In Required</h2>
          <p className="text-neutral-500 text-sm font-medium">Please login to securely complete your purchase.</p>
          <Button variant="dark" className="w-full py-4 tracking-widest uppercase text-[11px]" onClick={() => navigate("/login")}>Login to Checkout</Button>
        </motion.div>
      </div>
    );
  }

  if (items.length === 0 && !processing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6 max-w-sm">
          <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-neutral-100">
            <ShoppingBag size={32} className="text-neutral-300" />
          </div>
          <h2 className="text-2xl font-bold tracking-tighter uppercase">Your Bag is Empty</h2>
          <p className="text-neutral-500 text-sm font-medium">Looks like you haven't added anything to your cart yet.</p>
          <Button variant="dark" className="w-full py-4 tracking-widest uppercase text-[11px]" onClick={() => navigate("/")}>Discover Products</Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] relative overflow-x-clip selection:bg-black selection:text-white" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      {/* Subtle Warm Ambient Accents */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#f5efe6] rounded-full blur-[120px] opacity-80"></div>
        <div className="absolute bottom-0 right-0 w-[420px] h-[420px] bg-[#f5efe6] rounded-full blur-[140px] opacity-70"></div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 md:px-[8%] pt-8 md:pt-12 pb-12 md:pb-24 relative z-10">

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10 md:mb-12 pb-8 border-b border-neutral-200/70"
        >
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-black transition-colors mb-6 group cursor-pointer"
          >
            <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" />
            Back to Shop
          </button>
          <div className="flex items-start gap-4">
            <div className="w-1.5 h-10 md:h-12 bg-black rounded-full mt-1 shrink-0" />
            <div>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tighter uppercase text-black leading-none">
                Checkout
              </h1>
              <p className="text-neutral-400 text-[11px] font-bold uppercase tracking-[0.25em] mt-2">
                Shipping, payment & order confirmation
              </p>
            </div>
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-700 px-6 py-4 rounded-2xl mb-10 text-[11px] font-semibold uppercase tracking-wider overflow-hidden"
          >
            {error}
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 xl:gap-20 items-start">

          {/* Left Column: Shipping & Payment */}
          <div className="lg:col-span-7 space-y-8">

            {/* Step 1: Shipping (Premium Refresh) */}
            <motion.section
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative group lg:hover:translate-x-1 transition-transform duration-500"
            >
              {/* Decorative Accent Shape */}
              <div className="absolute -left-6 top-10 w-12 h-24 bg-black/[0.03] rounded-3xl blur-2xl -z-10 group-hover:bg-black/[0.05] transition-colors"></div>

              <div className="bg-white/80 backdrop-blur-xl border border-neutral-100/50 rounded-[32px] p-7 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.02)] hover:shadow-[0_30px_70px_rgba(0,0,0,0.04)] transition-all duration-500">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center font-black text-[10px] rotate-3 group-hover:rotate-0 transition-transform duration-500">01</div>
                  <h2 className="text-lg font-bold uppercase tracking-tighter text-black">Shipping</h2>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} id="checkout-form" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Phone"
                      placeholder="0772345678"
                      {...register("contactNumber", {
                        required: "Required",
                        pattern: {
                          value: /^\d{10}$/,
                          message: "Phone must be exactly 10 digits (e.g., 0771234567)"
                        }
                      })}
                      onInput={(e) => {
                        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
                      }}
                      error={errors.contactNumber?.message}
                      className="bg-white"
                    />
                    <Input
                      label="Email"
                      type="email"
                      placeholder="your@email.com"
                      {...register("contactEmail", { required: "Required" })}
                      error={errors.contactEmail?.message}
                      className="bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-black mb-3 uppercase tracking-widest ml-1">
                      Address <span className="text-neutral-400 font-normal lowercase tracking-wide">(min 10 characters)</span>
                    </label>
                    <textarea
                      {...register("address", { 
                        required: "Address is required",
                        minLength: { value: 10, message: "Address must be at least 10 characters" }
                      })}
                      rows={3}
                      className={`w-full px-5 py-4 bg-white border ${errors.address ? 'border-red-300 ring-4 ring-red-50' : 'border-neutral-100'} rounded-2xl transition-all outline-none text-[13px] font-medium focus:ring-4 focus:ring-black/5 focus:border-black resize-none`}
                      placeholder="House number, street name, city..."
                    />
                    {errors.address && <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider ml-1 mt-1">{errors.address.message}</p>}
                  </div>

                  <div className="relative group">
                    <label className="block text-[11px] font-bold text-black mb-3 uppercase tracking-widest ml-1">
                      Delivery Method
                    </label>
                    <select
                      {...register("deliveryMethod", { required: "Required" })}
                      className="w-full px-5 py-4 bg-white border border-neutral-100 rounded-2xl outline-none text-[13px] font-medium appearance-none cursor-pointer focus:ring-4 focus:ring-black/5 focus:border-black"
                    >
                      <option value="standard_delivery">Standard (3-5 Days)</option>
                      <option value="express_delivery">Express (Next Day)</option>
                      <option value="pickup">Self-Pickup</option>
                    </select>
                  </div>
                </form>
              </div>
            </motion.section>

            {/* Step 2: Payment Details (Premium Refresh) */}
            <motion.section
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mt-12 relative group lg:hover:translate-x-1 transition-transform duration-500"
            >
              <div className="absolute -right-6 top-20 w-16 h-32 bg-black/[0.02] rounded-full blur-3xl -z-10 group-hover:bg-black/[0.04] transition-colors"></div>

              <div className="bg-white/80 backdrop-blur-xl border border-neutral-100/50 rounded-[32px] p-7 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.02)] hover:shadow-[0_30px_70px_rgba(0,0,0,0.04)] transition-all duration-500">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center font-black text-[10px] -rotate-3 group-hover:rotate-0 transition-transform duration-500">02</div>
                  <h2 className="text-lg font-bold uppercase tracking-tighter text-black">Payment Method</h2>
                </div>

                {/* Payment Selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  {[
                    { id: 'card', icon: CreditCard, label: 'Card' },
                    { id: 'bank_deposit', icon: Building2, label: 'Bank' },
                    { id: 'cash_on_delivery', icon: Banknote, label: 'Cash' }
                  ].map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setSelectedMethod(method.id)}
                      className={`flex flex-col items-center justify-center p-5 rounded-2xl border transition-all duration-300 gap-2 group ${selectedMethod === method.id
                        ? 'border-black bg-black text-white shadow-lg'
                        : 'border-neutral-100 hover:border-neutral-200 bg-white text-neutral-400'
                        }`}
                    >
                      <method.icon size={18} className={selectedMethod === method.id ? 'text-white' : 'text-neutral-400 group-hover:text-black'} />
                      <span className={`text-[9px] font-semibold uppercase tracking-widest transition-colors
 ${selectedMethod === method.id ? 'text-white' : 'text-neutral-400 group-hover:text-black'}`}>
                        {method.label}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Dynamic Payment Form */}
                <AnimatePresence mode="wait">
                  {selectedMethod === "card" && (
                    <motion.div
                      key="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-neutral-100 text-[10px] uppercase tracking-widest text-neutral-400 mb-6">
                        <Lock size={14} className="text-black" />
                        Encrypted 256-bit Secure Transaction
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-black ml-1">Card Number</label>
                          <input
                            {...register("cardNumber", {
                              required: selectedMethod === "card" ? "Required" : false,
                              pattern: {
                                value: /^[\d\s]{19}$/,
                                message: "Invalid card number"
                              }
                            })}
                            onInput={(e) => {
                              e.target.value = e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19);
                            }}
                            placeholder="0000 0000 0000 0000"
                            className={`w-full px-5 py-4 bg-white border ${errors.cardNumber ? 'border-red-300 ring-red-50' : 'border-neutral-100'} rounded-2xl focus:border-black outline-none font-mono tracking-widest text-black placeholder:text-neutral-400 transition-all`}
                          />
                          {errors.cardNumber && <p className="text-red-500 text-[9px] font-bold uppercase tracking-wider ml-1">{errors.cardNumber.message}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-black ml-1">Expiry</label>
                            <input
                              {...register("expiryDate", {
                                required: selectedMethod === "card" ? "Required" : false,
                                pattern: {
                                  value: /^(0[1-9]|1[0-2]) \/ \d{2}$/,
                                  message: "MM / YY"
                                }
                              })}
                              onInput={(e) => {
                                let v = e.target.value.replace(/\D/g, '');
                                if (v.length >= 2) {
                                  e.target.value = v.slice(0, 2) + " / " + v.slice(2, 4);
                                } else {
                                  e.target.value = v;
                                }
                              }}
                              placeholder="MM / YY"
                              className={`w-full px-5 py-4 bg-white border ${errors.expiryDate ? 'border-red-300 ring-red-50' : 'border-neutral-100'} rounded-2xl focus:border-black outline-none font-mono text-center text-black placeholder:text-neutral-400`}
                            />
                            {errors.expiryDate && <p className="text-red-500 text-[9px] font-bold uppercase tracking-wider text-center">{errors.expiryDate.message}</p>}
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-black ml-1">CVV</label>
                            <input
                              {...register("cvv", {
                                required: selectedMethod === "card" ? "Required" : false,
                                pattern: {
                                  value: /^\d{3}$/,
                                  message: "3 Digits"
                                }
                              })}
                              onInput={(e) => {
                                e.target.value = e.target.value.replace(/\D/g, '').slice(0, 3);
                              }}
                              placeholder="•••"
                              type="password"
                              className={`w-full px-5 py-4 bg-white border ${errors.cvv ? 'border-red-300 ring-red-50' : 'border-neutral-100'} rounded-2xl focus:border-black outline-none font-mono text-center text-black placeholder:text-neutral-400`}
                            />
                            {errors.cvv && <p className="text-red-500 text-[9px] font-bold uppercase tracking-wider text-center">{errors.cvv.message}</p>}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {selectedMethod === "bank_deposit" && (
                    <motion.div
                      key="bank" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                      className="space-y-6"
                    >
                      <div className="bg-white rounded-2xl p-6 border border-neutral-100 text-[11px] space-y-3">
                        <p className="flex justify-between"><span className="text-neutral-400 uppercase tracking-widest">Bank:</span> <span className="font-bold uppercase tracking-tighter">Rich Apparel Trust Bank</span></p>
                        <p className="flex justify-between"><span className="text-neutral-400 uppercase tracking-widest">A/C:</span> <span className="font-mono font-bold">0123 4567 8910</span></p>
                      </div>
                      <FileUpload
                        accept="image/*"
                        onChange={handleImageChange}
                        preview={imagePreview}
                      />
                    </motion.div>
                  )}

                  {selectedMethod === "cash_on_delivery" && (
                    <motion.div
                      key="cod" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="text-center py-6"
                    >
                      <div className="w-16 h-16 bg-white border border-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <Banknote size={30} className="text-black" />
                      </div>
                      <p className="text-[11px] font-bold text-neutral-400 leading-relaxed max-w-[240px] mx-auto uppercase tracking-widest">
                        Pay the full amount upon delivery at your doorstep.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.section>

          </div>

          {/* Right Column: Summary (The Black Box now) */}
          <div className="lg:col-span-5 lg:sticky lg:top-28 h-fit z-10">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-black text-white rounded-[40px] p-8 md:p-12 shadow-[0_40px_100px_rgba(0,0,0,0.3)] relative overflow-hidden"
            >
              {/* Subtle background flair */}
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-10">
                  <h2 className="text-2xl font-bold uppercase tracking-tighter">Summary</h2>
                  <span className="px-3 py-1 bg-white text-black text-[9px] font-black rounded-full tracking-widest uppercase">
                    {items.length} {items.length === 1 ? 'Unit' : 'Units'}
                  </span>
                </div>

                <div className="space-y-6 mb-12 pr-2 max-h-[350px] overflow-y-auto custom-scrollbar-dark">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-6 items-center group">
                      <div className="w-16 h-20 shrink-0 bg-white/10 rounded-xl border border-white/10 overflow-hidden p-1">
                        <img src={getImageUrl(item.imageUrl)} className="w-full h-full object-cover rounded-lg" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-[13px] font-bold uppercase tracking-tight line-clamp-1">{item.name}</p>
                        <p className="text-[10px] text-white/40 uppercase tracking-[0.2em]">
                          {item.variantAttributes?.size && `Size ${item.variantAttributes.size}`} · Qty {item.quantity}
                        </p>
                        <p className="text-[13px] font-bold text-white/80">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Rewards & Loyalty (Integrated) */}
                <div className="mt-10 pt-10 border-t border-white/10 space-y-6">
                  <div className="flex items-center gap-3">
                    <ShieldCheck size={18} className="text-white/60" />
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">Rewards & Loyalty</h3>
                  </div>

                  <div className="space-y-4">
                    {/* Coupon */}
                    <div className="relative group">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="PROMO CODE"
                        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none uppercase text-xs font-semibold tracking-[0.3em] focus:border-white/30 focus:bg-white/10 transition-all text-white placeholder:text-white/20"
                      />
                      <button
                        type="button"
                        onClick={applyCouponLogic}
                        disabled={applyingCoupon}
                        className="absolute right-2 top-2 bottom-2 px-4 bg-white text-black text-[10px] font-black uppercase rounded-xl hover:bg-neutral-200 transition-colors disabled:opacity-50"
                      >
                        Apply
                      </button>
                    </div>
                    
                    {/* Available Coupons Quick Select */}
                    {availableCoupons.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {availableCoupons.map((coupon) => (
                          <button
                            key={coupon.id}
                            type="button"
                            onClick={() => applyCouponLogic(coupon.code)}
                            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/5 rounded-lg text-white text-[10px] font-bold tracking-widest uppercase transition-colors"
                          >
                            Use {coupon.code}
                          </button>
                        ))}
                      </div>
                    )}

                    {couponError && <p className="text-red-400 text-[9px] font-bold uppercase tracking-wider ml-1">{couponError}</p>}


                    {/* Loyalty */}
                    <div className="p-5 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                        <span className="text-white/40">Balance: {userPoints} Pts</span>
                        <button type="button" onClick={useMaxPoints} className="text-white underline hover:no-underline transition-all opacity-60 hover:opacity-100">Use Max</button>
                      </div>
                      <input
                        type="number"
                        value={pointsToUse}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value) || 0);
                          const maxUsable = Math.min(userPoints, Math.floor(total));
                          setPointsToUse(Math.min(val, maxUsable));
                        }}
                        placeholder="POINTS TO REDEEM"
                        className="w-full bg-transparent border-none p-0 outline-none text-xl font-black tracking-tighter text-white placeholder:text-white/10"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-8 border-t border-white/10">
                  <div className="flex justify-between text-[11px] font-bold text-white/40 uppercase tracking-widest">
                    <span>Subtotal</span>
                    <span className="text-white">{formatPrice(total)}</span>
                  </div>

                  <div className="flex justify-between text-[11px] font-bold text-white/40 uppercase tracking-widest">
                    <span>Delivery</span>
                    <span className="text-white">{shippingFee > 0 ? formatPrice(shippingFee) : "FREE"}</span>
                  </div>

                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-[11px] font-bold text-green-400 uppercase tracking-widest">
                      <span>Coupon Discount</span>
                      <span>-{formatPrice(couponDiscount)}</span>
                    </div>
                  )}

                  {pointsDiscount > 0 && (
                    <div className="flex justify-between text-[11px] font-bold text-green-400 uppercase tracking-widest">
                      <span>Loyalty Discount</span>
                      <span>-{formatPrice(pointsDiscount)}</span>
                    </div>
                  )}

                  <div className="pt-8 flex flex-col gap-1">
                    <p className="text-[48px] font-bold tracking-tighter text-white leading-none">
                      {formatPrice(finalTotal)}
                    </p>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] ml-1">Total inclusive of taxes</p>
                  </div>

                  <Button
                    type="submit"
                    form="checkout-form"
                    variant="white"
                    className="w-full h-18 text-[12px] font-black uppercase tracking-[0.3em] mt-10 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer"
                    loading={processing}
                    onClick={handleSubmit(onSubmit)}
                  >
                    Complete Order
                  </Button>

                  <div className="mt-8 flex items-center justify-center gap-4 text-white/20">
                    <div className="h-[1px] flex-1 bg-white/10"></div>
                    <ShieldCheck size={16} />
                    <div className="h-[1px] flex-1 bg-white/10"></div>
                  </div>

                  <p className="text-center text-[9px] text-white/30 font-medium mt-6 leading-relaxed uppercase tracking-widest max-w-[240px] mx-auto">
                    Secure encrypted checkout handled by<br /> Rich Apparel payment systems.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
};
