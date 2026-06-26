const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

// GET /auth/login
router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// POST /auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.render('login', { error: 'メールアドレスまたはパスワードが違うよ！' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.render('login', { error: 'メールアドレスまたはパスワードが違うよ！' });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
    });

    res.redirect('/canvas');
  } catch (err) {
    console.error(err);
    res.render('login', { error: 'エラーが発生したよ。もう一度試してね！' });
  }
});

// GET /auth/register
router.get('/register', (req, res) => {
  res.render('register', { error: null });
});

// POST /auth/register
router.post('/register', async (req, res) => {
  const { username, email, password, password_confirm } = req.body;

  if (password !== password_confirm) {
    return res.render('register', { error: 'パスワードが一致しないよ！' });
  }
  if (password.length < 6) {
    return res.render('register', { error: 'パスワードは6文字以上にしてね！' });
  }

  try {
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.render('register', { error: 'このメールアドレスはすでに使われてるよ！' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
      [username, email, password_hash]
    );

    const token = jwt.sign(
      { userId: result.rows[0].id, username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
    });

    res.redirect('/profile/create');
  } catch (err) {
    console.error(err);
    res.render('register', { error: 'エラーが発生したよ。もう一度試してね！' });
  }
});

// GET /auth/logout
router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/auth/login');
});

module.exports = router;
