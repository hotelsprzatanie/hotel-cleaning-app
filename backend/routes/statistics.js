const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const { requireManager } = require('../middleware/auth');

router.get('/', requireManager, (req, res) => {
  const { month } = req.query; // format: "2026-06"
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: 'Podaj miesiąc w formacie YYYY-MM' });
  }

  const history = db.get('history').value();
  const cleaners = db.get('users').filter({ role: 'cleaner' }).value();

  const inMonth = (ts) => ts && ts.startsWith(month);

  const stats = cleaners.map(cleaner => {
    const entries = history.filter(h => h.user_id === cleaner.id && inMonth(h.timestamp));

    const rooms = entries.filter(h => h.type === 'room');
    const areas = entries.filter(h => h.type === 'area');
    const tasks = entries.filter(h => h.type === 'task');
    const issues = entries.filter(h => h.type === 'issue');

    // Czas sprzątania w minutach
    const roomsWithDuration = rooms
      .map(h => {
        if (!h.started_at || !h.finished_at) return null;
        const mins = Math.round((new Date(h.finished_at) - new Date(h.started_at)) / 60000);
        return { ...h, duration_mins: mins };
      })
      .filter(Boolean);

    const avgTime = roomsWithDuration.length
      ? Math.round(roomsWithDuration.reduce((s, r) => s + r.duration_mins, 0) / roomsWithDuration.length)
      : null;

    const fastest = roomsWithDuration.length
      ? roomsWithDuration.reduce((a, b) => a.duration_mins < b.duration_mins ? a : b)
      : null;

    const slowest = roomsWithDuration.length
      ? roomsWithDuration.reduce((a, b) => a.duration_mins > b.duration_mins ? a : b)
      : null;

    return {
      user_id:      cleaner.id,
      user_name:    cleaner.name,
      rooms_done:   rooms.length,
      areas_done:   areas.length,
      tasks_done:   tasks.length,
      issues_reported: issues.length,
      avg_room_time:   avgTime,
      fastest_room:    fastest ? { number: fastest.room_number, mins: fastest.duration_mins } : null,
      slowest_room:    slowest ? { number: slowest.room_number, mins: slowest.duration_mins } : null,
    };
  });

  res.json({ month, stats });
});

module.exports = router;
