const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const { requireManager } = require('../middleware/auth');

// GET /api/statistics/history?days=30
router.get('/history', requireManager, (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const entries = db.get('history')
    .value()
    .filter(h => h.type !== 'issue' && h.timestamp >= since)
    .map(h => {
      const duration = (h.started_at && h.finished_at)
        ? Math.round((new Date(h.finished_at) - new Date(h.started_at)) / 60000)
        : null;
      return { ...h, duration_mins: duration };
    })
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  res.json(entries);
});

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

    const rooms   = entries.filter(h => h.type === 'room');
    const areas   = entries.filter(h => h.type === 'area');
    const tasks   = entries.filter(h => h.type === 'task');
    const issues  = entries.filter(h => h.type === 'issue');

    const rooms_checkout = rooms.filter(h => h.task_type === 'checkout').length;
    const rooms_service  = rooms.filter(h => h.task_type === 'service').length;

    // Zlicz opcje serwisowe z completion_notes (JSON)
    const service_options = { cleaned: 0, sweet: 0, dnd: 0, none: 0 };
    rooms.filter(h => h.task_type === 'service').forEach(h => {
      let opts = [];
      try { opts = JSON.parse(h.completion_notes || '{}').options || []; } catch {}
      if (opts.length === 0) { service_options.none++; return; }
      opts.forEach(o => { if (o in service_options) service_options[o]++; });
    });

    // Czas sprzątania w minutach
    const roomsWithDuration = rooms
      .map(h => {
        if (!h.started_at || !h.finished_at) return null;
        const mins = Math.round((new Date(h.finished_at) - new Date(h.started_at)) / 60000);
        return { ...h, duration_mins: mins };
      })
      .filter(Boolean);

    // Średnie czasy wg typu pokoju
    const checkout = roomsWithDuration.filter(h => h.task_type === 'checkout');
    const service  = roomsWithDuration.filter(h => h.task_type === 'service');
    const avg = (arr) => arr.length
      ? Math.round(arr.reduce((s, r) => s + r.duration_mins, 0) / arr.length)
      : null;

    const fastest = roomsWithDuration.length
      ? roomsWithDuration.reduce((a, b) => a.duration_mins < b.duration_mins ? a : b)
      : null;
    const slowest = roomsWithDuration.length
      ? roomsWithDuration.reduce((a, b) => a.duration_mins > b.duration_mins ? a : b)
      : null;

    // Łączny czas pracy (pokoje + obszary + zadania z dostępnym czasem)
    const allWithDuration = entries
      .filter(h => h.type !== 'issue')
      .map(h => {
        if (!h.started_at || !h.finished_at) return null;
        return Math.round((new Date(h.finished_at) - new Date(h.started_at)) / 60000);
      })
      .filter(m => m !== null && m >= 0);
    const total_work_mins = allWithDuration.length
      ? allWithDuration.reduce((s, m) => s + m, 0)
      : null;

    // Najbardziej pracowity dzień
    const dayCount = {};
    entries.filter(h => h.type !== 'issue').forEach(h => {
      const day = h.timestamp.slice(0, 10); // YYYY-MM-DD
      dayCount[day] = (dayCount[day] || 0) + 1;
    });
    const busiestDay = Object.keys(dayCount).length
      ? Object.keys(dayCount).reduce((a, b) => dayCount[a] >= dayCount[b] ? a : b)
      : null;
    const busiestDayCount = busiestDay ? dayCount[busiestDay] : null;

    return {
      user_id:          cleaner.id,
      user_name:        cleaner.name,
      rooms_done:       rooms.length,
      rooms_checkout,
      rooms_service,
      service_options,
      areas_done:       areas.length,
      tasks_done:       tasks.length,
      issues_reported:  issues.length,
      avg_checkout_time: avg(checkout),
      avg_service_time:  avg(service),
      total_work_mins,
      fastest_room: fastest ? { number: fastest.room_number, mins: fastest.duration_mins } : null,
      slowest_room: slowest ? { number: slowest.room_number, mins: slowest.duration_mins } : null,
      busiest_day:  busiestDay ? { date: busiestDay, count: busiestDayCount } : null,
    };
  });

  res.json({ month, stats });
});

module.exports = router;
