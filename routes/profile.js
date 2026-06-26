const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../db');
const requireAuth = require('../middleware/auth');
const { uploadIcon, deleteIcon } = require('../lib/storage');

// Multer setup — メモリストレージ（Supabase Storage にアップロード）
const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('画像ファイル（JPG/PNG/GIF/WebP）のみアップロードできるよ！'));
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// GET /profile — マイページ or リダイレクト
router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM profiles WHERE user_id = $1',
      [req.user.userId]
    );
    if (result.rows.length === 0) {
      return res.redirect('/profile/create');
    }
    res.redirect(`/profile/view/${req.user.userId}`);
  } catch (err) {
    console.error(err);
    res.redirect('/profile/create');
  }
});

// GET /profile/create
router.get('/create', requireAuth, async (req, res) => {
  try {
    const existing = await db.query(
      'SELECT id FROM profiles WHERE user_id = $1',
      [req.user.userId]
    );
    if (existing.rows.length > 0) {
      return res.redirect(`/profile/edit`);
    }
    res.render('profile-create', { user: req.user, error: null });
  } catch (err) {
    console.error(err);
    res.render('profile-create', { user: req.user, error: 'DBエラーが発生したよ。Supabaseのテーブルが作成されているか確認してね！' });
  }
});

// POST /profile/create
router.post('/create', requireAuth, upload.single('icon'), async (req, res) => {
  try {
    const {
      nickname, birthday, blood_type,
      favorite_food, favorite_type,
      treasure, want_now,
      best3_1, best3_2, best3_3,
      moshimo_q, moshimo_a,
      free_space, love_status, love_comment,
    } = req.body;

    let icon_url = null;
    if (req.file) {
      const ext = path.extname(req.file.originalname).toLowerCase();
      icon_url = await uploadIcon(req.user.userId, req.file.buffer, req.file.mimetype, ext);
    }

    const best3 = JSON.stringify([best3_1 || '', best3_2 || '', best3_3 || '']);
    const moshimo = JSON.stringify([{ question: moshimo_q || '', answer: moshimo_a || '' }]);

    await db.query(
      `INSERT INTO profiles
        (user_id, icon_url, nickname, birthday, blood_type,
         favorite_food, favorite_type, treasure, want_now,
         best3, moshimo, free_space, love_status, love_comment)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [
        req.user.userId, icon_url, nickname, birthday, blood_type,
        favorite_food, favorite_type, treasure, want_now,
        best3, moshimo, free_space, love_status, love_comment,
      ]
    );

    res.redirect(`/profile/view/${req.user.userId}`);
  } catch (err) {
    console.error(err);
    res.render('profile-create', { user: req.user, error: 'エラーが発生したよ。もう一度試してね！' });
  }
});

// GET /profile/edit
router.get('/edit', requireAuth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM profiles WHERE user_id = $1',
      [req.user.userId]
    );
    if (result.rows.length === 0) {
      return res.redirect('/profile/create');
    }
    const profile = result.rows[0];
    profile.best3 = typeof profile.best3 === 'string' ? JSON.parse(profile.best3) : (profile.best3 || ['', '', '']);
    profile.moshimo = typeof profile.moshimo === 'string' ? JSON.parse(profile.moshimo) : (profile.moshimo || [{ question: '', answer: '' }]);
    res.render('profile-edit', { user: req.user, profile, error: null });
  } catch (err) {
    console.error(err);
    res.redirect('/profile');
  }
});

// POST /profile/edit
router.post('/edit', requireAuth, upload.single('icon'), async (req, res) => {
  try {
    const {
      nickname, birthday, blood_type,
      favorite_food, favorite_type,
      treasure, want_now,
      best3_1, best3_2, best3_3,
      moshimo_q, moshimo_a,
      free_space, love_status, love_comment,
      existing_icon,
    } = req.body;

    let icon_url = existing_icon || null;

    if (req.file) {
      if (existing_icon) await deleteIcon(existing_icon);
      const ext = path.extname(req.file.originalname).toLowerCase();
      icon_url = await uploadIcon(req.user.userId, req.file.buffer, req.file.mimetype, ext);
    }

    const best3 = JSON.stringify([best3_1 || '', best3_2 || '', best3_3 || '']);
    const moshimo = JSON.stringify([{ question: moshimo_q || '', answer: moshimo_a || '' }]);

    await db.query(
      `UPDATE profiles SET
        icon_url=$1, nickname=$2, birthday=$3, blood_type=$4,
        favorite_food=$5, favorite_type=$6, treasure=$7, want_now=$8,
        best3=$9, moshimo=$10, free_space=$11, love_status=$12, love_comment=$13,
        updated_at=NOW()
       WHERE user_id=$14`,
      [
        icon_url, nickname, birthday, blood_type,
        favorite_food, favorite_type, treasure, want_now,
        best3, moshimo, free_space, love_status, love_comment,
        req.user.userId,
      ]
    );

    res.redirect(`/profile/view/${req.user.userId}`);
  } catch (err) {
    console.error(err);
    const result = await db.query('SELECT * FROM profiles WHERE user_id = $1', [req.user.userId]);
    const profile = result.rows[0] || {};
    profile.best3 = typeof profile.best3 === 'string' ? JSON.parse(profile.best3) : ['', '', ''];
    profile.moshimo = typeof profile.moshimo === 'string' ? JSON.parse(profile.moshimo) : [{ question: '', answer: '' }];
    res.render('profile-edit', { user: req.user, profile, error: 'エラーが発生したよ。もう一度試してね！' });
  }
});

// GET /profile/view/:userId — プロフィール閲覧（公開）
router.get('/view/:userId', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT p.*, u.username
       FROM profiles p
       JOIN users u ON u.id = p.user_id
       WHERE p.user_id = $1`,
      [req.params.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).send('プロフィールが見つからないよ！');
    }
    const profile = result.rows[0];
    profile.best3 = typeof profile.best3 === 'string' ? JSON.parse(profile.best3) : (profile.best3 || ['', '', '']);
    profile.moshimo = typeof profile.moshimo === 'string' ? JSON.parse(profile.moshimo) : (profile.moshimo || [{ question: '', answer: '' }]);

    let isOwner = false;
    const token = req.cookies && req.cookies.token;
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        isOwner = decoded.userId === parseInt(req.params.userId, 10);
      } catch (_) {}
    }

    res.render('profile-view', { profile, isOwner });
  } catch (err) {
    console.error(err);
    res.status(500).send('エラーが発生したよ！');
  }
});

module.exports = router;
