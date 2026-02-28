# POS & Inventory System

Internal staff system for POS, inventory tracking, costing, and revenue monitoring.

---

## Prerequisites

- **Node.js** v18+
- **PostgreSQL** running locally (or a cloud URL)
- **npm** v9+

---

## Installation

```bash
# 1. Clone/open the project root
cd dae.necookie.dev

# 2. Install root dependencies (concurrently)
npm install

# 3. Install server dependencies
npm --prefix server install

# 4. Install client dependencies
npm --prefix client install
```

Or run all three in one command:

```bash
npm run install:all
```

---

## Environment Setup

```bash
# Copy the template
cp .env.example server/.env
```

Open `server/.env` and fill in:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:pass@localhost:5432/pos_inventory` |
| `JWT_SECRET` | Secret key for JWT signing | `my_super_secret_key_123` |
| `PORT` | Server port | `3000` |
| `CORS_ORIGIN` | Frontend URL | `http://localhost:5173` |

---

## Database Setup

### 1. Create the PostgreSQL database

```sql
CREATE DATABASE pos_inventory;
```

### 2. Run migrations

```bash
cd server
npx prisma migrate dev --name init
```

Or from root:

```bash
npm run migrate
```

### 3. Seed the database

```bash
npm run seed
```

This creates:
- ✅ 1 admin user
- ✅ 4 sample raw materials
- ✅ 1 sample product with BOM
- ✅ Default system settings

---

## Running the App

```bash
# Start both client and server (from root)
npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| Prisma Studio | `cd server && npx prisma studio` |

Individual services:

```bash
npm run dev:client   # React app only (port 5173)
npm run dev:server   # API server only (port 3000)
```

---

## Default Login

| Field | Value |
|-------|-------|
| Email | `admin@pos.local` |
| Password | `admin123` |
| Role | ADMIN |

> ⚠️ Change this password immediately in production via the Users page.

---

## Project Structure

```
.
├── client/                  # React + Vite + Ant Design frontend
│   └── src/
│       ├── api/             # Axios instance
│       ├── components/      # Layout (Sidebar, Header, ProtectedRoute)
│       ├── pages/           # Login, Dashboard, Inventory, Products, Sales, Reports, Settings
│       └── store/           # Zustand stores (auth, settings)
├── server/                  # Node.js + Express backend
│   ├── prisma/
│   │   ├── schema.prisma    # Full database schema (10 tables)
│   │   └── seed.js          # Seed script
│   └── src/
│       ├── controllers/     # Route handlers
│       ├── middleware/       # auth, rbac, errorHandler
│       ├── routes/          # Express routers
│       ├── services/        # Business logic (costing, inventory, sales, reports)
│       └── utils/           # asyncHandler
├── shared/                  # Shared constants (roles, statuses, costing methods)
├── .env.example             # Environment variable template
└── package.json             # Root with concurrently scripts
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |
| GET | `/api/materials` | List materials |
| POST | `/api/materials/:id/purchases` | Record purchase |
| GET | `/api/products` | List products |
| GET | `/api/products/:id/cost` | Preview production cost |
| PATCH | `/api/products/:id/status` | Update production/payment status |
| POST | `/api/sales` | Record a sale (with snapshot) |
| GET | `/api/reports/dashboard` | Dashboard KPIs |
| GET | `/api/reports/revenue` | Revenue & profit |
| GET | `/api/reports/inventory-value` | Stock valuation |
| GET/PUT | `/api/settings/:key` | System settings |

---

## Key Business Rules

- **All financial calculations** happen on the backend. Frontend never computes cost or profit.
- **Sale snapshots** are immutable — production cost and material costs are stored at time of sale.
- **Inventory reservations**: `IN_PRODUCTION` reserves stock, `COMPLETED` confirms deduction, `CANCELLED` releases stock.
- **Costing method** is configurable: Weighted Average, Latest Purchase, or Manual Override.
