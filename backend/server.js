const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');

const app  = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

// Railway/Heroku terminują HTTPS przed serwerem — trust proxy żeby secure cookies działały
if (isProd) app.set('trust proxy', 1);

// W produkcji frontend jest serwowany przez ten sam serwer
// więc CORS dotyczy tylko devu
if (!isProd) {
  app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
}

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'hotel-cleaning-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProd,                   // HTTPS na Railway
    maxAge: 8 * 60 * 60 * 1000,
  },
}));

// Zdjęcia z folderu uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Trasy API
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/rooms',        require('./routes/rooms'));
app.use('/api/common-areas', require('./routes/common-areas'));
app.use('/api/issues',       require('./routes/issues'));
app.use('/api/tasks',        require('./routes/other-tasks'));
app.use('/api/users',        require('./routes/users'));
app.use('/api/statistics',   require('./routes/statistics'));

// W produkcji serwuj zbudowany frontend
if (isProd) {
  const distPath = path.join(__dirname, '..', 'frontend', 'dist');
  app.use(express.static(distPath));
  // Wszystkie nieznane ścieżki → index.html (React Router)
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Serwer działa na porcie ${PORT} [${isProd ? 'produkcja' : 'development'}]`);
});
