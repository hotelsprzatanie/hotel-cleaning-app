const express = require('express');
const router = express.Router();
const { db, nextId } = require('../db/database');
const { requireAuth, requireManager } = require('../middleware/auth');

// "verified" — manager zatwierdza zadanie wykonane przez sprzątaczkę
const VALID_STATUSES         = ['pending', 'in_progress', 'done', 'verified'];
const CLEANER_VALID_STATUSES = ['in_progress', 'done'];
const MANAGER_VALID_STATUSES = ['verified'];

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
    id: nextId('other_tasks'),
    description: description.trim(),
    status: 'pending',
    assigned_to: assigned_to ? parseInt(assigned_to) : null,
    created_by: req.session.user.id,
    created_at: new Date().toISOString(),
    started_at: null,
    finished_at: null,
  };
  db.get('other_tasks').push(task).write();
  res.status(201).json(withAssignedName(task));
});

router.put('/:id/status', requireAuth, (req, res) => {
  const id = parseInt(req.params.id);
  const { status, completion_notes } = req.body;
  const user = req.session.user;

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Nieprawidłowy status' });
  }

  const task = db.get('other_tasks').find({ id }).value();
  if (!task) return res.status(404).json({ error: 'Zadanie nie istnieje' });

  if (user.role === 'cleaner') {
    if (task.assigned_to !== user.id) {
      return res.status(403).json({ error: 'Brak uprawnień' });
    }
    if (!CLEANER_VALID_STATUSES.includes(status)) {
      return res.status(403).json({ error: 'Sprzątaczka może ustawić tylko: w trakcie lub gotowe' });
    }
  }

  if (user.role === 'manager') {
    // Manager może tylko zatwierdzać — nie może sam oznaczać jako done
    if (!MANAGER_VALID_STATUSES.includes(status)) {
      return res.status(403).json({ error: 'Manager może tylko zatwierdzać (verified)' });
    }
    if (task.status !== 'done') {
      return res.status(400).json({ error: 'Można zatwierdzić tylko zadanie ze statusem "done"' });
    }
  }

  const now = new Date().toISOString();
  const updates = { status };
  if (status === 'in_progress') updates.started_at = now;
  if (status === 'done') {
    updates.finished_at      = now;
    updates.completion_notes = completion_notes || null;
  }
  if (status === 'pending') {
    updates.started_at = null; updates.finished_at = null; updates.completion_notes = null;
  }

  db.get('other_tasks').find({ id }).assign(updates).write();

  // Zapisz historię ukończenia
  if (status === 'done') {
    db.get('history').push({
      id:               nextId('history'),
      type:             'task',
      user_id:          user.id,
      user_name:        user.name,
      description:      task.description,
      started_at:       task.started_at,
      finished_at:      now,
      completion_notes: completion_notes || null,
      timestamp:        now,
    }).write();
  }

  res.json(withAssignedName(db.get('other_tasks').find({ id }).value()));
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
