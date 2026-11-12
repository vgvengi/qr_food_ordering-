const express = require('express');
const pool = require('../db');

const router = express.Router();

// GET /api/tables/:token -> resolves the QR token to a table
router.get('/tables/:token', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, label FROM dining_tables WHERE qr_token = ?',
    [req.params.token]
  );
  if (!rows.length) return res.status(404).json({ error: 'Unknown table' });
  res.json(rows[0]);
});

// GET /api/menu -> categories with their available items
router.get('/menu', async (_req, res) => {
  const [categories] = await pool.query(
    'SELECT id, name FROM categories ORDER BY sort_order'
  );
  const [items] = await pool.query(
    `SELECT id, category_id, name, description, price_paise, is_veg, image_url
       FROM menu_items WHERE is_available = TRUE ORDER BY id`
  );
  res.json(
    categories.map((c) => ({
      ...c,
      items: items.filter((i) => i.category_id === c.id),
    }))
  );
});

module.exports = router;
