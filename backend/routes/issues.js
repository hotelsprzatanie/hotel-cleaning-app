const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db, nextId } = require('../db/database');
const { requireAuth, requireManager } = require('../middleware/auth');

const VALID_STATUSES   = ['new', 'in_progress', 'fixed'];
const VALID_PRIORITIES = ['normal', 'urgent'];

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `issue_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.heic'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Dozwolone tylko pliki graficzne'));
  },
});

function withReporterName(issue) {
  const user = db.get('users').find({ id: issue.reported_by }).value();
  return { ...issue, reporter_name: user ? user.name : 'Nieznany' };
}

router.get('/', requireAuth, (req, res) => {
  const user = req.session.user;
  let issues = db.get('issues').value();
  if (user.role === 'cleaner') {
    // Sprzątaczka nie widzi listy usterek — może tylko zgłaszać
    return res.json([]);
  } else {
    issues = [...issues].sort((a, b) => {
      if (a.priority === b.priority) return new Date(b.created_at) - new Date(a.created_at);
      return a.priority === 'urgent' ? -1 : 1;
    });
  }
  res.json(issues.map(withReporterName));
});

router.post('/', requireAuth, upload.single('photo'), (req, res) => {
  const { location, description, priority } = req.body;
  if (!location || typeof location !== 'string' || !location.trim()) {
    return res.status(400).json({ error: 'Lokalizacja jest wymagana' });
  }
  const hasPhoto       = !!req.file;
  const hasDescription = description && typeof description === 'string' && description.trim() !== '';
  if (!hasPhoto && !hasDescription) {
    return res.status(400).json({ error: 'Podaj opis lub dodaj zdjęcie usterki' });
  }
  if (priority && !VALID_PRIORITIES.includes(priority)) {
    return res.status(400).json({ error: 'Nieprawidłowy priorytet' });
  }
  const issue = {
    id: nextId('issues'),
    location: location.trim(),
    description: hasDescription ? description.trim() : null,
    priority: priority || 'normal',
    status: 'new',
    photo_url: req.file ? `/uploads/${req.file.filename}` : null,
    reported_by: req.session.user.id,
    created_at: new Date().toISOString(),
  };
  db.get('issues').push(issue).write();

  // Zapisz w historii
  db.get('history').push({
    id:        nextId('history'),
    type:      'issue',
    user_id:   req.session.user.id,
    user_name: req.session.user.name,
    priority:  issue.priority,
    timestamp: issue.created_at,
  }).write();

  res.status(201).json(withReporterName(issue));
});

router.put('/:id/status', requireManager, (req, res) => {
  const id = parseInt(req.params.id);
  const { status } = req.body;
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Nieprawidłowy status' });
  }
  const issue = db.get('issues').find({ id }).value();
  if (!issue) return res.status(404).json({ error: 'Usterka nie istnieje' });
  db.get('issues').find({ id }).assign({ status }).write();
  res.json(withReporterName(db.get('issues').find({ id }).value()));
});

router.delete('/:id', requireManager, (req, res) => {
  const id = parseInt(req.params.id);
  const issue = db.get('issues').find({ id }).value();
  if (!issue) return res.status(404).json({ error: 'Usterka nie istnieje' });
  if (issue.photo_url) {
    const filePath = path.join(__dirname, '..', issue.photo_url);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  db.get('issues').remove({ id }).write();
  res.json({ ok: true });
});

module.exports = router;
