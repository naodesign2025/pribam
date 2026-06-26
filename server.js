require('dns').setDefaultResultOrder('ipv4first');
require('dotenv').config();

const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const dns = require('dns').promises;

// Pooler URL は IPv4 A レコードあり。setDefaultResultOrder('ipv4first') で十分。
async function resolveDbIPv4() {}

const migrate = require('./db/migrate');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const canvasRoutes = require('./routes/canvas');
const exchangeRoutes = require('./routes/exchange');

const app = express();

// uploads ディレクトリを確保
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/canvas', canvasRoutes);
app.use('/exchange', exchangeRoutes);

app.get('/', (req, res) => {
  const token = req.cookies.token;
  if (token) return res.redirect('/canvas');
  res.redirect('/auth/login');
});

const PORT = process.env.PORT || 3000;

resolveDbIPv4()
  .then(() => migrate())
  .then(() => {
    app.listen(PORT, () => {
      console.log(`\nプリバム起動中! http://localhost:${PORT}\n`);
    });
  })
  .catch((err) => {
    console.error('起動失敗 (DB接続を確認してください):', err.message);
    process.exit(1);
  });
