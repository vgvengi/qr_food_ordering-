# TableTap: QR food ordering

Scan the QR on a restaurant table, order from your phone, pay with Razorpay. The kitchen board and the customer's order tracker update live over Socket.IO.

- `web/`: Next.js 15 + React 19 + Tailwind (customer menu, order tracking, kitchen board)
- `server/`: Express 5 + MySQL + Socket.IO (menu, orders, Razorpay payment verification, live order events)

## Run locally
```bash
# 1. Database (MySQL 8 or MariaDB)
cd server && mysql -u root -p < db/schema.sql && mysql -u root -p < db/seed.sql
# 2. API
cp .env.example .env   # fill DB creds; Razorpay keys optional (without them payments run in mock mode)
npm install && npm run dev            # http://localhost:4000
# 3. Web
cd ../web && cp .env.example .env.local && npm install && npm run dev   # http://localhost:3000
```
Open http://localhost:3000, pick a table, order, then open /kitchen.
