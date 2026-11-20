export const reviewRules = {
  rating: {
    required: "Rating is required",
    min: { value: 1, message: "Rating must be at least 1" },
    max: { value: 5, message: "Rating cannot exceed 5" },
  },
  comment: {
    required: "Comment is required",
    minLength: { value: 5, message: "Comment must be at least 5 characters" },
  },
};
