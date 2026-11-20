export const checkoutRules = {
  shippingAddress: {
    required: "Shipping address is required",
    minLength: { value: 5, message: "Address must be at least 5 characters" },
  },
  city: {
    required: "City is required",
  },
  zipCode: {
    required: "Zip code is required",
  },
};
