export const productRules = {
  name: {
    required: "Product name is required",
    minLength: { value: 2, message: "Name must be at least 2 characters" },
  },
  description: {
    required: "Description is required",
    minLength: { value: 10, message: "Description must be at least 10 characters" },
  },
  price: {
    required: "Price is required",
    min: { value: 0, message: "Price must be positive" },
  },
  costPrice: {
    required: "Actual cost is required",
    min: { value: 0, message: "Cost price must be non-negative" },
  },
  supplierId: {
    required: "Supplier source is required",
  },
  stock: {
    required: "Stock is required",
    min: { value: 0, message: "Stock must be non-negative" },
  },
  categoryId: {
    required: "Category is required",
  },
};
