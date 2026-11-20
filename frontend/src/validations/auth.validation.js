export const loginRules = {
  email: {
    required: "Email is required",
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: "Invalid email format",
    },
  },
  password: {
    required: "Password is required",
    minLength: { value: 6, message: "Password must be at least 6 characters" },
  },
};

export const registerRules = {
  name: {
    required: "Name is required",
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
    required: "Phone number is required",
    pattern: {
      value: /^(0)\d{9}$/,
      message: "Enter a valid 10-digit number (e.g., 07XXXXXXXX)",
    },
  },
  password: {
    required: "Password is required",
    minLength: { value: 6, message: "Password must be at least 6 characters" },
  },
  confirmPassword: {
    required: "Confirm password is required",
  },
};

export const forgotPasswordRules = {
  email: {
    required: "Email is required",
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: "Invalid email format",
    },
  },
};

export const resetPasswordRules = {
  password: {
    required: "New password is required",
    minLength: { value: 6, message: "Password must be at least 6 characters" },
  },
  confirmPassword: {
    required: "Confirm password is required",
  },
};
