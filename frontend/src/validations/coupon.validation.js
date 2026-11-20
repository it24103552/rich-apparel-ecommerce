export const couponRules = {
  code: {
    required: "Coupon code is required",
    minLength: { value: 2, message: "Code must be at least 2 characters" },
  },
  discount: {
    required: "Discount is required",
    min: { value: 0, message: "Discount must be non-negative" },
  },
  minCartValue: {
    required: "Minimum cart value is required",
    min: { value: 0, message: "Must be non-negative" },
  },
};
