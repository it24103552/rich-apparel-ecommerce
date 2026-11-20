# API Integration Guide

## Overview

This frontend uses **Axios** with a centralized API instance and modular service files for each backend module.

## Files

### `src/api/axios.js`
- **Single Axios instance** configured for the backend
- Base URL: `http://localhost:5000/api/v1`
- **Auto-attaches JWT token** from localStorage to all requests
- **Handles 401 errors** by removing token and redirecting to login

### `src/services/`
Separate service file for each module:
- `auth.service.js` - Authentication
- `roles.service.js` - Roles management
- `users.service.js` - Users management
- `staff.service.js` - Staff management
- `categories.service.js` - Product categories
- `products.service.js` - Products (with file upload)
- `cart.service.js` - Shopping cart
- `orders.service.js` - Orders
- `payments.service.js` - Payments
- `reviews.service.js` - Product reviews (with file upload)
- `returns.service.js` - Return requests
- `coupons.service.js` - Discount coupons
- `loyalty.service.js` - Loyalty points
- `suppliers.service.js` - Suppliers
- `dashboard.service.js` - Dashboard analytics

## Usage Examples

### Import Individual Service
```jsx
import { authService } from "../services/auth.service";

const handleLogin = async () => {
  try {
    const response = await authService.login({
      email: "user@email.com",
      password: "password123"
    });
    localStorage.setItem("token", response.data.data.token);
  } catch (error) {
    console.error("Login failed:", error);
  }
};
```

### Import Multiple Services
```jsx
import { authService, productsService, cartService } from "../services";

// Use services
await authService.login(credentials);
await productsService.getAll(0, 10);
await cartService.addItem({ productId: "123", quantity: 2 });
```

### Working with File Uploads
```jsx
import { productsService } from "../services";

const handleCreateProduct = async (formData) => {
  try {
    // formData should include: name, description, price, stock, categoryId, image
    const response = await productsService.create(formData);
    console.log("Product created:", response.data);
  } catch (error) {
    console.error("Create failed:", error);
  }
};
```

## Features

✅ **Centralized Configuration** - Single place to configure API settings
✅ **Automatic Token Attachment** - JWT token from localStorage added to all requests
✅ **Automatic Error Handling** - 401 errors redirect to login
✅ **Modular Services** - Easy to maintain and test each module separately
✅ **File Upload Support** - Proper multipart/form-data headers for products and reviews
✅ **Consistent API** - All services follow the same pattern

## Token Management

### Store Token After Login
```jsx
const response = await authService.login(credentials);
localStorage.setItem("token", response.data.data.token);
```

### Clear Token on Logout
```jsx
localStorage.removeItem("token");
```

The axios interceptor will automatically include the token in the `Authorization: Bearer <token>` header for all subsequent requests.

## Error Handling

All service methods return a promise that resolves to the API response or rejects with an error.

```jsx
try {
  const response = await authService.login(credentials);
  // response.data contains: { success, message, data }
} catch (error) {
  // error.response.data contains: { success, message, errors }
}
```
