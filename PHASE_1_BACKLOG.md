# Phase 1 Backlog

This backlog is scoped to the highest-value stabilization work based on the current codebase.

## Priority Order

1. Request validation
2. Sale and status rule enforcement
3. Transaction-safety cleanup
4. Client/server UI mismatches
5. Config and error-contract cleanup
6. Encoding cleanup

## 1. Add Server Config Validation

- [ ] Goal: fail fast when required environment variables are missing or malformed
- [ ] Why now
  - `server/src/app.js` reads `process.env` directly
  - `JWT_SECRET` and database URLs are required by runtime behavior but not validated centrally
- [ ] Scope
  - Add a config module in `server/src/config`
  - Parse `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `PORT`, and `CORS_ORIGIN`
  - Replace direct runtime env reads where practical
- [ ] Acceptance criteria
  - Server refuses to boot without required secrets
  - Startup errors are explicit and actionable

## 2. Add Shared Validation Middleware

- [ ] Goal: stop malformed input before controllers and services run
- [ ] Why now
  - Most controllers still do basic manual checks only
  - Routes currently accept invalid enums, weak date inputs, and arbitrary payload shapes
- [ ] Scope
  - Add a reusable `validate` middleware
  - Support `body`, `params`, and `query`
  - Add route-level schemas by domain
- [ ] Acceptance criteria
  - Write endpoints do not rely on controller ad hoc required-field checks
  - Invalid query params return validation errors instead of weak runtime behavior

## 3. Validate Auth Payloads

- [ ] Scope
  - Add schema for `POST /api/auth/login`
  - Normalize email input and require non-empty password
- [ ] Acceptance criteria
  - Missing or invalid email/password is rejected before controller logic

## 4. Validate Materials And Purchases

- [ ] Scope
  - Add schemas for create/update material
  - Add purchase schema with positive quantity and non-negative unit cost
  - Reject unknown payload fields if that is the chosen contract
- [ ] Acceptance criteria
  - Negative stock-related values are rejected
  - Material writes have consistent field rules

## 5. Validate Products

- [ ] Scope
  - Add schemas for create/update product, `:id` params, cost preview params, and status updates
  - Validate BOM array shape and quantity rules
  - Reject duplicate `materialId` rows in one BOM submission
- [ ] Acceptance criteria
  - Invalid or duplicate BOM payloads never reach transaction logic
  - Status update payload accepts only known enum values

## 6. Validate Sales, Reports, Settings, And Users

- [ ] Scope
  - Sales create schema with positive integer quantity
  - Sales payment update schema with supported statuses only
  - Report query schemas for dates and limits
  - Settings and users schemas, including role validation
- [ ] Acceptance criteria
  - Date parsing and pagination inputs are constrained
  - Unknown roles and malformed settings writes are rejected

## 7. Enforce Product Status Transitions

- [ ] Goal: make inventory side effects deterministic and safe
- [ ] Why now
  - `updateProductStatus` currently performs side effects for a few transitions but does not reject invalid jumps
- [ ] Scope
  - Centralize allowed transitions
  - Reject unsupported transitions explicitly
  - Keep reservation/deduction/release logic aligned to valid transitions only
- [ ] Acceptance criteria
  - `PENDING -> IN_PRODUCTION` allowed
  - `IN_PRODUCTION -> COMPLETED` allowed
  - `IN_PRODUCTION -> CANCELLED` allowed
  - Invalid jumps return a business-rule error

## 8. Define Sale Eligibility Rules

- [ ] Goal: stop sales from bypassing fulfillment rules
- [ ] Why now
  - `sales.service.createSale` does not check product production status
- [ ] Scope
  - Decide which statuses are sellable
  - Enforce the rule in `sales.service.js`
  - Document the rule in the README or progress docs
- [ ] Acceptance criteria
  - Invalid sale attempts fail with a clear business error
  - Sales flow behavior is explicit and consistent

## 9. Make Cost Calculation Transaction-Safe

- [ ] Goal: keep sale creation reads and writes in the same transaction context
- [ ] Why now
  - `createSale` uses a transaction
  - `calculateProductionCost` currently reads through the global Prisma client
- [ ] Scope
  - Allow costing services to accept `db = prisma`
  - Use the transaction client from sale creation
  - Review related service functions for the same pattern
- [ ] Acceptance criteria
  - Sale creation does not mix transaction-bound writes with out-of-transaction cost reads

## 10. Normalize Error Contracts

- [ ] Goal: make client error handling reliable
- [ ] Why now
  - Auth, RBAC, controller errors, and Prisma failures are not fully standardized
- [ ] Scope
  - Standardize response shape for 4xx and 5xx
  - Map known Prisma failure cases cleanly
  - Keep validation errors consistent with business-rule errors
- [ ] Acceptance criteria
  - Client can rely on stable `error.code` and `error.message`

## 11. Fix Product Cost Display In The Client

- [ ] Goal: remove misleading cost and margin values from the arrangements list
- [ ] Why now
  - `GET /api/products` does not return unit-cost fields used by `client/src/pages/Products.jsx`
- [ ] Scope
  - Either enrich the products list payload with cost data
  - Or stop estimating cost in the list and fetch previews only when needed
- [ ] Acceptance criteria
  - Products list no longer shows bogus zero or incomplete margin values

## 12. Surface Product Status Management In The UI

- [ ] Goal: close a direct API/UI gap already present in the code
- [ ] Why now
  - The products page has status modal state and submit logic, but no visible table action opens it
- [ ] Scope
  - Add a status action in the arrangements table
  - Show current production/payment status clearly
- [ ] Acceptance criteria
  - A user can execute the implemented status endpoint from the client

## 13. Resolve Staff Dashboard Access

- [ ] Goal: avoid a broken first screen for staff accounts
- [ ] Why now
  - The dashboard screen requests `/api/reports/dashboard`
  - That route is currently restricted to `ADMIN` and `MANAGER`
- [ ] Scope
  - Either loosen backend access for a staff-safe KPI subset
  - Or change the client landing/dashboard behavior for staff users
- [ ] Acceptance criteria
  - A valid staff login reaches a usable first screen without authorization errors

## 14. Clean Up Encoding Issues

- [ ] Goal: remove mojibake from UI and terminal output
- [ ] Scope
  - Fix peso signs and corrupted symbols in client pages
  - Fix seed and server log strings
- [ ] Acceptance criteria
  - UI labels render cleanly
  - Seed output is readable in the terminal

## Suggested First Sprint

- [ ] Server config validation
- [ ] Shared validation middleware
- [ ] Product, sales, and report schemas
- [ ] Product status transition rules
- [ ] Sale eligibility enforcement
- [ ] Costing transaction-safety cleanup

## Suggested Second Sprint

- [ ] Error contract normalization
- [ ] Products page cost display fix
- [ ] Product status UI
- [ ] Staff dashboard access fix
- [ ] Encoding cleanup
