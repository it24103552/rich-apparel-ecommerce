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
      <div
        className="min-h-[70vh] flex items-center justify-center bg-[#faf8f5] py-12 px-4"
        style={{ fontFamily: "'Montserrat', sans-serif" }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-white border border-[#e9e1d6] rounded-[22px] shadow-[0_6px_24px_rgba(32,25,18,0.045)] p-10 space-y-5 max-w-sm w-full"
        >
          <div className="w-16 h-16 bg-[#f6f1ea] rounded-2xl flex items-center justify-center mx-auto border border-[#eae1d5]">
            <ShoppingBag size={26} strokeWidth={1.7} className="text-[#9a7b56]" />
          </div>
          <h2 className="text-xl font-extrabold tracking-[-0.02em] uppercase text-[#151413]">
            Sign In Required
          </h2>
          <p className="text-[#6c6257] text-[13.5px] font-medium leading-relaxed">
            Please login to securely complete your purchase.
          </p>
          <Button
            variant="dark"
            className="w-full h-12 rounded-full bg-[#161514] hover:bg-[#2c2926] tracking-[0.14em] uppercase text-[12px]"
            onClick={() => navigate("/login")}
          >
            Login to Checkout
          </Button>
        </motion.div>
      </div>
    );
  }

  if (items.length === 0 && !processing) {
    return (
      <div
        className="min-h-[70vh] flex items-center justify-center bg-[#faf8f5] py-12 px-4"
        style={{ fontFamily: "'Montserrat', sans-serif" }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-white border border-[#e9e1d6] rounded-[22px] shadow-[0_6px_24px_rgba(32,25,18,0.045)] p-10 space-y-5 max-w-sm w-full"
        >
          <div className="w-16 h-16 bg-[#f6f1ea] rounded-2xl flex items-center justify-center mx-auto border border-[#eae1d5]">
            <ShoppingBag size={26} strokeWidth={1.7} className="text-[#9a7b56]" />
          </div>
          <h2 className="text-xl font-extrabold tracking-[-0.02em] uppercase text-[#151413]">
            Your Bag is Empty
          </h2>
          <p className="text-[#6c6257] text-[13.5px] font-medium leading-relaxed">
            Looks like you haven&apos;t added anything to your cart yet.
          </p>
          <Button
            variant="dark"
            className="w-full h-12 rounded-full bg-[#161514] hover:bg-[#2c2926] tracking-[0.14em] uppercase text-[12px]"
            onClick={() => navigate("/")}
          >
            Discover Products
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#faf8f5] relative overflow-x-clip selection:bg-[#161514] selection:text-white"
      style={{ fontFamily: "'Montserrat', sans-serif" }}
    >
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-10 pb-20 relative z-10">

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-8 md:mb-10 pb-7 border-b border-[#e8e0d5]"
        >
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-full bg-white border border-[#dfd6ca] text-[#5c544b] hover:border-[#161514] hover:text-[#151413] text-[11px] font-bold uppercase tracking-[0.14em] transition-all mb-5 group cursor-pointer"
          >
            <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Shop</span>
          </button>

          <div className="flex items-start gap-3.5">
            <div className="w-1 h-9 sm:h-11 bg-[#9a7b56] rounded-full mt-1 shrink-0" />
            <div>
              <h1 className="text-[28px] sm:text-[36px] md:text-[40px] font-extrabold tracking-[-0.03em] uppercase text-[#151413] leading-none mb-2">
                Checkout
              </h1>
              <p className="text-[#7a7064] text-[12.5px] font-medium">
                Shipping details, payment method &amp; order confirmation
              </p>
            </div>
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-[#fdf0f0] border border-[#f0c7c7] text-[#9e2a2b] px-5 py-3.5 rounded-2xl mb-7 text-[12.5px] font-semibold overflow-hidden"
          >
            {error}
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 xl:gap-10 items-start">

          {/* Left Column: Shipping & Payment */}
          <div className="lg:col-span-7 space-y-6">

            {/* Step 1: Shipping */}
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.05 }}
              className="bg-white border border-[#e9e1d6] rounded-2xl shadow-[0_2px_14px_rgba(32,25,18,0.035)] overflow-hidden"
            >
              <div className="px-6 sm:px-7 py-4 bg-[#faf7f2] border-b border-[#efe8de] flex items-center gap-3.5">
                <span className="w-7 h-7 rounded-full bg-[#161514] text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                  01
                </span>
                <div>
                  <h2 className="text-[14px] font-extrabold uppercase tracking-[0.14em] text-[#151413]">
                    Shipping Details
                  </h2>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} id="checkout-form" className="p-6 sm:p-7 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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

                <div>
                  <label className="block text-[10.5px] font-bold text-[#5c544b] mb-2 uppercase tracking-[0.16em] ml-0.5">
                    Delivery Address <span className="text-[#8d8276] font-medium normal-case tracking-normal">(min 10 characters)</span>
                  </label>
                  <textarea
                    {...register("address", {
                      required: "Address is required",
                      minLength: { value: 10, message: "Address must be at least 10 characters" }
                    })}
                    rows={3}
                    className={`w-full px-4 py-3.5 bg-white border ${
                      errors.address
                        ? 'border-[#d65c5c] ring-4 ring-[#fdf0f0]'
                        : 'border-[#E4DED6] hover:border-[#D6CDBF] focus:border-[#C9A77A] focus:ring-4 focus:ring-[#C9A77A]/15'
                    } rounded-[14px] transition-all outline-none text-[13.5px] font-medium text-[#151413] placeholder:text-[#9d978f] resize-none`}
                    placeholder="House number, street name, city..."
                  />
                  {errors.address && (
                    <p className="text-[11px] text-[#b43232] font-semibold ml-0.5 mt-1.5">
                      {errors.address.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[10.5px] font-bold text-[#5c544b] mb-2 uppercase tracking-[0.16em] ml-0.5">
                    Delivery Method
                  </label>
                  <select
                    {...register("deliveryMethod", { required: "Required" })}
                    className="w-full h-[52px] px-4 bg-white border border-[#E4DED6] hover:border-[#D6CDBF] focus:border-[#C9A77A] focus:ring-4 focus:ring-[#C9A77A]/15 rounded-[14px] outline-none text-[13.5px] font-semibold text-[#151413] cursor-pointer transition-all"
                  >
                    <option value="standard_delivery">Standard Delivery (3-5 Days) — LKR 350.00</option>
                    <option value="express_delivery">Express Delivery (Next Day) — LKR 500.00</option>
                    <option value="pickup">Self-Pickup — Free</option>
                  </select>
                </div>
              </form>
            </motion.section>

            {/* Step 2: Payment Details */}
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.12 }}
              className="bg-white border border-[#e9e1d6] rounded-2xl shadow-[0_2px_14px_rgba(32,25,18,0.035)] overflow-hidden"
            >
              <div className="px-6 sm:px-7 py-4 bg-[#faf7f2] border-b border-[#efe8de] flex items-center gap-3.5">
                <span className="w-7 h-7 rounded-full bg-[#161514] text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                  02
                </span>
                <h2 className="text-[14px] font-extrabold uppercase tracking-[0.14em] text-[#151413]">
                  Payment Method
                </h2>
              </div>

              <div className="p-6 sm:p-7">
                {/* Payment Selectors */}
                <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
                  {[
                    { id: 'card', icon: CreditCard, label: 'Card' },
                    { id: 'bank_deposit', icon: Building2, label: 'Bank' },
                    { id: 'cash_on_delivery', icon: Banknote, label: 'Cash' }
                  ].map((method) => {
                    const isSelected = selectedMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setSelectedMethod(method.id)}
                        className={`flex flex-col items-center justify-center py-4 px-3 rounded-2xl border transition-all duration-200 gap-2 cursor-pointer ${
                          isSelected
                            ? 'border-[#161514] bg-[#161514] text-white shadow-[0_8px_20px_rgba(22,21,20,0.14)]'
                            : 'border-[#e6ddd0] bg-[#faf7f2] text-[#5c544b] hover:border-[#b89f80] hover:bg-white hover:text-[#151413]'
                        }`}
                      >
                        <method.icon
                          size={19}
                          strokeWidth={1.85}
                          className={isSelected ? 'text-[#d8c4a6]' : 'text-[#8d8276]'}
                        />
                        <span className="text-[11px] font-bold uppercase tracking-[0.14em]">
                          {method.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Dynamic Payment Form */}
                <AnimatePresence mode="wait">
                  {selectedMethod === "card" && (
                    <motion.div
                      key="card"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="space-y-5"
                    >
                      <div className="flex items-center gap-2.5 px-4 py-3 bg-[#faf7f2] rounded-xl border border-[#ebe3d8] text-[11.5px] font-semibold text-[#5c544b]">
                        <Lock size={14} className="text-[#9a7b56] shrink-0" />
                        <span>Encrypted 256-bit Secure Transaction</span>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#5c544b] mb-2 ml-0.5">
                            Card Number
                          </label>
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
                            className={`w-full h-[52px] px-4 bg-white border ${
                              errors.cardNumber
                                ? 'border-[#d65c5c] ring-4 ring-[#fdf0f0]'
                                : 'border-[#E4DED6] hover:border-[#D6CDBF] focus:border-[#C9A77A] focus:ring-4 focus:ring-[#C9A77A]/15'
                            } rounded-[14px] outline-none font-mono tracking-widest text-[14px] text-[#151413] placeholder:text-[#9d978f] transition-all`}
                          />
                          {errors.cardNumber && (
                            <p className="text-[#b43232] text-[11px] font-semibold mt-1.5 ml-0.5">
                              {errors.cardNumber.message}
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#5c544b] mb-2 ml-0.5">
                              Expiry
                            </label>
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
                              className={`w-full h-[52px] px-4 bg-white border ${
                                errors.expiryDate
                                  ? 'border-[#d65c5c] ring-4 ring-[#fdf0f0]'
                                  : 'border-[#E4DED6] hover:border-[#D6CDBF] focus:border-[#C9A77A] focus:ring-4 focus:ring-[#C9A77A]/15'
                              } rounded-[14px] outline-none font-mono text-center text-[14px] text-[#151413] placeholder:text-[#9d978f] transition-all`}
                            />
                            {errors.expiryDate && (
                              <p className="text-[#b43232] text-[11px] font-semibold text-center mt-1.5">
                                {errors.expiryDate.message}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#5c544b] mb-2 ml-0.5">
                              CVV
                            </label>
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
                              className={`w-full h-[52px] px-4 bg-white border ${
                                errors.cvv
                                  ? 'border-[#d65c5c] ring-4 ring-[#fdf0f0]'
                                  : 'border-[#E4DED6] hover:border-[#D6CDBF] focus:border-[#C9A77A] focus:ring-4 focus:ring-[#C9A77A]/15'
                              } rounded-[14px] outline-none font-mono text-center text-[14px] text-[#151413] placeholder:text-[#9d978f] transition-all`}
                            />
                            {errors.cvv && (
                              <p className="text-[#b43232] text-[11px] font-semibold text-center mt-1.5">
                                {errors.cvv.message}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {selectedMethod === "bank_deposit" && (
                    <motion.div
                      key="bank"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="space-y-5"
                    >
                      <div className="bg-[#faf7f2] rounded-2xl p-5 border border-[#ebe3d8] text-[13px] space-y-2.5">
                        <p className="flex justify-between items-center gap-4">
                          <span className="text-[#8d8276] text-[11px] font-bold uppercase tracking-[0.14em]">Bank</span>
                          <span className="font-bold text-[#151413]">Rich Apparel Trust Bank</span>
                        </p>
                        <p className="flex justify-between items-center gap-4">
                          <span className="text-[#8d8276] text-[11px] font-bold uppercase tracking-[0.14em]">Account No</span>
                          <span className="font-mono font-bold text-[#151413]">0123 4567 8910</span>
                        </p>
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
                      key="cod"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-7 px-5 rounded-2xl bg-[#faf7f2] border border-[#ebe3d8]"
                    >
                      <div className="w-14 h-14 bg-white border border-[#e6ddd0] rounded-2xl flex items-center justify-center mx-auto mb-3.5">
                        <Banknote size={24} strokeWidth={1.7} className="text-[#9a7b56]" />
                      </div>
                      <p className="text-[13.5px] font-semibold text-[#151413] mb-1">
                        Cash on Delivery
                      </p>
                      <p className="text-[12.5px] font-medium text-[#6c6257] leading-relaxed max-w-[280px] mx-auto">
                        Pay the full amount conveniently upon delivery at your doorstep.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.section>

          </div>

          {/* Right Column: Order Summary (Warm Editorial Card) */}
          <div className="lg:col-span-5 lg:sticky lg:top-[124px] h-fit z-10">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1 }}
              className="bg-white text-[#151413] rounded-[22px] border border-[#e9e1d6] shadow-[0_12px_34px_rgba(32,25,18,0.06)] overflow-hidden"
            >
              {/* Summary Header */}
              <div className="px-6 py-4 bg-[#faf7f2] border-b border-[#efe8de] flex items-center justify-between">
                <h2 className="text-[15px] font-extrabold uppercase tracking-[0.14em] text-[#151413]">
                  Order Summary
                </h2>
                <span className="px-3 py-1 bg-[#161514] text-white text-[10.5px] font-bold rounded-full tracking-[0.12em] uppercase">
                  {items.length} {items.length === 1 ? 'Unit' : 'Units'}
                </span>
              </div>

              <div className="p-6 space-y-6">
                {/* Items List */}
                <div className="divide-y divide-[#f2ece3] max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-4 items-center py-3.5 first:pt-0 last:pb-0">
                      <div className="w-16 h-20 shrink-0 bg-[#f1ebe3] rounded-xl border border-[#eae2d7] overflow-hidden">
                        <img
                          src={getImageUrl(item.imageUrl)}
                          alt={item.name}
                          className="w-full h-full object-cover object-[center_12%]"
                        />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-[13.5px] font-bold text-[#151413] line-clamp-1">
                          {item.name}
                        </p>
                        <p className="text-[11px] font-semibold text-[#8d8276] uppercase tracking-[0.08em]">
                          {item.variantAttributes?.size && `Size ${item.variantAttributes.size} · `}Qty {item.quantity}
                        </p>
                        <p className="text-[13.5px] font-extrabold text-[#151413]">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Rewards & Loyalty */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#faf7f2] border border-[#ebe3d8] space-y-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-[#9a7b56]" />
                    <h3 className="text-[11.5px] font-extrabold uppercase tracking-[0.16em] text-[#151413]">
                      Rewards &amp; Loyalty
                    </h3>
                  </div>

                  {/* Coupon */}
                  <div>
                    <div className="relative">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="PROMO CODE"
                        className="w-full h-12 pl-4 pr-24 bg-white border border-[#e2d8cb] rounded-xl outline-none uppercase text-[12.5px] font-bold tracking-[0.16em] focus:border-[#161514] focus:ring-2 focus:ring-[#c9a77a]/20 transition-all text-[#151413] placeholder:text-[#9a8e80]"
                      />
                      <button
                        type="button"
                        onClick={applyCouponLogic}
                        disabled={applyingCoupon}
                        className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-[#161514] hover:bg-[#2c2926] text-white text-[10.5px] font-bold uppercase tracking-[0.12em] rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>

                    {/* Available Coupons Quick Select */}
                    {availableCoupons.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2.5">
                        {availableCoupons.map((coupon) => (
                          <button
                            key={coupon.id}
                            type="button"
                            onClick={() => applyCouponLogic(coupon.code)}
                            className="px-3 py-1 bg-white hover:bg-[#161514] border border-[#dfd4c5] hover:border-[#161514] rounded-full text-[#3f3831] hover:text-white text-[10.5px] font-bold tracking-[0.1em] uppercase transition-colors cursor-pointer"
                          >
                            Use {coupon.code}
                          </button>
                        ))}
                      </div>
                    )}

                    {couponError && (
                      <p className="text-[#b43232] text-[11px] font-semibold mt-1.5 ml-0.5">
                        {couponError}
                      </p>
                    )}
                  </div>

                  {/* Loyalty */}
                  <div className="p-4 bg-white rounded-xl border border-[#e6ddd0] space-y-2">
                    <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-[0.12em]">
                      <span className="text-[#7a7064]">Balance: {userPoints} Pts</span>
                      <button
                        type="button"
                        onClick={useMaxPoints}
                        className="text-[#9a7b56] hover:text-[#151413] underline underline-offset-2 transition-colors cursor-pointer"
                      >
                        Use Max
                      </button>
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
                      className="w-full bg-transparent border-none p-0 outline-none text-[18px] font-extrabold tracking-tight text-[#151413] placeholder:text-[#b5a99b]"
                    />
                  </div>
                </div>

                {/* Totals */}
                <div className="space-y-3 pt-4 border-t border-[#f0e9df]">
                  <div className="flex justify-between text-[13px] font-medium text-[#6c6257]">
                    <span>Subtotal</span>
                    <span className="font-bold text-[#151413]">{formatPrice(total)}</span>
                  </div>

                  <div className="flex justify-between text-[13px] font-medium text-[#6c6257]">
                    <span>Delivery</span>
                    <span className="font-bold text-[#151413]">
                      {shippingFee > 0 ? formatPrice(shippingFee) : "FREE"}
                    </span>
                  </div>

                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-[13px] font-semibold text-[#1c6642]">
                      <span>Coupon Discount</span>
                      <span>-{formatPrice(couponDiscount)}</span>
                    </div>
                  )}

                  {pointsDiscount > 0 && (
                    <div className="flex justify-between text-[13px] font-semibold text-[#1c6642]">
                      <span>Loyalty Discount</span>
                      <span>-{formatPrice(pointsDiscount)}</span>
                    </div>
                  )}

                  <div className="pt-4 mt-2 border-t border-[#e8e0d5]">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#5c544b]">
                        Total
                      </span>
                      <p className="text-[24px] sm:text-[30px] font-extrabold tracking-[-0.025em] text-[#151413] leading-none">
                        {formatPrice(finalTotal)}
                      </p>
                    </div>
                    <p className="text-[11px] font-medium text-[#8d8276] text-right mt-1.5">
                      Inclusive of all applicable taxes
                    </p>
                  </div>

                  <Button
                    type="submit"
                    form="checkout-form"
                    variant="dark"
                    className="w-full h-13 rounded-full bg-[#161514] hover:bg-[#2c2926] text-white text-[12px] font-bold uppercase tracking-[0.16em] mt-4 shadow-[0_12px_28px_rgba(22,21,20,0.18)] hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-200 cursor-pointer"
                    loading={processing}
                    onClick={handleSubmit(onSubmit)}
                  >
                    Complete Order
                  </Button>

                  <div className="pt-4 flex items-center justify-center gap-2 text-[11px] text-[#8d8276] font-medium">
                    <ShieldCheck size={14} className="text-[#9a7b56] shrink-0" />
                    <span>Secure encrypted checkout by Rich Apparel</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
};
