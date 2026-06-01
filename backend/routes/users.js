const express = require('express');
const router = express.Router();
const { db, nextId } = require('../db/database');
const { requireManager } = require('../middleware/auth');

router.get('/cleaners', requireManager, (req, res) => {
  const cleaners = db.get('users').filter({ role: 'cleaner' }).sortBy('name').value();
  res.json(cleaners.map(({ id, name }) => ({ id, name })));
});

router.post('/', requireManager, (req, res) => {
  const { name, role, pin } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Imię jest wymagane' });
  }
  if (!['manager', 'cleaner'].includes(role)) {
    return res.status(400).json({ error: 'Nieprawidłowa rola' });
  }
  if (!pin || !/^\d{4,6}$/.test(pin)) {
    return res.status(400).json({ error: 'PIN muss 4–6 Ziffern haben' });
  }
  if (db.get('users').find({ pin }).value()) {
    return res.status(409).json({ error: 'Ten PIN jest już zajęty' });
  }
  const user = { id: nextId('users'), name: name.trim(), role, pin };
  db.get('users').push(user).write();
  res.status(201).json({ id: user.id, name: user.name, role: user.role });
});

router.delete('/:id', requireManager, (req, res) => {
  const id = parseInt(req.params.id);
  if (id === req.session.user.id) {
    return res.status(400).json({ error: 'Nie możesz usunąć własnego konta' });
  }
  if (!db.get('users').find({ id }).value()) {
    return res.status(404).json({ error: 'Użytkownik nie istnieje' });
  }
  db.get('users').remove({ id }).write();
  res.json({ ok: true });
});

module.exports = router;
