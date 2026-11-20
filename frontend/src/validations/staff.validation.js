export const staffRules = {
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
  roleId: {
    required: "Role is required",
  },
};
