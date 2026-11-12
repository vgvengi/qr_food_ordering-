const express = require('express');
const { z } = require('zod');
const pool = require('../db');
const payments = require('../payments');
const { emitOrder } = require('../realtime');

const router = express.Router();

const createOrderSchema = z.object({
  tableToken: z.string().min(1).max(20),
  note: z.string().max(255).optional(),
  items: z
    .array(z.object({ menuItemId: z.number().int().positive(), quantity: z.number().int().min(1).max(20) }))
    .min(1)
    .max(50),
});

async function loadOrder(conn, id) {
  const [[order]] = await conn.query(
    `SELECT o.id, o.status, o.total_paise, o.customer_note, o.created_at, t.label AS table_label
       FROM orders o JOIN dining_tables t ON t.id = o.table_id WHERE o.id = ?`,
    [id]
  );
  if (!order) return null;
  const [items] = await conn.query(
    'SELECT name, price_paise, quantity FROM order_items WHERE order_id = ?',
    [id]
  );
  return { ...order, items };
}

// POST /api/orders -> creates a pending order + a Razorpay order. Prices come from the DB, never the client.
router.post('/orders', async (req, res) => {
  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid order', details: parsed.error.issues });
  const { tableToken, note, items } = parsed.data;

  const conn = await pool.getConnection();
  try {
    const [[table]] = await conn.query('SELECT id FROM dining_tables WHERE qr_token = ?', [tableToken]);
    if (!table) return res.status(404).json({ error: 'Unknown table' });

    const ids = [...new Set(items.map((i) => i.menuItemId))];
    const [menuRows] = await conn.query(
      'SELECT id, name, price_paise FROM menu_items WHERE is_available = TRUE AND id IN (?)',
      [ids]
    );
    const byId = new Map(menuRows.map((m) => [m.id, m]));
    if (byId.size !== ids.length) return res.status(400).json({ error: 'Some items are unavailable' });

    const lines = items.map((i) => ({ ...byId.get(i.menuItemId), quantity: i.quantity }));
    const total = lines.reduce((sum, l) => sum + l.price_paise * l.quantity, 0);

    await conn.beginTransaction();
    const [result] = await conn.query(
      'INSERT INTO orders (table_id, total_paise, customer_note) VALUES (?, ?, ?)',
      [table.id, total, note || null]
    );
    const orderId = result.insertId;
    await conn.query(
      'INSERT INTO order_items (order_id, menu_item_id, name, price_paise, quantity) VALUES ?',
      [lines.map((l) => [orderId, l.id, l.name, l.price_paise, l.quantity])]
    );
    const rzpOrder = await payments.createPaymentOrder({ amountPaise: total, receipt: `order_${orderId}` });
    await conn.query('UPDATE orders SET razorpay_order_id = ? WHERE id = ?', [rzpOrder.id, orderId]);
    await conn.commit();

    res.status(201).json({
      orderId,
      totalPaise: total,
      razorpayOrderId: rzpOrder.id,
      razorpayKeyId: payments.keyId,
      mockPayment: payments.mock,
    });
  } catch (err) {
    await conn.rollback().catch(() => {});
    throw err;
  } finally {
    conn.release();
  }
});

const verifySchema = z.object({
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  signature: z.string(),
});

// POST /api/orders/:id/verify -> checks the Razorpay signature, marks the order paid, notifies the kitchen.
router.post('/orders/:id/verify', async (req, res) => {
  const parsed = verifySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid payload' });
  const id = Number(req.params.id);

  const [[order]] = await pool.query('SELECT id, status, razorpay_order_id FROM orders WHERE id = ?', [id]);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.razorpay_order_id !== parsed.data.razorpayOrderId) return res.status(400).json({ error: 'Order mismatch' });
  if (!payments.verifySignature(parsed.data)) return res.status(400).json({ error: 'Payment verification failed' });

  if (order.status === 'pending_payment') {
    await pool.query(
      "UPDATE orders SET status = 'paid', razorpay_payment_id = ? WHERE id = ? AND status = 'pending_payment'",
      [parsed.data.razorpayPaymentId, id]
    );
  }
  const full = await loadOrder(pool, id);
  emitOrder(full);
  res.json(full);
});

// GET /api/orders/:id -> customer tracking page
router.get('/orders/:id', async (req, res) => {
  const order = await loadOrder(pool, Number(req.params.id));
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

// GET /api/kitchen/orders -> paid orders that still need work
router.get('/kitchen/orders', async (_req, res) => {
  const [rows] = await pool.query(
    "SELECT id FROM orders WHERE status IN ('paid','preparing','ready') ORDER BY created_at"
  );
  res.json(await Promise.all(rows.map((r) => loadOrder(pool, r.id))));
});

const NEXT_STATUS = { paid: 'preparing', preparing: 'ready', ready: 'served' };

// PATCH /api/kitchen/orders/:id -> advance status one step
router.patch('/kitchen/orders/:id', async (req, res) => {
  const id = Number(req.params.id);
  const [[order]] = await pool.query('SELECT status FROM orders WHERE id = ?', [id]);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const next = NEXT_STATUS[order.status];
  if (!next) return res.status(409).json({ error: `Cannot advance from ${order.status}` });
  await pool.query('UPDATE orders SET status = ? WHERE id = ? AND status = ?', [next, id, order.status]);
  const full = await loadOrder(pool, id);
  emitOrder(full);
  res.json(full);
});

module.exports = router;
