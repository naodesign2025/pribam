const express = require('express');
const router = express.Router();
const db = require('../db');
const requireAuth = require('../middleware/auth');

// GET /canvas — キャンバス画面
router.get('/', requireAuth, (req, res) => {
  res.render('canvas', { user: req.user });
});

// GET /canvas/data — アイコン + 位置情報 JSON
router.get('/data', requireAuth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT
         p.user_id,
         p.nickname,
         p.icon_url,
         cp.x,
         cp.y
       FROM profiles p
       LEFT JOIN canvas_positions cp
         ON cp.owner_id = $1 AND cp.target_id = p.user_id
       WHERE p.user_id != $1
       ORDER BY p.created_at ASC`,
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'エラーが発生したよ' });
  }
});

// POST /canvas/position — 位置を保存
router.post('/position', requireAuth, express.json(), async (req, res) => {
  const { target_id, x, y } = req.body;
  if (!target_id || x == null || y == null) {
    return res.status(400).json({ error: 'パラメーターが足りないよ' });
  }
  try {
    await db.query(
      `INSERT INTO canvas_positions (owner_id, target_id, x, y)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (owner_id, target_id)
       DO UPDATE SET x = $3, y = $4, updated_at = NOW()`,
      [req.user.userId, target_id, Math.round(x), Math.round(y)]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'エラーが発生したよ' });
  }
});

module.exports = router;
