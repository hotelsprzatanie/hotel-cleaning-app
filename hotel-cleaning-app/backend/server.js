const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());

app.use(session({
  secret: 'hotel-cleaning-secret-2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 8 * 60 * 60 * 1000, // 8 godzin (zmiana po jednej zmianie roboczej)
  },
}));

// Serwuj zdjęcia z folderu uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Trasy API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/common-areas', require('./routes/common-areas'));
app.use('/api/issues', require('./routes/issues'));
app.use('/api/tasks', require('./routes/other-tasks'));
app.use('/api/users', require('./routes/users'));

app.listen(PORT, () => {
  console.log(`Backend działa na http://localhost:${PORT}`);
});
