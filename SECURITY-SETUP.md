# Security setup

## Login & roles
- `admin` can access Products, Promotions, Dashboard, Cashier, and Transactions.
- `kasir` can access Cashier and Transactions only.
- Authentication uses an HTTP-only, signed session cookie.
- Default development credentials are defined by `.env` variables. Do not commit real credentials.

## Environment
Copy `.env.example` to `.env.local` and set strong unique values:

- `AUTH_SECRET`: long random secret (at least 32 characters recommended)
- `Admin`, `super88`
- `Kasir`, `supersuper88`

## HTTPS
When deployed to Vercel, use the HTTPS deployment URL. Vercel provides HTTPS/TLS automatically for deployed domains. For a custom domain, configure it in the Vercel project and use the HTTPS URL.

## Important limitation
The current POS still stores products, transactions, promotions, and cart data in browser `localStorage`. Therefore this version protects the web application/login and role-based navigation, but it is **not a complete server-side POS security model**: a technically skilled user with browser access can inspect localStorage. For production-grade protection of stock and transactions, move the data to a server database/API and enforce role + stock checks on the server/database transaction.

The stock rules have also been tightened in the client app: products with zero stock cannot be added to the cart, quantities cannot exceed available stock, and checkout re-validates stock before completing.
