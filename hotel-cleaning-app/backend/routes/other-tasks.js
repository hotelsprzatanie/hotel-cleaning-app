const express = require('express');
const router = express.Router();
const { db, nextId } = require('../db/database');
const { requireAuth, requireManager } = require('../middleware/auth');

const VALID_STATUSES = ['pending', 'in_progress', 'done'];

function withAssignedName(task) {
  const user = task.assigned_to ? db.get('users').find({ id: task.assigned_to }).value() : null;
  return { ...task, assigned_name: user ? user.name : null };
}

router.get('/', requireAuth, (req, res) => {
  const user = req.session.user;
  let tasks = db.get('other_tasks').value();

  if (user.role === 'cleaner') {
    tasks = tasks.filter(t => t.assigned_to === user.id);
  }

  tasks = [...tasks].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(tasks.map(withAssignedName));
});

router.post('/', requireManager, (req, res) => {
  const { description, assigned_to } = req.body;

  if (!description || typeof description !== 'string' || !description.trim()) {
    return res.status(400).json({ error: 'Opis zadania jest wymagany' });
  }

  if (assigned_to) {
    const cleaner = db.get('users').find({ id: parseInt(assigned_to), role: 'cleaner' }).value();
    if (!cleaner) return res.status(400).json({ error: 'Nieprawidłowa sprzątaczka' });
  }

  const task = {
    id:          nextId('other_tasks'),
    description: description.trim(),
    status:      'pending',
    assigned_to: assigned_to ? parseInt(assigned_to) : null,
    created_by:  req.session.user.id,
    created_at:  new Date().toISOString(),
  };

  db.get('other_tasks').push(task).write();
  res.status(201).json(withAssignedName(task));
});

router.put('/:id/status', requireAuth, (req, res) => {
  const id = parseInt(req.params.id);
  const { status } = req.body;
  const user = req.session.user;

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Nieprawidłowy status' });
  }

  const task = db.get('other_tasks').find({ id }).value();
  if (!task) return res.status(404).json({ error: 'Zadanie nie istnieje' });

  if (user.role === 'cleaner' && task.assigned_to !== user.id) {
    return res.status(403).json({ error: 'Brak uprawnień' });
  }

  db.get('other_tasks').find({ id }).assign({ status }).write();
  const updated = db.get('other_tasks').find({ id }).value();
  res.json(withAssignedName(updated));
});

router.delete('/:id', requireManager, (req, res) => {
  const id = parseInt(req.params.id);
  if (!db.get('other_tasks').find({ id }).value()) {
    return res.status(404).json({ error: 'Zadanie nie istnieje' });
  }
  db.get('other_tasks').remove({ id }).write();
  res.json({ ok: true });
});

module.exports = router;
