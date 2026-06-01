const express = require('express');
const router = express.Router();
const { db, nextId } = require('../db/database');
const { requireAuth, requireManager } = require('../middleware/auth');

const VALID_TYPES    = ['checkout', 'service', 'none'];
const VALID_STATUSES = ['pending', 'in_progress', 'done', 'verified'];

// Dołącza imię sprzątaczki do obiektu pokoju
function withAssignedName(room) {
  const user = room.assigned_to ? db.get('users').find({ id: room.assigned_to }).value() : null;
  return { ...room, assigned_name: user ? user.name : null };
}

router.get('/', requireAuth, (req, res) => {
  const user = req.session.user;
  let rooms = db.get('rooms').value();

  if (user.role === 'cleaner') {
    rooms = rooms.filter(r => r.assigned_to === user.id && r.task_type !== 'none');
  }

  res.json(rooms.map(withAssignedName));
});

router.post('/', requireManager, (req, res) => {
  const { number, floor } = req.body;

  if (!number || typeof number !== 'string' || !number.trim()) {
    return res.status(400).json({ error: 'Numer pokoju jest wymagany' });
  }
  if (floor === undefined || isNaN(parseInt(floor))) {
    return res.status(400).json({ error: 'Piętro jest wymagane' });
  }

  const exists = db.get('rooms').find({ number: number.trim() }).value();
  if (exists) return res.status(409).json({ error: 'Pokój o takim numerze już istnieje' });

  const room = {
    id: nextId('rooms'),
    number: number.trim(),
    floor: parseInt(floor),
    task_type: 'none',
    status: 'pending',
    assigned_to: null,
    notes: null,
  };

  db.get('rooms').push(room).write();
  res.status(201).json(withAssignedName(room));
});

router.delete('/:id', requireManager, (req, res) => {
  const id = parseInt(req.params.id);
  const room = db.get('rooms').find({ id }).value();
  if (!room) return res.status(404).json({ error: 'Pokój nie istnieje' });

  db.get('rooms').remove({ id }).write();
  res.json({ ok: true });
});

router.put('/:id/assign', requireManager, (req, res) => {
  const id = parseInt(req.params.id);
  const { task_type, assigned_to, notes } = req.body;

  const room = db.get('rooms').find({ id }).value();
  if (!room) return res.status(404).json({ error: 'Pokój nie istnieje' });

  if (task_type !== undefined && !VALID_TYPES.includes(task_type)) {
    return res.status(400).json({ error: 'Nieprawidłowy typ zadania' });
  }

  if (assigned_to) {
    const cleaner = db.get('users').find({ id: parseInt(assigned_to), role: 'cleaner' }).value();
    if (!cleaner) return res.status(400).json({ error: 'Nieprawidłowa sprzątaczka' });
  }

  const newType   = task_type   !== undefined ? task_type                  : room.task_type;
  const newAssign = assigned_to !== undefined ? (assigned_to ? parseInt(assigned_to) : null) : room.assigned_to;
  const newNotes  = notes       !== undefined ? notes                      : room.notes;
  const newStatus = (task_type !== undefined && task_type !== room.task_type) ? 'pending' : room.status;

  db.get('rooms').find({ id }).assign({
    task_type: newType,
    assigned_to: newAssign,
    notes: newNotes,
    status: newStatus,
  }).write();

  const updated = db.get('rooms').find({ id }).value();
  res.json(withAssignedName(updated));
});

router.put('/:id/status', requireAuth, (req, res) => {
  const id = parseInt(req.params.id);
  const { status } = req.body;
  const user = req.session.user;

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Nieprawidłowy status' });
  }

  const room = db.get('rooms').find({ id }).value();
  if (!room) return res.status(404).json({ error: 'Pokój nie istnieje' });

  if (user.role === 'cleaner' && room.assigned_to !== user.id) {
    return res.status(403).json({ error: 'Brak uprawnień do tego pokoju' });
  }
  if (user.role === 'cleaner' && status === 'verified') {
    return res.status(403).json({ error: 'Tylko manager może zatwierdzić' });
  }

  db.get('rooms').find({ id }).assign({ status }).write();
  const updated = db.get('rooms').find({ id }).value();
  res.json(withAssignedName(updated));
});

module.exports = router;
