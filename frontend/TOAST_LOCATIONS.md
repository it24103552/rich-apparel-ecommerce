# Toast Messages Implementation Locations

This document lists all the files and specific locations where react-hot-toast should be implemented to show user feedback messages.

---

## Auth Pages

### 1. LoginPage.jsx
**File:** `src/pages/auth/LoginPage.jsx`

| Line | Current Behavior | Suggested Toast |
|------|-----------------|----------------|
| 41-45 | Login success - redirects silently | Success: "Welcome back! Logged in successfully" |
| 42 | Login error - sets `apiError` state | Error: "Invalid email or password" |

### 2. RegisterPage.jsx
**File:** `src/pages/auth/RegisterPage.jsx`

| Line | Current Behavior | Suggested Toast |
|------|-----------------|----------------|
| 37 | Registration success - redirects | Success: "Account created! Please check your email to verify." |
| 39 | Registration error - sets `apiError` state | Error: "Registration failed. Try again." |

### 3. ForgotPasswordPage.jsx
**File:** `src/pages/auth/ForgotPasswordPage.jsx`

| Line | Current Behavior | Suggested Toast |
|------|-----------------|----------------|
| 22 | Success - sets `success` state | Success: "Password reset link sent to your email!" |
| 24 | Error - sets `apiError` state | Error: "Failed to send reset email" |

### 4. ResetPasswordPage.jsx
**File:** `src/pages/auth/ResetPasswordPage.jsx`

| Line | Current Behavior | Suggested Toast |
|------|-----------------|----------------|
| 35 | Reset success - redirects | Success: "Password reset successfully! Please login." |
| 37 | Reset error - sets `apiError` state | Error: "Failed to reset password" |

---

## Admin Pages

### 5. StaffPage.jsx
**File:** `src/pages/admin/StaffPage.jsx`

| Line | Current Behavior | Suggested Toast |
|------|-----------------|----------------|
| 111 | Create staff success | Success: "Staff member created successfully" |
| 113 | Update staff success | Success: "Staff member updated successfully" |
| 122 | Save error - uses `alert()` | Error: "Failed to save staff" |
| 137 | Delete success | Success: "Staff member deleted successfully" |
| 140 | Delete error - uses `alert()` | Error: "Failed to delete staff" |

### 6. RolesPage.jsx
**File:** `src/pages/admin/RolesPage.jsx`

| Line | Current Behavior | Suggested Toast |
|------|-----------------|----------------|
| 100 | Create role success | Success: "Role created successfully" |
| 102 | Update role success | Success: "Role updated successfully" |
| 111 | Save error - uses `alert()` | Error: "Failed to save role" |
| 126 | Delete success | Success: "Role deleted successfully" |
| 129 | Delete error - uses `alert()` | Error: "Failed to delete role" |

### 7. CategoriesPage.jsx
**File:** `src/pages/admin/CategoriesPage.jsx`

| Line | Current Behavior | Suggested Toast |
|------|-----------------|----------------|
| 100 | Create category success | Success: "Category created successfully" |
| 102 | Update category success | Success: "Category updated successfully" |
| 111 | Save error - uses `alert()` | Error: "Failed to save category" |
| 126 | Delete success | Success: "Category deleted successfully" |
| 129 | Delete error - uses `alert()` | Error: "Failed to delete category" |

### 8. ProductsPage.jsx
**File:** `src/pages/admin/ProductsPage.jsx`

| Line | Current Behavior | Suggested Toast |
|------|-----------------|----------------|
| 159 | Create product success | Success: "Product created successfully" |
| 161 | Update product success | Success: "Product updated successfully" |
| 170 | Save error - uses `alert()` | Error: "Failed to save product" |
| 185 | Delete success | Success: "Product deleted successfully" |
| 188 | Delete error - uses `alert()` | Error: "Failed to delete product" |

### 9. SuppliersPage.jsx
**File:** `src/pages/admin/SuppliersPage.jsx`

