# Rich Life Apparel — Frontend (React + Vite)

Storefront and role-based management portal for **Rich Life Apparel**.

## Roles & Authorization

- **ADMIN (`Admin`)**: Full system administration access (`/admin/dashboard/overall`, Products, Categories, Suppliers, Orders, Payments, Returns, Coupons, Loyalty, Reviews, Customer Chat, Users, Staff, Roles, History, Settings).
- **PRODUCT_MANAGER (`Product Manager`)**: Manage products, apparel collections/categories (`Women`, `Men`, `Sporty`), and product inventory (`/admin/dashboard/product`, `/admin/products`, `/admin/categories`, `/admin/history`, `/admin/settings`).
- **SUPPLIER_MANAGER (`Supplier Manager`)**: Manage suppliers and supplier restock operations (`/admin/dashboard/supplier`, `/admin/suppliers`, `/admin/history`, `/admin/settings`).

## Apparel Collections

- **Women** (`/category/women`)
- **Men** (`/category/men`)
- **Sporty** (`/category/sporty`)

## Development Setup

```bash
npm install
npm run dev
```

For demo login credentials and production security requirements, see [final_login_details.md](../final_login_details.md) and [backend/SEED_GUIDE.md](../backend/SEED_GUIDE.md).
