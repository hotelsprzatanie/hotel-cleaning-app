const express = require('express');
const router = express.Router();
const { db, nextId } = require('../db/database');
const { requireAuth, requireManager } = require('../middleware/auth');

const VALID_TYPES    = ['checkout', 'service', 'none'];
const VALID_STATUSES = ['pending', 'in_progress', 'done', 'verified'];

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
  if (db.get('rooms').find({ number: number.trim() }).value()) {
    return res.status(409).json({ error: 'Pokój o takim numerze już istnieje' });
  }
  const room = {
    id: nextId('rooms'), number: number.trim(), floor: parseInt(floor),
    task_type: 'none', status: 'pending', assigned_to: null, notes: null,
    started_at: null, finished_at: null,
  };
  db.get('rooms').push(room).write();
  res.status(201).json(withAssignedName(room));
});

router.delete('/:id', requireManager, (req, res) => {
  const id = parseInt(req.params.id);
  if (!db.get('rooms').find({ id }).value()) {
    return res.status(404).json({ error: 'Pokój nie istnieje' });
  }
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
  const newType   = task_type   !== undefined ? task_type : room.task_type;
  const newAssign = assigned_to !== undefined ? (assigned_to ? parseInt(assigned_to) : null) : room.assigned_to;
  const newNotes  = notes       !== undefined ? notes : room.notes;
  // Zmiana typu resetuje status, czasy i notatki (nowy cykl sprzątania)
  const typeChanged = task_type !== undefined && task_type !== room.task_type;
  const newStatus          = typeChanged ? 'pending' : room.status;
  const newStarted         = typeChanged ? null : room.started_at;
  const newFinished        = typeChanged ? null : room.finished_at;
  // Jawnie zachowaj completion_notes — nie czyść przy samej zmianie przypisania
  const newCompletionNotes = typeChanged ? null : room.completion_notes;

  db.get('rooms').find({ id }).assign({
    task_type: newType, assigned_to: newAssign, notes: newNotes,
    status: newStatus, started_at: newStarted, finished_at: newFinished,
    completion_notes: newCompletionNotes,
  }).write();
  res.json(withAssignedName(db.get('rooms').find({ id }).value()));
});

router.put('/:id/status', requireAuth, (req, res) => {
  const id = parseInt(req.params.id);
  const { status, completion_notes } = req.body;
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

  const now = new Date().toISOString();
  const updates = { status };
  if (status === 'in_progress') updates.started_at  = now;
  if (status === 'done') {
    updates.finished_at      = now;
    updates.completion_notes = completion_notes || null;
  }
  if (status === 'pending') {
    updates.started_at = null; updates.finished_at = null; updates.completion_notes = null;
  }

  db.get('rooms').find({ id }).assign(updates).write();

  // Zapisz historię ukończenia
  if (status === 'done') {
    db.get('history').push({
      id:               nextId('history'),
      type:             'room',
      user_id:          user.id,
      user_name:        user.name,
      task_type:        room.task_type,
      room_number:      room.number,
      floor:            room.floor,
      started_at:       room.started_at,
      finished_at:      now,
      completion_notes: completion_notes || null,
      timestamp:        now,
    }).write();
  }

  res.json(withAssignedName(db.get('rooms').find({ id }).value()));
});

// Zatwierdzenie przez managera: całkowity reset pokoju
// Kasuje: status→pending, assigned_to, completion_notes, started_at, finished_at
// Zachowuje: task_type, notes (uwagi managera)
router.put('/:id/reset', requireManager, (req, res) => {
  const id = parseInt(req.params.id);
  const room = db.get('rooms').find({ id }).value();
  if (!room) return res.status(404).json({ error: 'Pokój nie istnieje' });

  db.get('rooms').find({ id }).assign({
    status:           'pending',
    task_type:        'none',    // ← kasuj typ zadania
    assigned_to:      null,      // ← kasuj sprzątaczkę
    notes:            null,      // ← kasuj Hinweise managera
    completion_notes: null,      // ← kasuj uwagi sprzątaczki
    started_at:       null,
    finished_at:      null,
  }).write();

  const updated = db.get('rooms').find({ id }).value();
  res.json(withAssignedName(updated));
});

module.exports = router;
