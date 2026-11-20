# Rich Life Apparel — Roles, Authorization & Demo Login Details

## Roles & Authorization

### `ADMIN` ("Admin")
- Full system administration access across the entire application.
- Manages products, collections/categories, suppliers, orders, payments, returns, coupons, loyalty points, reviews, customer support chat, customers, staff, and roles.

### `PRODUCT_MANAGER` ("Product Manager")
- Manage products, product collections/categories (`Women`, `Men`, `Sporty`), and product-related inventory/restock operations.

### `SUPPLIER_MANAGER` ("Supplier Manager")
- Manage suppliers and supplier-related product/restock operations.

*(Customer/public accounts use the `Customer` role for storefront browsing, cart, checkout, orders, returns, reviews, and loyalty points.)*

---

## Development / Demo Credentials

The seed scripts provide the following **development/test** credentials for local evaluation of role-based access control:

### Seeded via `backend/prisma/seed.js` (`npm run seed`)

| Business Role | Role Name in DB | Email | Demo Password | Allowed Admin Sections |
|---|---|---|---|---|
| `ADMIN` | `Admin` | `admin@store.com` | `admin123` | Full Administrative Access (All Sections) |
| `PRODUCT_MANAGER` | `Product Manager` | `product@shop.com` | `admin123` | Product Dashboard, Products, Categories (`Women`, `Men`, `Sporty`), Activity History, Settings |
| `SUPPLIER_MANAGER` | `Supplier Manager` | `supplier@shop.com` | `admin123` | Supplier Dashboard, Suppliers & Restock Requests, Activity History, Settings |

### Seeded via `backend/seedRoles.js` (`node seedRoles.js`)

| Business Role | Role Name in DB | Email | Demo Password |
|---|---|---|---|
| `ADMIN` | `Admin` | `admin@shop.com` | `Password123!` |
| `PRODUCT_MANAGER` | `Product Manager` | `product@shop.com` | `Password123!` |
| `SUPPLIER_MANAGER` | `Supplier Manager` | `supplier@shop.com` | `Password123!` |

---

## Production Security Requirements

- **Development/Demo Only**: The credentials listed above are strictly for local development and testing environments.
- **Production Deployment**:
  - Do not run demo user seed scripts in production environments, or immediately rotate all administrative passwords using strong, unique passwords.
  - Store `DATABASE_URL`, `JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and SMTP/AI keys exclusively in environment variables (`.env` / secret manager) — **never** commit real secrets to version control or documentation.
