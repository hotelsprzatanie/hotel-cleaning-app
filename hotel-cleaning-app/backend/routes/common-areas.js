const express = require('express');
const router = express.Router();
const { db, nextId } = require('../db/database');
const { requireAuth, requireManager } = require('../middleware/auth');

const VALID_STATUSES = ['pending', 'in_progress', 'done', 'verified'];

function withAssignedName(area) {
  const user = area.assigned_to ? db.get('users').find({ id: area.assigned_to }).value() : null;
  return { ...area, assigned_name: user ? user.name : null };
}

router.get('/', requireAuth, (req, res) => {
  const user = req.session.user;
  let areas = db.get('common_areas').value();

  if (user.role === 'cleaner') {
    areas = areas.filter(a => a.assigned_to === user.id);
  }

  res.json(areas.map(withAssignedName));
});

router.post('/', requireManager, (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Nazwa jest wymagana' });
  }

  const area = { id: nextId('common_areas'), name: name.trim(), status: 'pending', assigned_to: null };
  db.get('common_areas').push(area).write();
  res.status(201).json(withAssignedName(area));
});

router.delete('/:id', requireManager, (req, res) => {
  const id = parseInt(req.params.id);
  if (!db.get('common_areas').find({ id }).value()) {
    return res.status(404).json({ error: 'Nie znaleziono' });
  }
  db.get('common_areas').remove({ id }).write();
  res.json({ ok: true });
});

router.put('/:id/assign', requireManager, (req, res) => {
  const id = parseInt(req.params.id);
  const { assigned_to } = req.body;

  const area = db.get('common_areas').find({ id }).value();
  if (!area) return res.status(404).json({ error: 'Nie znaleziono' });

  if (assigned_to) {
    const cleaner = db.get('users').find({ id: parseInt(assigned_to), role: 'cleaner' }).value();
    if (!cleaner) return res.status(400).json({ error: 'Nieprawidłowa sprzątaczka' });
  }

  const newAssign = assigned_to !== undefined ? (assigned_to ? parseInt(assigned_to) : null) : area.assigned_to;
  const newStatus = assigned_to ? 'pending' : area.status;

  db.get('common_areas').find({ id }).assign({ assigned_to: newAssign, status: newStatus }).write();
  const updated = db.get('common_areas').find({ id }).value();
  res.json(withAssignedName(updated));
});

router.put('/:id/status', requireAuth, (req, res) => {
  const id = parseInt(req.params.id);
  const { status } = req.body;
  const user = req.session.user;

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Nieprawidłowy status' });
  }

  const area = db.get('common_areas').find({ id }).value();
  if (!area) return res.status(404).json({ error: 'Nie znaleziono' });

  if (user.role === 'cleaner' && area.assigned_to !== user.id) {
    return res.status(403).json({ error: 'Brak uprawnień' });
  }
  if (user.role === 'cleaner' && status === 'verified') {
    return res.status(403).json({ error: 'Tylko manager może zatwierdzić' });
  }

  db.get('common_areas').find({ id }).assign({ status }).write();
  const updated = db.get('common_areas').find({ id }).value();
  res.json(withAssignedName(updated));
});

module.exports = router;
