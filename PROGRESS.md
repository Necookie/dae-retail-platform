# Project Progress And Next Phases

This file is based on the current repository state, `README.md`, and the documentation assets present in `documentation/`.

## Current Codebase Snapshot

### Implemented

- [x] Monorepo-style split between `client`, `server`, and `shared`
- [x] React + Vite frontend with Ant Design layout and authenticated routes
- [x] Express + Prisma backend with PostgreSQL schema and seed script
- [x] JWT login flow with role values for `ADMIN`, `MANAGER`, and `STAFF`
- [x] Raw materials CRUD plus purchase history and weighted-average cost updates
- [x] Product or arrangement CRUD with BOM (`product_materials`) support
- [x] Sale recording with revenue, profit, and material cost snapshots
- [x] Inventory reservation lifecycle service for `IN_PRODUCTION`, `COMPLETED`, and `CANCELLED`
- [x] Dashboard, sales history, reports, and settings pages
- [x] Report endpoints for dashboard KPIs, revenue summary, top products, and inventory value
- [x] Seed data for one admin, sample materials, one arrangement, and base system settings

### Present But Incomplete

- [x] Backend user management routes exist
- [ ] Frontend user management page does not exist
- [x] Role-based authorization exists on the API
- [ ] Frontend navigation and route visibility are not role-aware
- [x] `zod` is installed on the server
- [ ] Request validation schemas are not implemented
- [x] Inventory reservation services exist
- [ ] Product status management is not fully surfaced in the UI

## Structure Summary

- `client/src/pages`
  - `Dashboard`, `Inventory`, `Products`, `Sales`, `Reports`, `Settings`, `Login`
- `server/src`
  - `routes`, `controllers`, `services`, `middleware`, `utils`
- `server/prisma`
  - schema, migration, and seed
- `shared/constants.js`
  - shared business enums and setting keys

## Main Recommendations

- [ ] Separate catalog products from production jobs or customer orders
  - Recommendation: keep `Product` as the reusable arrangement template and introduce a new production or order entity for status, reservations, and fulfillment.
  - Reason: the current model mixes product catalog data with live operational state, which will become limiting as soon as one arrangement can be produced or sold multiple times.

- [ ] Stabilize backend correctness before expanding features
  - Recommendation: add request validation, service-level business rule checks, and transaction-safe reads.
  - Reason: the current backend already handles money, costing, and stock; correctness matters more than adding more pages.

- [ ] Close the API/UI mismatch next
  - Recommendation: expose user management, product status actions, transaction history, and role-aware navigation in the client.
  - Reason: several backend capabilities are already implemented but not yet operable from the frontend.

- [ ] Add production-readiness work before broader rollout
  - Recommendation: introduce tests, environment validation, logging standards, and deployment docs.
  - Reason: there are currently no automated tests and no clear release safety net.

## Phase 1: Core Stabilization

- [ ] Add `zod` request schemas for auth, materials, purchases, products, sales, settings, and users
- [ ] Validate enum transitions for production and payment statuses on the backend
- [ ] Prevent invalid sales flows
  - Recommendation: require clear fulfillment rules, such as only selling completed production items or explicitly supporting made-to-order sales.
- [ ] Make all costing and inventory reads transaction-safe
  - Recommendation: avoid mixing global Prisma reads inside transaction-based workflows.
- [ ] Standardize API error payloads and validation messages
- [ ] Add environment checks for required secrets and database URLs on startup
- [ ] Fix obvious UI/backend data mismatches
  - Recommendation: the products table currently estimates cost from fields not fully returned by the products API.
- [ ] Clean up text encoding issues in docs and UI strings

## Phase 2: Operational Completeness

- [ ] Add a Users page for admin account management
- [ ] Add product status controls in the UI for `PENDING`, `IN_PRODUCTION`, `COMPLETED`, and `CANCELLED`
- [ ] Add payment-status update controls for existing sales
- [ ] Add transaction history or stock movement screens
- [ ] Show role-based menus and route guards on the frontend
- [ ] Add material-level manual cost editing UX that matches the costing-method setting
- [ ] Add low-stock actions
  - Recommendation: include reorder views, restock shortcuts, and better supplier capture.

## Phase 3: Domain Refactor

- [ ] Split arrangement templates from production instances or customer orders
- [ ] Introduce explicit order lifecycle states
  - Recommendation: quote, confirmed, in production, fulfilled, cancelled, refunded.
- [ ] Support producing and selling multiple units cleanly without overloading the `Product` record
- [ ] Revisit reservation records so they point to a production job or order, not only the catalog product
- [ ] Add audit-friendly links between sales, reservations, transactions, and fulfillment records

## Phase 4: Reporting And Decision Support

- [ ] Add filters and export support for reports
- [ ] Add trend charts for daily, weekly, and monthly revenue and profit
- [ ] Add margin analysis by arrangement and by material
- [ ] Add aging views for unpaid and partially paid sales
- [ ] Add forecasting or reorder recommendation reports based on actual usage

## Phase 5: Release Readiness

- [ ] Add backend tests for costing, reservations, sales snapshots, and reporting
- [ ] Add frontend smoke tests for login and core workflows
- [ ] Add seeded demo scenarios that cover multiple arrangements and sales cases
- [ ] Add a deployment section for production database, environment variables, and backup strategy
- [ ] Add CI checks for install, Prisma generation, build, and tests
- [ ] Add observability basics
  - Recommendation: request logging, error tracking, and database migration discipline.

## Suggested Delivery Order

- [ ] First deliver Phase 1 before broadening scope
- [ ] Then finish the missing operational UI in Phase 2
- [ ] Then do the domain refactor in Phase 3 before scale introduces data-model debt
- [ ] Then expand reporting and release readiness in Phases 4 and 5

## Practical Priority

- [ ] Highest priority: backend validation, sales and inventory rules, transaction safety
- [ ] High priority: user management UI, product status UI, role-aware frontend
- [ ] Medium priority: reporting depth and exports
- [ ] Medium priority: deployment, CI, and automated tests
- [ ] Strategic priority: split catalog products from production or order records
