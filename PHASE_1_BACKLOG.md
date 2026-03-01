# Phase 1 Backlog

This is the concrete implementation backlog for Phase 1 from `PROGRESS.md`.

## Recommended Execution Order

1. Environment validation
2. Request validation with `zod`
3. Status transition and sales-rule hardening
4. Transaction-safety cleanup
5. API response consistency
6. UI and encoding cleanup

## Issue 1: Add Environment Validation On Server Startup

- [ ] Goal: fail fast when required environment variables are missing or malformed
- [ ] Scope
  - Add a startup config module in `server/src`
  - Validate `DATABASE_URL`, `JWT_SECRET`, and optional `PORT`, `CORS_ORIGIN`, `DIRECT_URL`
  - Replace direct `process.env` access in runtime code where practical
- [ ] Files likely involved
  - `server/src/app.js`
  - new `server/src/config/env.js`
  - possibly auth and Prisma-adjacent modules
- [ ] Acceptance criteria
  - Server does not boot with missing `JWT_SECRET`
  - Server logs a clear startup error for invalid config
  - Config defaults are explicit and centralized
- [ ] Recommendation
  - Use `zod` for env parsing too, not only request bodies

## Issue 2: Add Shared Request Validation Middleware

- [ ] Goal: stop invalid payloads before they reach controllers and services
- [ ] Scope
  - Add reusable validation middleware
  - Validate `body`, `params`, and `query`
  - Return normalized `VALIDATION_ERROR` responses
- [ ] Files likely involved
  - new `server/src/middleware/validate.js`
  - new `server/src/validators/*.js`
  - `server/src/routes/*.routes.js`
  - `server/src/middleware/errorHandler.js`
- [ ] Acceptance criteria
  - Invalid request bodies fail before controller logic runs
  - Every write endpoint has schema validation
  - Query validation exists for date-range and pagination endpoints
- [ ] Recommendation
  - Keep validators grouped by domain: `auth`, `materials`, `products`, `sales`, `settings`, `users`, `reports`

## Issue 3: Validate Auth Payloads

- [ ] Goal: lock down login input shape and avoid controller-level ad hoc checks
- [ ] Scope
  - Add schema for `/api/auth/login`
  - Normalize email and enforce non-empty password
- [ ] Files likely involved
  - `server/src/routes/auth.routes.js`
  - `server/src/controllers/auth.controller.js`
  - new `server/src/validators/auth.validators.js`
- [ ] Acceptance criteria
  - Empty or malformed email is rejected by middleware
  - Controller no longer needs basic missing-field checks

## Issue 4: Validate Materials And Purchase Payloads

- [ ] Goal: protect stock and cost records from invalid numbers and malformed writes
- [ ] Scope
  - Add schemas for create and update material
  - Add schema for purchase creation with positive quantity and non-negative unit cost
  - Validate numeric ranges and optional fields
- [ ] Files likely involved
  - `server/src/routes/materials.routes.js`
  - `server/src/controllers/materials.controller.js`
  - new `server/src/validators/materials.validators.js`
- [ ] Acceptance criteria
  - Negative quantities and costs are rejected
  - Material name and unit validation is consistent
  - Update payload allows partial updates without accepting unknown garbage

## Issue 5: Validate Products Payloads

- [ ] Goal: ensure arrangement definitions and BOM writes are structurally sound
- [ ] Scope
  - Add schemas for create product, update product, get cost params, and status update
  - Validate BOM array shape and quantity requirements
  - Prevent duplicate material IDs inside a single BOM submission
- [ ] Files likely involved
  - `server/src/routes/products.routes.js`
  - `server/src/controllers/products.controller.js`
  - new `server/src/validators/products.validators.js`
- [ ] Acceptance criteria
  - Product create and update reject malformed or duplicate BOM rows
  - Status update only accepts supported enum values
  - Product ID params are validated before controller execution

## Issue 6: Validate Sales And Reports Payloads

- [ ] Goal: harden sales entry and reporting filters
- [ ] Scope
  - Add schemas for sale creation and sale payment update
  - Add query schemas for `/sales`, `/reports/revenue`, and `/reports/top-products`
  - Validate pagination and date ranges
- [ ] Files likely involved
  - `server/src/routes/sales.routes.js`
  - `server/src/routes/reports.routes.js`
  - `server/src/controllers/sales.controller.js`
  - `server/src/controllers/reports.controller.js`
  - new `server/src/validators/sales.validators.js`
  - new `server/src/validators/reports.validators.js`
- [ ] Acceptance criteria
  - Sale quantity must be a positive integer
  - Payment updates only allow known payment statuses
  - Invalid date ranges return validation errors, not runtime date behavior

## Issue 7: Validate Settings And Users Payloads

- [ ] Goal: make admin operations predictable and safe
- [ ] Scope
  - Add schemas for user create and update
  - Add schema for settings update with key and value rules
  - Restrict setting keys to known keys unless extensibility is intentional
- [ ] Files likely involved
  - `server/src/routes/settings.routes.js`
  - `server/src/routes/users.routes.js`
  - `server/src/controllers/settings.controller.js`
  - `server/src/controllers/users.controller.js`
  - new `server/src/validators/settings.validators.js`
  - new `server/src/validators/users.validators.js`
- [ ] Acceptance criteria
  - Unknown roles are rejected
  - User create requires name, email, and password
  - Settings writes are constrained to approved keys

