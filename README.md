# Dae Artesania Retail Platform

Internal POS, inventory, and costing system for handmade floral and fuzzywire arrangements.

## Overview

This repository contains a small monorepo with:

- `client`: React + Vite frontend
- `server`: Express + Prisma API
- `shared`: shared constants

The current build supports authenticated operations for inventory, arrangements, sales, reports, settings, and user management. It is usable for a seeded local/demo workflow, but it is still in an active stabilization phase.

## Current Capabilities

- JWT authentication with persisted client session
- Role support for `ADMIN`, `MANAGER`, and `STAFF`
- Role-aware navigation and protected routes
- Raw material management with per-material variants
- Purchase intake with stock updates and cost recalculation
- Product or arrangement management with BOM-style components
- Cost previews based on the configured costing method
- Sales recording with immutable production-cost snapshots
- Payment-status updates for existing sales
- Dashboard and report screens for manager/admin roles
- Settings management for business name, costing method, tax rate, and currency
- User management screen with admin write access and manager read access

## Current Gaps

- No automated tests yet
- Request validation is still inconsistent across controllers
- Some files still contain mojibake or encoding issues
- Domain rules around production lifecycle and sale eligibility still need hardening
- Deployment, CI, and production operations documentation are not in place yet

## Tech Stack

- Frontend: React 18, Vite, React Router, Ant Design, Zustand, Axios
- Backend: Node.js, Express, Prisma, PostgreSQL, JWT, bcrypt

## Project Structure

```text
.
|-- client/
|   |-- public/
|   |-- src/
|   |   |-- api/
|   |   |-- components/
|   |   |-- constants/
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
|-- documentation/
|-- PROGRESS.md
`-- PHASE_1_BACKLOG.md
```

## Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL

## Install

From the repository root:

```bash
npm run install:all
```

Equivalent manual install:

```bash
npm install
npm --prefix client install
npm --prefix server install
```

## Environment Setup

Create `server/.env` from the example file:

```bash
cp .env.example server/.env
```

PowerShell alternative:

```powershell
Copy-Item .env.example server/.env
```

Required server variables:

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Prisma application connection |
| `DIRECT_URL` | Yes for migrations | Prisma direct connection |
| `JWT_SECRET` | Yes | Token signing secret |
| `PORT` | No | Defaults to `3000` |
| `CORS_ORIGIN` | No | Defaults to `http://localhost:5173` |

Replace all example values before using a real environment.

## Database

Run the initial migration:

```bash
npm run migrate
```

Seed demo data:

```bash
npm run seed
```

The seed currently creates:

- Admin user: `admin@pos.local` / `admin123`
- Four sample raw materials with variants
- One sample arrangement with BOM components
- Base system settings

## Run Locally

Start client and server together:

```bash
npm run dev
```

Or run them separately:

```bash
npm run dev:client
npm run dev:server
```

Production-style API start:

```bash
npm start
```

Default local URLs:

- Client: `http://localhost:5173`
- API: `http://localhost:3000`
- Health check: `http://localhost:3000/api/health`

## Main Screens

- `Dashboard`: manager/admin KPI summary
- `Inventory`: materials, variants, purchases, and stock levels
- `Arrangements`: product catalog, BOM editing, cost viewing, and status updates
- `POS / Sales`: sale entry, history, date filtering, and payment updates
- `Reports`: revenue, inventory value, top products, and dashboard reporting
- `Users`: user listing plus admin-only create, edit, and deactivate actions
- `Settings`: business and costing configuration

## API Surface

Implemented route groups:

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET|POST|PUT|DELETE /api/users`
- `GET|POST|PUT|DELETE /api/materials`
- `GET|POST /api/materials/:id/purchases`
- `GET|POST|PUT|DELETE /api/products`
- `GET /api/products/:id/cost`
- `PATCH /api/products/:id/status`
- `GET|POST /api/sales`
- `GET /api/sales/:id`
- `PATCH /api/sales/:id/payment`
- `GET /api/reports/dashboard`
- `GET /api/reports/revenue`
- `GET /api/reports/inventory-value`
- `GET /api/reports/top-products`
- `GET /api/settings`
- `PUT /api/settings/:key`

## Role Notes

- `ADMIN`: full access
- `MANAGER`: access to dashboard, reports, and read-only user management
- `STAFF`: login, inventory, arrangements, and sales flows; default landing page is `/sales`

## Related Docs

- [`PROGRESS.md`](/C:/Users/dheyn/Documents/01_Startup/02_DaeArtesania/dae-retail-platform/PROGRESS.md): implementation status and risks
- [`PHASE_1_BACKLOG.md`](/C:/Users/dheyn/Documents/01_Startup/02_DaeArtesania/dae-retail-platform/PHASE_1_BACKLOG.md): stabilization backlog
- [`documentation/SRS.pdf`](/C:/Users/dheyn/Documents/01_Startup/02_DaeArtesania/dae-retail-platform/documentation/SRS.pdf): requirements reference
- [`documentation/Product Requirements Document.pdf`](/C:/Users/dheyn/Documents/01_Startup/02_DaeArtesania/dae-retail-platform/documentation/Product%20Requirements%20Document.pdf): product context
