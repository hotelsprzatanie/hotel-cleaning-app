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
    // floor: 1 = Haus Borkum (01–16), floor: 2 = Kleine Möwe (01–10)
    // Numery jako string żeby zachować zero-padding ("01", "02" itd.)
    { id:  1, number: '01', floor: 1, task_type: 'none', status: 'pending', assigned_to: null, notes: null, started_at: null, finished_at: null, completion_notes: null },
    { id:  2, number: '02', floor: 1, task_type: 'none', status: 'pending', assigned_to: null, notes: null, started_at: null, finished_at: null, completion_notes: null },
    { id:  3, number: '03', floor: 1, task_type: 'none', status: 'pending', assigned_to: null, notes: null, started_at: null, finished_at: null, completion_notes: null },
    { id:  4, number: '04', floor: 1, task_type: 'none', status: 'pending', assigned_to: null, notes: null, started_at: null, finished_at: null, completion_notes: null },
    { id:  5, number: '05', floor: 1, task_type: 'none', status: 'pending', assigned_to: null, notes: null, started_at: null, finished_at: null, completion_notes: null },
    { id:  6, number: '06', floor: 1, task_type: 'none', status: 'pending', assigned_to: null, notes: null, started_at: null, finished_at: null, completion_notes: null },
    { id:  7, number: '07', floor: 1, task_type: 'none', status: 'pending', assigned_to: null, notes: null, started_at: null, finished_at: null, completion_notes: null },
    { id:  8, number: '08', floor: 1, task_type: 'none', status: 'pending', assigned_to: null, notes: null, started_at: null, finished_at: null, completion_notes: null },
    { id:  9, number: '09', floor: 1, task_type: 'none', status: 'pending', assigned_to: null, notes: null, started_at: null, finished_at: null, completion_notes: null },
    { id: 10, number: '10', floor: 1, task_type: 'none', status: 'pending', assigned_to: null, notes: null, started_at: null, finished_at: null, completion_notes: null },
    { id: 11, number: '11', floor: 1, task_type: 'none', status: 'pending', assigned_to: null, notes: null, started_at: null, finished_at: null, completion_notes: null },
    { id: 12, number: '12', floor: 1, task_type: 'none', status: 'pending', assigned_to: null, notes: null, started_at: null, finished_at: null, completion_notes: null },
    { id: 13, number: '13', floor: 1, task_type: 'none', status: 'pending', assigned_to: null, notes: null, started_at: null, finished_at: null, completion_notes: null },
    { id: 14, number: '14', floor: 1, task_type: 'none', status: 'pending', assigned_to: null, notes: null, started_at: null, finished_at: null, completion_notes: null },
    { id: 15, number: '15', floor: 1, task_type: 'none', status: 'pending', assigned_to: null, notes: null, started_at: null, finished_at: null, completion_notes: null },
    { id: 16, number: '16', floor: 1, task_type: 'none', status: 'pending', assigned_to: null, notes: null, started_at: null, finished_at: null, completion_notes: null },
    { id: 17, number: '01', floor: 2, task_type: 'none', status: 'pending', assigned_to: null, notes: null, started_at: null, finished_at: null, completion_notes: null },
    { id: 18, number: '02', floor: 2, task_type: 'none', status: 'pending', assigned_to: null, notes: null, started_at: null, finished_at: null, completion_notes: null },
    { id: 19, number: '03', floor: 2, task_type: 'none', status: 'pending', assigned_to: null, notes: null, started_at: null, finished_at: null, completion_notes: null },
    { id: 20, number: '04', floor: 2, task_type: 'none', status: 'pending', assigned_to: null, notes: null, started_at: null, finished_at: null, completion_notes: null },
    { id: 21, number: '05', floor: 2, task_type: 'none', status: 'pending', assigned_to: null, notes: null, started_at: null, finished_at: null, completion_notes: null },
    { id: 22, number: '06', floor: 2, task_type: 'none', status: 'pending', assigned_to: null, notes: null, started_at: null, finished_at: null, completion_notes: null },
    { id: 23, number: '07', floor: 2, task_type: 'none', status: 'pending', assigned_to: null, notes: null, started_at: null, finished_at: null, completion_notes: null },
    { id: 24, number: '08', floor: 2, task_type: 'none', status: 'pending', assigned_to: null, notes: null, started_at: null, finished_at: null, completion_notes: null },
    { id: 25, number: '09', floor: 2, task_type: 'none', status: 'pending', assigned_to: null, notes: null, started_at: null, finished_at: null, completion_notes: null },
    { id: 26, number: '10', floor: 2, task_type: 'none', status: 'pending', assigned_to: null, notes: null, started_at: null, finished_at: null, completion_notes: null },
  ],
  common_areas: [
    { id: 1, name: 'Gästetoiletten (Erdgeschoss)',              status: 'pending', assigned_to: null, started_at: null, finished_at: null, completion_notes: null, locked: true },
    { id: 2, name: 'Treppe und Flure staubsaugen',              status: 'pending', assigned_to: null, started_at: null, finished_at: null, completion_notes: null, locked: true },
    { id: 3, name: 'Frühstücksraum - Staubsaugen und Wischen', status: 'pending', assigned_to: null, started_at: null, finished_at: null, completion_notes: null, locked: true },
  ],
  issues: [],
  other_tasks: [],
  history: [],
  _seq: { users: 3, rooms: 26, common_areas: 3, issues: 0, other_tasks: 0, history: 0 },
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

