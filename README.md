# POS & Inventory System

Internal POS, costing, and inventory system for handmade arrangements built from raw materials.

## Current Status

The repository currently includes:

- A React + Vite client with login, dashboard, inventory, arrangements, sales, reports, and settings screens
- An Express + Prisma API with JWT auth, role checks, and PostgreSQL persistence
- Core business flows for material purchasing, BOM-based product costing, sales snapshots, and inventory reservations

The codebase is functional for a seeded local/demo setup, but it is still in a stabilization phase. Validation, tests, and some UI coverage are still missing.

## Implemented Features

- Authentication with JWT login and persisted client session
- Role values for `ADMIN`, `MANAGER`, and `STAFF`
- Raw material CRUD, low-stock highlighting, purchase history, and purchase intake
- Weighted average and latest purchase cost tracking
- Arrangement/product CRUD with BOM components
- Product cost preview endpoint and client cost drawer
- Sales recording with immutable production-cost and material-cost snapshots
- Revenue, inventory value, top products, and dashboard KPI reports
- Settings storage for costing method, tax rate, currency, and business name
- Inventory reservation flow tied to product production status changes

## Partial Or Missing Areas

- No frontend users page even though `/api/users` exists
- Sidebar and route visibility are not role-aware
- Dashboard depends on `/api/reports/dashboard`, which is restricted to `ADMIN` and `MANAGER`, so `STAFF` users are not fully supported in the current UI flow
- Product status updates exist in the API and page state, but the action is not surfaced in the visible products table
- Request validation is still controller-level and inconsistent
- There are no automated tests
- Several files still contain mojibake or encoding issues in UI strings and console output

## Tech Stack

- Client: React 18, Vite, Ant Design, Zustand, React Router, Axios
- Server: Node.js, Express, Prisma, PostgreSQL, JWT, bcrypt
- Shared: business constants in [`shared/constants.js`](/C:/Users/dheyn/Documents/01_Startup/02_DaeArtesania/dae-retail-platform/shared/constants.js)

## Project Structure

```text
.
|-- client/
|   |-- src/
|   |   |-- api/
|   |   |-- components/layout/
|   |   |-- pages/
|   |   `-- store/
|   `-- vite.config.js
|-- server/
|   |-- prisma/
|   |   |-- migrations/
|   |   |-- schema.prisma
|   |   `-- seed.js
|   `-- src/
|       |-- controllers/
|       |-- middleware/
|       |-- routes/
|       |-- services/
|       `-- utils/
|-- shared/
|-- PROGRESS.md
`-- PHASE_1_BACKLOG.md
```

## Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL database

## Installation

```bash
npm install
npm --prefix client install
npm --prefix server install
```

Or:

```bash
npm run install:all
```

## Environment Setup

Copy the root example file into `server/.env`:

```bash
cp .env.example server/.env
```

Required variables used by the current server:

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | Yes | Prisma app connection |
| `DIRECT_URL` | Yes for migrations | Prisma direct connection |
| `JWT_SECRET` | Yes | Used to sign login tokens |
| `PORT` | No | Defaults to `3000` |
| `CORS_ORIGIN` | No | Defaults to `http://localhost:5173` |

Replace any example values before using a real environment.

## Database Setup

Run migrations from the root:

```bash
npm run migrate
```

Seed demo data:

```bash
npm run seed
```

The current seed creates:

- 1 admin user: `admin@pos.local` / `admin123`
- 4 sample raw materials
- 1 sample arrangement with BOM
- 4 base system settings

## Running The App

Start client and server together:

```bash
npm run dev
```

Default local URLs:

- Client: `http://localhost:5173`
- API: `http://localhost:3000`
- Health check: `http://localhost:3000/api/health`

Individual commands:

```bash
npm run dev:client
npm run dev:server
npm start
```

## Main API Surface

Implemented routes include:

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET|POST|PUT|DELETE /api/materials`
- `GET|POST /api/materials/:id/purchases`
- `GET|POST|PUT|DELETE /api/products`
- `GET /api/products/:id/cost`
- `PATCH /api/products/:id/status`
- `GET|POST /api/sales`
- `PATCH /api/sales/:id/payment`
- `GET /api/reports/dashboard`
- `GET /api/reports/revenue`
- `GET /api/reports/inventory-value`
- `GET /api/reports/top-products`
- `GET /api/settings`
- `PUT /api/settings/:key`
- `GET|POST|PUT|DELETE /api/users`

## Notes On Current Behavior

- Sales use backend-calculated cost snapshots; the client does not compute final profit logic
- Product production status currently drives inventory reservation side effects
- Products currently mix catalog data with live production/payment state, which will likely need a later domain refactor
- The products list still estimates base cost from incomplete product payload data, so displayed list margins are not fully trustworthy

## Documentation

- Current repo status: [`PROGRESS.md`](/C:/Users/dheyn/Documents/01_Startup/02_DaeArtesania/dae-retail-platform/PROGRESS.md)
- Stabilization backlog: [`PHASE_1_BACKLOG.md`](/C:/Users/dheyn/Documents/01_Startup/02_DaeArtesania/dae-retail-platform/PHASE_1_BACKLOG.md)
