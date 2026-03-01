# Project Progress

This status reflects the code currently present in the repository on March 1, 2026.

## Implemented

- [x] Monorepo layout with `client`, `server`, and `shared`
- [x] React client with authenticated routing and Zustand-based auth/settings state
- [x] Express API with Prisma and PostgreSQL schema/migration
- [x] JWT login and `GET /api/auth/me`
- [x] Role definitions and backend RBAC for admin, manager, and staff
- [x] Raw material CRUD with soft-delete via `isActive`
- [x] Purchase intake that updates stock, latest cost, weighted average cost, and transaction records
- [x] Arrangement/product CRUD with BOM rows in `product_materials`
- [x] Cost preview endpoint based on configurable costing method
- [x] Sales creation with immutable sale-level and material-level cost snapshots
- [x] Sales history with date filtering and payment status display
- [x] Reports for dashboard KPIs, revenue summary, inventory value, and top products
- [x] Settings storage and settings screen for costing method, tax rate, currency, and business name
- [x] Seed data for an admin user, sample materials, a sample arrangement, and base settings

## Partial

- [~] Product production and payment status updates exist in the API
  - Inventory side effects are implemented on the backend
  - The products page defines status modal state, but the visible table does not expose a status action
- [~] User management exists on the API
  - No client page is implemented
  - Settings shows a disabled "User Management" tab placeholder
- [~] Staff role exists end to end
  - Authentication works
  - The client is not role-aware, and the dashboard calls a manager/admin-only report endpoint
- [~] Reporting UI exists
  - It covers summaries and tables
  - There are no exports, charts, or deeper operational filters

## Not Yet Implemented

- [ ] Request validation middleware and route schemas
- [ ] Centralized environment/config validation
- [ ] Automated tests
- [ ] Role-aware navigation and route gating in the client
- [ ] User management UI
- [ ] Product status controls in the arrangements UI
- [ ] Sales payment-status editing UI
- [ ] Stock movement or transaction history UI
- [ ] Deployment and CI documentation

## Current Risks And Gaps

- [ ] Validation is inconsistent
  - Controllers still do ad hoc checks for required fields
  - Invalid enum values, malformed dates, and duplicate BOM entries are not systematically rejected
- [ ] Sale correctness rules are underspecified
  - `createSale` checks only that the product exists and is active
  - It does not enforce a production-status eligibility rule
- [ ] Transaction safety is incomplete
  - `sales.service` opens a transaction
  - `calculateProductionCost` still reads through the global Prisma client instead of the same transaction context
- [ ] Product status transitions are permissive
  - Inventory side effects only run for specific transitions
  - Unsupported jumps are not explicitly rejected
- [ ] Client/server data mismatch exists in products list costing
  - `GET /api/products` includes material name and unit only
  - The products page still estimates list cost from missing `latestUnitCost` data
- [ ] Encoding quality is inconsistent
  - README was fixed, but application files still contain mojibake in peso signs, arrows, and console output

## Recommended Next Phases

## Phase 1: Stabilize Core Flows

- [ ] Add env validation on server startup
- [ ] Add reusable request validation middleware with `zod`
- [ ] Enforce product status transition rules explicitly
- [ ] Define sale eligibility rules against production state
- [ ] Make costing reads transaction-safe
- [ ] Normalize error payloads across auth, RBAC, validation, and Prisma failures
- [ ] Fix products page cost display mismatch
- [ ] Clean up remaining encoding issues

## Phase 2: Close API/UI Gaps

- [ ] Build a users page for admin workflows
- [ ] Surface product status updates in the arrangements screen
- [ ] Add payment-status update controls for existing sales
- [ ] Add transaction or stock-movement history screens
- [ ] Make sidebar visibility and protected routes role-aware
- [ ] Resolve staff dashboard access by changing permissions or using a staff-safe dashboard data source

## Phase 3: Refactor The Domain Model

- [ ] Separate arrangement templates from production jobs or customer orders
- [ ] Move reservation records to a production/order entity instead of the catalog product
- [ ] Support repeated production and repeated sales of the same arrangement cleanly
- [ ] Clarify fulfillment and payment lifecycle states

## Phase 4: Production Readiness

- [ ] Add backend tests for costing, reservations, and sales snapshots
- [ ] Add frontend smoke tests for login and core screens
- [ ] Add deployment documentation and backup expectations
- [ ] Add CI checks for install, migration, build, and tests
- [ ] Add basic observability and structured error logging

## Delivery Order

- [ ] First: Phase 1 stabilization
- [ ] Second: Phase 2 UI completion
- [ ] Third: Phase 3 domain refactor
- [ ] Fourth: Phase 4 production hardening