## Issue 8: Enforce Product Status State Machine

- [ ] Goal: stop illegal production transitions from corrupting stock flow
- [ ] Scope
  - Define allowed transitions explicitly
  - Reject unsupported transitions in the products domain
  - Preserve reservation side effects only for valid state changes
- [ ] Files likely involved
  - `server/src/controllers/products.controller.js`
  - possibly new `server/src/services/product-status.service.js`
  - `shared/constants.js`
- [ ] Acceptance criteria
  - `PENDING -> IN_PRODUCTION` is allowed
  - `IN_PRODUCTION -> COMPLETED` is allowed
  - `IN_PRODUCTION -> CANCELLED` is allowed
  - Invalid jumps such as `PENDING -> COMPLETED` are rejected unless intentionally allowed and documented
- [ ] Recommendation
  - Keep transition rules in one place rather than embedding conditionals in the controller

## Issue 9: Define Sale Eligibility Rules

- [ ] Goal: prevent sales that bypass inventory or fulfillment rules
- [ ] Scope
  - Decide whether a sale can occur for `PENDING` or `IN_PRODUCTION` products
  - Enforce that rule centrally in `sales.service.js`
  - If made-to-order sales are allowed, define how stock is reserved or consumed
- [ ] Files likely involved
  - `server/src/services/sales.service.js`
  - `server/src/controllers/sales.controller.js`
  - `server/src/controllers/products.controller.js`
  - `PROGRESS.md` or `README.md` for rule clarification
- [ ] Acceptance criteria
  - Sale creation has an explicit eligibility rule
  - Invalid sale attempts return a business-rule error, not silent acceptance
- [ ] Recommendation
  - Short-term safe option: allow sales only for products already marked `COMPLETED`

## Issue 10: Make Costing Reads Transaction-Safe

- [ ] Goal: remove inconsistent read behavior inside transactional sale flows
- [ ] Scope
  - Refactor costing functions to accept a Prisma client or transaction client
  - Ensure `calculateProductionCost` can use the same transaction as `createSale`
  - Review all service reads that currently fall back to the global Prisma client
- [ ] Files likely involved
  - `server/src/services/costing.service.js`
  - `server/src/services/sales.service.js`
  - `server/src/services/inventory.service.js`
- [ ] Acceptance criteria
  - `createSale` does not mix transaction work with global Prisma reads
  - Cost calculation and setting lookup can run within one transaction context
- [ ] Recommendation
  - Standardize service signatures to accept `db = prisma`

## Issue 11: Normalize API Error Contracts

- [ ] Goal: make all client-visible error payloads consistent
- [ ] Scope
  - Standardize error shape across auth middleware, RBAC middleware, validators, and controller-thrown errors
  - Ensure duplicate and not-found Prisma errors map cleanly
  - Optionally add request path and timestamp for debugging
- [ ] Files likely involved
  - `server/src/middleware/errorHandler.js`
  - `server/src/middleware/auth.js`
  - `server/src/middleware/rbac.js`
  - new validation middleware
- [ ] Acceptance criteria
  - All 4xx and 5xx responses use the same top-level structure
  - Frontend can rely on `error.code` and `error.message`

## Issue 12: Fix Product Cost Display Mismatch In The UI

- [ ] Goal: stop the client from estimating arrangement cost from incomplete data
- [ ] Scope
  - Either include material cost fields in `/products`
  - Or remove inline estimation from the products list and use `/products/:id/cost`
  - Align displayed margin logic with backend costing method
- [ ] Files likely involved
  - `client/src/pages/Products.jsx`
  - `server/src/controllers/products.controller.js`
  - `server/src/services/costing.service.js`
- [ ] Acceptance criteria
  - Product list does not show misleading cost or margin values
  - Cost displayed in UI matches the active backend costing rule
- [ ] Recommendation
  - Preferred: request cost previews from the backend instead of duplicating costing math in the client

## Issue 13: Clean Up Text Encoding And Display Issues

- [ ] Goal: remove corrupted symbols and improve polish in docs and UI text
- [ ] Scope
  - Replace malformed peso signs and special characters where encoding is broken
  - Normalize README character encoding
  - Check seeded console logs and selected UI labels
- [ ] Files likely involved
  - `README.md`
  - `client/src/pages/*.jsx`
  - `server/prisma/seed.js`
  - `server/src/app.js`
- [ ] Acceptance criteria
  - README renders cleanly
  - UI currency and status text display correctly
  - Seed logs are readable in the terminal

## Suggested Sprint Breakdown

### Sprint A

- [ ] Issue 1: environment validation
- [ ] Issue 2: shared validation middleware
- [ ] Issue 3: auth validation
- [ ] Issue 4: materials and purchases validation

### Sprint B

- [ ] Issue 5: product validation
- [ ] Issue 6: sales and reports validation
- [ ] Issue 7: settings and users validation
- [ ] Issue 11: error contract normalization

### Sprint C

- [ ] Issue 8: product status state machine
- [ ] Issue 9: sale eligibility rules
- [ ] Issue 10: transaction-safety cleanup
- [ ] Issue 12: product cost display mismatch
- [ ] Issue 13: encoding cleanup

## Best First Build

- [ ] Start with Issues 1, 2, 6, 8, 9, and 10 if only one focused stabilization pass is possible
  - Reason: those items protect money, stock, and operational correctness first.
