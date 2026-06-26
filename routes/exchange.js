const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const db = require('../db');
const requireAuth = require('../middleware/auth');

// 交換済みか確認するヘルパー
async function isExchanged(userId, targetId) {
  const minId = Math.min(userId, targetId);
  const maxId = Math.max(userId, targetId);
  const result = await db.query(
    'SELECT id FROM exchanges WHERE user_a = $1 AND user_b = $2',
    [minId, maxId]
  );
  return result.rows.length > 0;
}

// GET /exchange — QRコード表示 + スキャナー
router.get('/', requireAuth, async (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const exchangeUrl = `${baseUrl}/exchange/scan/${req.user.userId}`;

  const qrDataUrl = await QRCode.toDataURL(exchangeUrl, {
    width: 260,
    margin: 2,
    color: { dark: '#333333', light: '#ffffff' },
  });

  res.render('exchange', { user: req.user, qrDataUrl, exchangeUrl });
});

// GET /exchange/scan/:targetId — スキャン後の確認画面
router.get('/scan/:targetId', requireAuth, async (req, res) => {
  const targetId = parseInt(req.params.targetId, 10);

  if (!targetId || isNaN(targetId)) {
    return res.render('exchange-confirm', {
      user: req.user, target: null,
      error: '無効なQRコードだよ！', alreadyExchanged: false,
    });
  }

  if (targetId === req.user.userId) {
    return res.render('exchange-confirm', {
      user: req.user, target: null,
      error: '自分自身とは交換できないよ！', alreadyExchanged: false,
    });
  }

  try {
    const profileResult = await db.query(
      `SELECT p.*, u.username FROM profiles p
       JOIN users u ON u.id = p.user_id
       WHERE p.user_id = $1`,
      [targetId]
    );

    if (profileResult.rows.length === 0) {
      return res.render('exchange-confirm', {
        user: req.user, target: null,
        error: 'このユーザーのプロフィールが見つからないよ！', alreadyExchanged: false,
      });
    }

    const target = profileResult.rows[0];
    const alreadyExchanged = await isExchanged(req.user.userId, targetId);

    res.render('exchange-confirm', {
      user: req.user, target, error: null, alreadyExchanged,
    });
  } catch (err) {
    console.error(err);
    res.render('exchange-confirm', {
      user: req.user, target: null,
      error: 'エラーが発生したよ。もう一度試してね！', alreadyExchanged: false,
    });
  }
});

// POST /exchange/execute — 交換実行
router.post('/execute', requireAuth, async (req, res) => {
  const targetId = parseInt(req.body.target_id, 10);

  if (!targetId || isNaN(targetId) || targetId === req.user.userId) {
    return res.redirect('/exchange');
  }

  const minId = Math.min(req.user.userId, targetId);
  const maxId = Math.max(req.user.userId, targetId);

  try {
    // すでに交換済みでもエラーにしない（ON CONFLICT DO NOTHING）
    await db.query(
      'INSERT INTO exchanges (user_a, user_b) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [minId, maxId]
    );
    res.redirect('/canvas');
  } catch (err) {
    console.error(err);
    res.redirect('/exchange');
  }
});

module.exports = router;