| Line | Current Behavior | Suggested Toast |
|------|-----------------|----------------|
| 104 | Create supplier success | Success: "Supplier created successfully" |
| 106 | Update supplier success | Success: "Supplier updated successfully" |
| 115 | Save error - uses `alert()` | Error: "Failed to save supplier" |
| 130 | Delete success | Success: "Supplier deleted successfully" |
| 133 | Delete error - uses `alert()` | Error: "Failed to delete supplier" |

### 10. CouponsPage.jsx
**File:** `src/pages/admin/CouponsPage.jsx`

| Line | Current Behavior | Suggested Toast |
|------|-----------------|----------------|
| 112 | Create coupon success | Success: "Coupon created successfully" |
| 114 | Update coupon success | Success: "Coupon updated successfully" |
| 123 | Save error - uses `alert()` | Error: "Failed to save coupon" |
| 138 | Delete success | Success: "Coupon deleted successfully" |
| 141 | Delete error - uses `alert()` | Error: "Failed to delete coupon" |

### 11. OrdersPage.jsx
**File:** `src/pages/admin/OrdersPage.jsx`

| Line | Current Behavior | Suggested Toast |
|------|-----------------|----------------|
| 77 | Status update success | Success: "Order status updated" |
| 79 | Status update error - uses `alert()` | Error: "Failed to update order status" |

### 12. PaymentsPage.jsx
**File:** `src/pages/admin/PaymentsPage.jsx`

| Line | Current Behavior | Suggested Toast |
|------|-----------------|----------------|
| 75 | Status update success | Success: "Payment status updated" |
| 77 | Status update error - uses `alert()` | Error: "Failed to update payment status" |

### 13. ReturnsPage.jsx
**File:** `src/pages/admin/ReturnsPage.jsx`

| Line | Current Behavior | Suggested Toast |
|------|-----------------|----------------|
| 86 | Status update success | Success: "Return status updated" |
| 93 | Status update error - sets `error` state | Error: "Failed to update return status" |
| 103 | Delete success | Success: "Return deleted successfully" |
| 106 | Delete error - sets `error` state | Error: "Failed to delete return" |

### 14. LoyaltyPage.jsx
**File:** `src/pages/admin/LoyaltyPage.jsx`

| Line | Current Behavior | Suggested Toast |
|------|-----------------|----------------|
| 106 | Add points success | Success: "Loyalty points added successfully" |
| 112 | Update points success | Success: "Loyalty transaction updated" |
| 124 | Save error - sets `error` state | Error: "Failed to save transaction" |
| 134 | Delete success | Success: "Transaction deleted successfully" |
| 137 | Delete error - sets `error` state | Error: "Failed to delete transaction" |

---

## Client Pages

### 15. HomePage.jsx
**File:** `src/pages/client/HomePage.jsx`

| Line | Current Behavior | Suggested Toast |
|------|-----------------|----------------|
| 17 | Add to cart success | Success: "Added to cart!" |
| 19 | Add to cart error - only console.error | Error: "Failed to add to cart" |

### 16. CartPage.jsx
**File:** `src/pages/client/CartPage.jsx`

| Line | Current Behavior | Suggested Toast |
|------|-----------------|----------------|
| 24 | Quantity update - no feedback | Success: "Cart updated" |
| 114 | Remove from cart - no feedback | Success: "Removed from cart" |

### 17. CreateOrderPage.jsx
**File:** `src/pages/client/CreateOrderPage.jsx`

| Line | Current Behavior | Suggested Toast |
|------|-----------------|----------------|
| 65 | Order creation error - sets `error` state | Error: "Failed to create order" |

### 18. CreatePaymentPage.jsx
**File:** `src/pages/client/CreatePaymentPage.jsx`

| Line | Current Behavior | Suggested Toast |
|------|-----------------|----------------|
| 82 | Missing image error | Error: "Please upload your deposit slip image" |
| 112 | Payment error - sets `error` state | Error: "Failed to process payment" |

### 19. MyOrdersPage.jsx
**File:** `src/pages/client/MyOrdersPage.jsx`

