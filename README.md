# 🌱 Aloe di Elisabetta - Complete System Documentation

Comprehensive technical documentation and reference guide for the **Aloe di Elisabetta Management System**.

---

## 📌 Executive Overview

**Aloe di Elisabetta** is a full-stack management web application built with **React (TypeScript)**, **Tailwind CSS**, and **Supabase (PostgreSQL)**. It powers business operations including client management (patients), product recipes & raw materials, production planning, collaborator sales tracking, commission calculations, and monthly general costs.

---

## 🔑 Core Architecture & Key Business Rules

### 1. Dual Portal & Role-Based Access Control (RBAC)
- **Admin (`Elisabetta`)**:
  - Full access to all business metrics, profits, recipes, raw materials, general costs, user management, and production orders.
  - Can place personal admin orders (*"Mio ordine"*) or collaborator orders (*"Ordine collaboratore"*).
- **Collaborator (`Salesperson`)**:
  - Restricted portal with sidebar options: **Guadagno Mensile**, **Mie Vendite**, **Manodopera**, and **Il Mio Profilo**.
  - Can record personal labor hours (*Manodopera*) with notes, view sales performance, and track monthly earnings & Netto Aziendale.

### 2. Order System & Dual Date Logic
- **`date` (Target Production Month)**:
  - Governs which monthly batch/filtering tab an order belongs to (e.g. October 2026, December 2026).
  - When creating a new order while visualising a specific month (e.g. October), `date` is set to that target month/year.
- **`createdAt` (Real-World Placement Timestamp)**:
  - Records the exact real-world date and time when the order was placed (e.g. `05/09/2026`).
  - Rendered under the **DATA / ID** column across all order tables (`Orders.tsx`, `MySales.tsx`, `GuadagnoMensile.tsx`, `Reports.tsx`).

### 3. Financials & Netto Aziendale Calculation
- **Netto Aziendale** (Collaborator Portal - *Guadagno Mensile*):
  $$\text{Netto Aziendale} = \text{Total Sold} - \text{Provvigioni} - \text{Guadagno Manodopera}$$
  *(The amount the collaborator settles/gives to the admin for the month).*
- **Commission Calculations**:
  - Automatically calculated based on product-specific `externalCommission` settings when orders are placed for a collaborator.

### 4. Recipes, Raw Materials & Dynamic Cost Math
- Handles base product formulas and modifier group recipes.
- Supports automatic unit conversions (`kg` $\leftrightarrow$ `gr`/`g`, `lit`/`l` $\leftrightarrow$ `ml`).
- Dynamic unit cost calculation:
  $$\text{Unit Cost} = \frac{\text{totalPrice}}{\text{totalQuantity}}$$

---

## 🗄️ Database Architecture (Supabase / PostgreSQL)

| Table | Primary Purpose | Key Columns |
| :--- | :--- | :--- |
| `workspaces` | Multi-tenant workspace container | `id`, `name`, `owner_id`, `created_at` |
| `workspace_users` | User credentials & role linking | `id`, `workspace_id`, `salesperson_id`, `username`, `user_id` |
| `salespersons` | Collaborator profiles | `id`, `workspace_id`, `name`, `created_at` |
| `patients` | Client/patient records & journal | `id`, `workspace_id`, `first_name`, `last_name`, `phone`, `city`, `journal` |
| `products` | Base product catalog | `id`, `workspace_id`, `name`, `price`, `cost_per_item`, `external_commission`, `sku` |
| `recipes` | Ingredient formulas for products | `id`, `workspace_id`, `product_id`, `modifier_group_id`, `ingredients` (JSONB) |
| `raw_materials` | Inventory stock of raw ingredients | `id`, `workspace_id`, `name`, `unit`, `total_quantity`, `total_price` |
| `orders` | Sales orders | `id`, `workspace_id`, `patient_id`, `items` (JSONB), `date`, `created_at`, `is_external`, `salesperson_id`, `commission` |
| `general_costs` | Business general expenses | `id`, `workspace_id`, `name`, `amount`, `category`, `date`, `is_recurring` |
| `labor_records` | Collaborator labor hours & notes | `id`, `workspace_id`, `salesperson_id`, `hours`, `hourly_rate`, `date`, `notes`, `created_at` |

---

## 🛠️ Application Structure & Pages

```
Aloe-di-Elisabetta/
├── App.tsx                     # Router, ProtectedRoute logic
├── store.tsx                   # Central React Context (AppProvider) & Supabase sync
├── supabase.ts                  # Supabase Client Initialization
├── types.ts                    # Global TypeScript interfaces
├── components/
│   ├── Layout.tsx              # Sidebar, navigation, role-based menus
│   └── ErrorBoundary.tsx       # Global React error boundary
└── pages/
    ├── Orders.tsx              # Order management, filtering & creation modal
    ├── Patients.tsx            # Patient directory & medical journal
    ├── Products.tsx            # Product catalog & pricing
    ├── Recipes.tsx             # Formula composition (alphabetically sorted)
    ├── RawMaterials.tsx        # Raw material inventory management
    ├── Production.tsx          # Production batch planning & item totals
    ├── Materials.tsx           # Aggregated raw material requirement math
    ├── GeneralCosts.tsx        # Fixed & recurring business expenses (includes labor)
    ├── Manodopera.tsx          # Hours logging modal (with scrollbar & notes)
    ├── GuadagnoMensile.tsx     # Monthly earnings & Netto Aziendale breakdown
    ├── MySales.tsx             # Collaborator sales history
    ├── Profits.tsx             # Net profit analytics & margin reports
    ├── Reports.tsx             # Printable financial summaries
    ├── Users.tsx               # Workspace user & collaborator management
    ├── Profile.tsx             # Account settings & workspace info
    ├── Settings.tsx            # System configuration & SKU management
    └── Login.tsx               # Secure explicit-credential authentication page
```

---

## 🚀 Running Locally

### Prerequisites
- Node.js (v18+)
- npm

### Launch Dev Server
```bash
npx vite --port 3000 --strictPort
```
Access the local application at: **[http://localhost:3000/](http://localhost:3000/)**

### Build Production Bundle
```bash
npm run build
```

---

## 🔒 Security & Auth Session Policy
- Auth sessions are strictly initialized via `supabase.ts`.
- Login requires explicit credential submission on `Login.tsx`.
- Role authentication is enforced on every protected route via `ProtectedRoute` in `App.tsx`.
