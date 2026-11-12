const express = require('express');
const cors = require('cors');
const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/orders');

const app = express();
const origins = (process.env.CLIENT_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean);
app.use(cors({ origin: origins }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api', menuRoutes);
app.use('/api', orderRoutes);

// Express 5 forwards rejected promises here automatically.
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
