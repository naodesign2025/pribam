require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const canvasRoutes = require('./routes/canvas');

const app = express();

// Ensure uploads directory exists
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

app.get('/', (req, res) => {
  const token = req.cookies.token;
  if (token) {
    return res.redirect('/canvas');
  }
  res.redirect('/auth/login');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\nプリバム起動中! http://localhost:${PORT}\n`);
});