| Line | Current Behavior | Suggested Toast |
|------|-----------------|----------------|
| 35 | Load error - sets `error` state | Error: "Failed to load orders" |

### 20. OrderDetailsPage.jsx
**File:** `src/pages/client/OrderDetailsPage.jsx`

| Line | Current Behavior | Suggested Toast |
|------|-----------------|----------------|
| 143 | Order update success | Success: "Order updated successfully" |
| 145 | Order update error - sets `error` state | Error: "Failed to update order" |
| 155 | Cancel order success | Success: "Order cancelled successfully" |
| 157 | Cancel order error - sets `error` state | Error: "Failed to cancel order" |
| 175 | Review save success | Success: "Review saved successfully" |
| 178 | Review save error - sets `error` state | Error: "Failed to save review" |
| 189 | Review delete success | Success: "Review deleted successfully" |
| 191 | Review delete error - sets `error` state | Error: "Failed to delete review" |
| 214 | Return request success | Success: "Return request submitted" |
| 216 | Return request error - sets `error` state | Error: "Failed to submit return request" |
| 228 | Cancel return success | Success: "Return request cancelled" |
| 230 | Cancel return error - sets `error` state | Error: "Failed to cancel return request" |

---

## Profile Pages

### 21. ProfileForm.jsx
**File:** `src/pages/client/components/ProfileForm.jsx`

| Line | Current Behavior | Suggested Toast |
|------|-----------------|----------------|
| 29 | Profile update success - shows inline message | Success: "Profile updated successfully!" |
| 33 | Profile update error - shows inline message | Error: "Failed to update profile" |

### 22. DangerZone.jsx
**File:** `src/pages/client/components/DangerZone.jsx`

| Line | Current Behavior | Suggested Toast |
|------|-----------------|----------------|
| 16 | Logout - no toast | Info: "Logged out successfully" |
| 26 | Delete account success - redirects | Success: "Account deleted successfully" |
| 32 | Delete account error - uses `alert()` | Error: "Failed to delete account" |

---

## Context (Hooks)

### 23. CartContext.jsx
**File:** `src/context/CartContext.jsx`

| Line | Current Behavior | Suggested Toast |
|------|-----------------|----------------|
| 57-60 | Add to cart error - only console.error | Error: "Failed to add to cart" |
| 71-73 | Remove from cart error - only console.error | Error: "Failed to remove from cart" |
| 84-86 | Update cart error - only console.error | Error: "Failed to update cart" |

---

## Implementation Notes

### Toast Types to Use:
- **Success**: For successful operations (create, update, delete, login, etc.)
- **Error**: For failed API calls and validation errors
- **Info**: For informational messages like logout

### Recommended Messages:

| Action | Success Message | Error Message |
|--------|-----------------|---------------|
| Login | "Welcome back!" | "Invalid credentials" |
| Register | "Account created!" | "Registration failed" |
| Create | "{item} created!" | "Failed to create {item}" |
| Update | "{item} updated!" | "Failed to update {item}" |
| Delete | "{item} deleted!" | "Failed to delete {item}" |
| Add to Cart | "Added to cart!" | "Failed to add to cart" |
| Remove from Cart | "Removed from cart" | "Failed to remove" |
| Payment | "Payment successful!" | "Payment failed" |
| Logout | "Logged out successfully" | - |

### Global Error Handling:
Consider adding toast in `axios.js` interceptors for 401/403 errors to automatically show "Session expired. Please login again." messages.

---

## Files Summary

| Category | Files |
|----------|-------|
| Auth | LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage |
| Admin | StaffPage, RolesPage, CategoriesPage, ProductsPage, SuppliersPage, CouponsPage, OrdersPage, PaymentsPage, ReturnsPage, LoyaltyPage |
| Client | HomePage, CartPage, CreateOrderPage, CreatePaymentPage, MyOrdersPage, OrderDetailsPage |
| Components | ProfileForm, DangerZone |
| Context | CartContext |
