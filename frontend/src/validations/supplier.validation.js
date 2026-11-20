export const supplierRules = {
  supplierId: {
    required: "Supplier ID is required",
    pattern: {
      value: /^SUP-[A-Z0-9]{6}$/,
      message: "ID must follow the format SUP-XXXXXX (e.g. SUP-69AC05)"
    },
    maxLength: {
      value: 10,
      message: "Supplier ID cannot exceed 10 characters"
    }
  },
  name: {
    required: "Supplier name is required",
    minLength: { value: 2, message: "Name must be at least 2 characters" },
  },
  email: {
    required: "Email is required",
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: "Invalid email format",
    },
  },
  phone: {
    required: "Phone is required",
    validate: (value, formValues) => {
      const type = formValues.type || "Local";
      if (type === "Foreign") {
        return /^\+?[0-9\s-]{7,15}$/.test(value) || "Please enter a valid international phone number (e.g. +15550100)";
      }
      return /^(?:0|\+94)[0-9]{9}$/.test(value) || "Please enter a valid phone number (e.g. 0771234567 or 0311234567)";
    }
  },
  address: {
    maxLength: { value: 300, message: "Address too long" },
  },
  productTypes: {
    maxLength: { value: 300, message: "Product types too long" },
  },
  description: {
    maxLength: { value: 500, message: "Description too long" },
  },
  paymentInfo: {
    maxLength: { value: 200, message: "Keep payment details concise" },
  },
};
