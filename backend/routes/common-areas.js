const express = require('express');
const router = express.Router();
const { db, nextId } = require('../db/database');
const { requireAuth, requireManager } = require('../middleware/auth');

// Gemeinschaftsbereiche nie używają statusu "verified"
const VALID_STATUSES = ['pending', 'in_progress', 'done'];

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
  const area = {
    id: nextId('common_areas'), name: name.trim(),
    status: 'pending', assigned_to: null,
    started_at: null, finished_at: null, completion_notes: null, locked: false,
  };
  db.get('common_areas').push(area).write();
  res.status(201).json(withAssignedName(area));
});

router.delete('/:id', requireManager, (req, res) => {
  const id = parseInt(req.params.id);
  const area = db.get('common_areas').find({ id }).value();
  if (!area) return res.status(404).json({ error: 'Nie znaleziono' });
  // Zablokowane pozycje nie mogą być usunięte
  if (area.locked) return res.status(403).json({ error: 'Dieser Bereich ist gesperrt und kann nicht gelöscht werden' });
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
  db.get('common_areas').find({ id }).assign({
    assigned_to: newAssign,
    status: 'pending', started_at: null, finished_at: null,
    completion_notes: area.completion_notes ?? null,
  }).write();
  res.json(withAssignedName(db.get('common_areas').find({ id }).value()));
});

router.put('/:id/status', requireAuth, (req, res) => {
  const id = parseInt(req.params.id);
  const { status, completion_notes } = req.body;
  const user = req.session.user;

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Nieprawidłowy status' });
  }
  const area = db.get('common_areas').find({ id }).value();
  if (!area) return res.status(404).json({ error: 'Nie znaleziono' });

  if (user.role === 'cleaner' && area.assigned_to !== user.id) {
    return res.status(403).json({ error: 'Brak uprawnień' });
  }
  // Sprzątaczka może ustawiać tylko in_progress i done
  if (user.role === 'cleaner' && !['in_progress', 'done'].includes(status)) {
    return res.status(403).json({ error: 'Brak uprawnień' });
  }

  const now = new Date().toISOString();
  const updates = { status };
  if (status === 'in_progress') updates.started_at  = now;
  if (status === 'done') {
    updates.finished_at      = now;
    updates.completion_notes = completion_notes || null;
  }
  // Reset do pending — czyści wszystkie pola łącznie z assigned_to
  if (status === 'pending') {
    updates.assigned_to      = null;   // ← kluczowe: kasuj sprzątaczkę
    updates.started_at       = null;
    updates.finished_at      = null;
    updates.completion_notes = null;
  }

  db.get('common_areas').find({ id }).assign(updates).write();

  // Zapisz historię ukończenia
  if (status === 'done') {
    db.get('history').push({
      id:               nextId('history'),
      type:             'area',
      user_id:          user.id,
      user_name:        user.name,
      area_name:        area.name,
      started_at:       area.started_at,
      finished_at:      now,
      completion_notes: completion_notes || null,
      timestamp:        now,
    }).write();
  }

  res.json(withAssignedName(db.get('common_areas').find({ id }).value()));
});

module.exports = router;
