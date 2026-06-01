const express = require('express');
const router = express.Router();
const { db } = require('../db/database');

router.post('/login', (req, res) => {
  const { pin } = req.body;

  if (!pin || typeof pin !== 'string' || !/^\d{4}$/.test(pin)) {
    return res.status(400).json({ error: 'PIN musi mieć dokładnie 4 cyfry' });
  }

  const user = db.get('users').find({ pin }).value();
  if (!user) {
    return res.status(401).json({ error: 'Nieprawidłowy PIN' });
  }

  req.session.user = { id: user.id, name: user.name, role: user.role };
  res.json({ id: user.id, name: user.name, role: user.role });
});

router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ ok: true });
});

router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Niezalogowany' });
  }
  res.json(req.session.user);
});

module.exports = router;
