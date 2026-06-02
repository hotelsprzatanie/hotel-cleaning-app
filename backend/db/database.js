const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');

// W produkcji użyj zmiennej DATA_DIR (np. Railway volume mount)
const DATA_DIR = process.env.DATA_DIR || __dirname;
const adapter = new FileSync(path.join(DATA_DIR, 'hotel.json'));
const db = low(adapter);

// Dane startowe — tylko gdy baza jest pusta
db.defaults({
  users: [
    { id: 1, name: 'Manager',   role: 'manager', pin: '26757' },
    { id: 2, name: 'Anastasia', role: 'cleaner', pin: '1111' },
    { id: 3, name: 'Heike',     role: 'cleaner', pin: '2222' },
  ],
  rooms: [
    // floor: 1 = Haus Borkum, floor: 2 = Kleine Möwe
    { id: 1, number: '101', floor: 1, task_type: 'none', status: 'pending', assigned_to: null, notes: null, started_at: null, finished_at: null, completion_notes: null },
    { id: 2, number: '102', floor: 1, task_type: 'none', status: 'pending', assigned_to: null, notes: null, started_at: null, finished_at: null, completion_notes: null },
    { id: 3, number: '103', floor: 1, task_type: 'none', status: 'pending', assigned_to: null, notes: null, started_at: null, finished_at: null, completion_notes: null },
    { id: 4, number: '104', floor: 1, task_type: 'none', status: 'pending', assigned_to: null, notes: null, started_at: null, finished_at: null, completion_notes: null },
    { id: 5, number: '201', floor: 2, task_type: 'none', status: 'pending', assigned_to: null, notes: null, started_at: null, finished_at: null, completion_notes: null },
    { id: 6, number: '202', floor: 2, task_type: 'none', status: 'pending', assigned_to: null, notes: null, started_at: null, finished_at: null, completion_notes: null },
    { id: 7, number: '203', floor: 2, task_type: 'none', status: 'pending', assigned_to: null, notes: null, started_at: null, finished_at: null, completion_notes: null },
    { id: 8, number: '204', floor: 2, task_type: 'none', status: 'pending', assigned_to: null, notes: null, started_at: null, finished_at: null, completion_notes: null },
  ],
  common_areas: [
    { id: 1, name: 'Gästetoiletten (Erdgeschoss)',              status: 'pending', assigned_to: null, started_at: null, finished_at: null, completion_notes: null, locked: true },
    { id: 2, name: 'Treppe und Flure staubsaugen',              status: 'pending', assigned_to: null, started_at: null, finished_at: null, completion_notes: null, locked: true },
    { id: 3, name: 'Frühstücksraum - Staubsaugen und Wischen', status: 'pending', assigned_to: null, started_at: null, finished_at: null, completion_notes: null, locked: true },
  ],
  issues: [],
  other_tasks: [],
  _seq: { users: 3, rooms: 8, common_areas: 3, issues: 0, other_tasks: 0 },
}).write();

// ── Migracje ────────────────────────────────────────────────────────────────

// 1. Zaktualizuj PIN managera i imiona sprzątaczek jeśli są stare
const mgr = db.get('users').find({ id: 1 }).value();
if (mgr && mgr.pin !== '26757') {
  db.get('users').find({ id: 1 }).assign({ pin: '26757' }).write();
  console.log('Migracja: zaktualizowano PIN managera');
}
const u2 = db.get('users').find({ id: 2 }).value();
if (u2 && u2.name !== 'Anastasia') {
  db.get('users').find({ id: 2 }).assign({ name: 'Anastasia' }).write();
}
const u3 = db.get('users').find({ id: 3 }).value();
if (u3 && u3.name !== 'Heike') {
  db.get('users').find({ id: 3 }).assign({ name: 'Heike' }).write();
}

// 2. Upewnij się że domyślne 3 obszary istnieją, mają poprawne nazwy i są zablokowane
const DEFAULT_AREAS = [
  { id: 1, name: 'Gästetoiletten (Erdgeschoss)',              locked: true },
  { id: 2, name: 'Treppe und Flure staubsaugen',              locked: true },
  { id: 3, name: 'Frühstücksraum - Staubsaugen und Wischen', locked: true },
];
DEFAULT_AREAS.forEach(({ id, name, locked }) => {
  const area = db.get('common_areas').find({ id }).value();
  if (!area) {
    // Obszar został usunięty — przywróć go
    db.get('common_areas').push({
      id, name, status: 'pending', assigned_to: null,
      started_at: null, finished_at: null, completion_notes: null, locked,
    }).write();
    console.log(`Migracja: przywrócono obszar ${id} "${name}"`);
  } else {
    const updates = {};
    if (area.name !== name)    updates.name   = name;
    if (area.locked !== locked) updates.locked = locked;
    if (!('locked' in area))   updates.locked = locked;
    if (Object.keys(updates).length) {
      db.get('common_areas').find({ id }).assign(updates).write();
      console.log(`Migracja: zaktualizowano obszar ${id}`, updates);
    }
  }
});

// Dodaj locked:false do obszarów które nie mają tego pola
db.get('common_areas').value().forEach(area => {
  if (!('locked' in area)) {
    db.get('common_areas').find({ id: area.id }).assign({ locked: false }).write();
  }
});

// 3. Usuń pokoje z 3. piętra
const floor3 = db.get('rooms').filter({ floor: 3 }).value();
if (floor3.length > 0) db.get('rooms').remove({ floor: 3 }).write();

// 4. Dodaj brakujące pola czasowe i completion_notes do istniejących rekordów
['rooms', 'common_areas', 'other_tasks'].forEach(col => {
  db.get(col).value().forEach(item => {
    const u = {};
    if (!('started_at'       in item)) u.started_at       = null;
    if (!('finished_at'      in item)) u.finished_at      = null;
    if (!('completion_notes' in item)) u.completion_notes = null;
    if (Object.keys(u).length) db.get(col).find({ id: item.id }).assign(u).write();
  });
});

// ── Helper ───────────────────────────────────────────────────────────────────
function nextId(collection) {
  const next = db.get(`_seq.${collection}`).value() + 1;
  db.set(`_seq.${collection}`, next).write();
  return next;
}

module.exports = { db, nextId };
