# UI Changes Prompt

Use this prompt when continuing the frontend completion work for this repository.

## Prompt

Update the UI of this POS and inventory system to match the current backend and close the remaining workflow gaps without changing the visual language already established in the app.

Context:

- The frontend is React + Vite + Ant Design in `client/src`
- The backend already supports auth, users, materials, products, product status updates, sales, sales payment updates, reports, and settings
- The design direction is warm, atelier-style, parchment-toned, and should stay consistent with the existing palette in `client/src/index.css`
- The app is role-based with `ADMIN`, `MANAGER`, and `STAFF`

Current UI expectations:

- Keep the current terracotta, sage, parchment color system
- Preserve the current sidebar/header shell instead of redesigning from scratch
- Avoid generic dashboard templates or mismatched SaaS styling

Implement or improve these areas:

1. Role-aware client UX
   - Filter navigation by role
   - Protect routes by role
   - Give `STAFF` a valid default landing screen that does not depend on manager-only reports

2. Users management
   - Add a proper `/users` screen
   - Support list, create, edit, deactivate flows
   - Keep manager behavior read-only if backend permissions remain unchanged

3. Arrangements workflow
   - Surface production status and payment status in the list
   - Add visible controls for updating status
   - Improve the base-cost display so it no longer implies precision the API does not currently provide

4. Sales workflow
   - Add payment-status update controls for existing sales
   - Keep the new-sale flow fast and readable
   - Preserve backend-driven cost/profit behavior

5. Admin flow cohesion
   - Link settings and user administration cleanly
   - Make restricted states explicit instead of silently failing

6. Polish pass
   - Replace mojibake and broken currency symbols
   - Tighten responsive layout issues on inventory, products, sales, reports, and users

Constraints:

- Do not invent backend endpoints that do not already exist
- Keep calculations on the backend for authoritative values
- Reuse existing components and patterns where practical
- Prefer small, composable client changes over a broad rewrite

Key files to inspect first:

- `client/src/App.jsx`
- `client/src/components/layout/AppLayout.jsx`
- `client/src/components/layout/Sidebar.jsx`
- `client/src/components/layout/ProtectedRoute.jsx`
- `client/src/pages/Inventory.jsx`
- `client/src/pages/Products.jsx`
- `client/src/pages/Sales.jsx`
- `client/src/pages/Reports.jsx`
- `client/src/pages/Settings.jsx`
- `client/src/pages/Users.jsx`
- `client/src/store/authStore.js`
- `client/src/index.css`

Desired output:

- Production-usable UI changes committed in code
- Short change summary
- Any remaining API constraints or blockers called out explicitly