// 3. Migracja pokoi: wyczyść stare i zastąp nową strukturą
//    Haus Borkum (floor:1) → pokoje 01–16
//    Kleine Möwe (floor:2) → pokoje 01–10
const EXPECTED_ROOMS = [
  { id:  1, number: '01', floor: 1 }, { id:  2, number: '02', floor: 1 },
  { id:  3, number: '03', floor: 1 }, { id:  4, number: '04', floor: 1 },
  { id:  5, number: '05', floor: 1 }, { id:  6, number: '06', floor: 1 },
  { id:  7, number: '07', floor: 1 }, { id:  8, number: '08', floor: 1 },
  { id:  9, number: '09', floor: 1 }, { id: 10, number: '10', floor: 1 },
  { id: 11, number: '11', floor: 1 }, { id: 12, number: '12', floor: 1 },
  { id: 13, number: '13', floor: 1 }, { id: 14, number: '14', floor: 1 },
  { id: 15, number: '15', floor: 1 }, { id: 16, number: '16', floor: 1 },
  { id: 17, number: '01', floor: 2 }, { id: 18, number: '02', floor: 2 },
  { id: 19, number: '03', floor: 2 }, { id: 20, number: '04', floor: 2 },
  { id: 21, number: '05', floor: 2 }, { id: 22, number: '06', floor: 2 },
  { id: 23, number: '07', floor: 2 }, { id: 24, number: '08', floor: 2 },
  { id: 25, number: '09', floor: 2 }, { id: 26, number: '10', floor: 2 },
];

// Sprawdź czy aktualne pokoje pasują do oczekiwanej struktury
const currentRooms = db.get('rooms').value();
const expectedIds  = EXPECTED_ROOMS.map(r => r.id);
const needsMigration = currentRooms.some(r => !expectedIds.includes(r.id))
  || currentRooms.length !== EXPECTED_ROOMS.length;

if (needsMigration) {
  console.log('Migracja: zastępuję pokoje nową strukturą (Haus Borkum + Kleine Möwe)');
  db.set('rooms', EXPECTED_ROOMS.map(r => ({
    ...r,
    task_type: 'none', status: 'pending', assigned_to: null,
    notes: null, started_at: null, finished_at: null, completion_notes: null,
  }))).write();
  db.set('_seq.rooms', 26).write();
}

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

// 5. Migracja: dodaj history i _seq.history jeśli nie istnieje
if (!db.has('history').value()) {
  db.set('history', []).write();
}
if (db.get('_seq.history').value() === undefined) {
  db.set('_seq.history', 0).write();
}

// ── Helper ───────────────────────────────────────────────────────────────────
function nextId(collection) {
  const next = db.get(`_seq.${collection}`).value() + 1;
  db.set(`_seq.${collection}`, next).write();
  return next;
}

module.exports = { db, nextId };
