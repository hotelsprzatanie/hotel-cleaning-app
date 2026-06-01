const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');

const adapter = new FileSync(path.join(__dirname, 'hotel.json'));
const db = low(adapter);

// Dane startowe — tylko gdy baza jest pusta
db.defaults({
  users: [
    { id: 1, name: 'Manager', role: 'manager', pin: '0000' },
    { id: 2, name: 'Anna',    role: 'cleaner', pin: '1111' },
    { id: 3, name: 'Maria',   role: 'cleaner', pin: '2222' },
  ],
  rooms: [
    { id: 1,  number: '101', floor: 1, task_type: 'none', status: 'pending', assigned_to: null, notes: null },
    { id: 2,  number: '102', floor: 1, task_type: 'none', status: 'pending', assigned_to: null, notes: null },
    { id: 3,  number: '103', floor: 1, task_type: 'none', status: 'pending', assigned_to: null, notes: null },
    { id: 4,  number: '104', floor: 1, task_type: 'none', status: 'pending', assigned_to: null, notes: null },
    { id: 5,  number: '201', floor: 2, task_type: 'none', status: 'pending', assigned_to: null, notes: null },
    { id: 6,  number: '202', floor: 2, task_type: 'none', status: 'pending', assigned_to: null, notes: null },
    { id: 7,  number: '203', floor: 2, task_type: 'none', status: 'pending', assigned_to: null, notes: null },
    { id: 8,  number: '204', floor: 2, task_type: 'none', status: 'pending', assigned_to: null, notes: null },
    { id: 9,  number: '301', floor: 3, task_type: 'none', status: 'pending', assigned_to: null, notes: null },
    { id: 10, number: '302', floor: 3, task_type: 'none', status: 'pending', assigned_to: null, notes: null },
  ],
  common_areas: [
    { id: 1, name: 'Toalety dla gości (parter)',          status: 'pending', assigned_to: null },
    { id: 2, name: 'Odkurzanie schodów i korytarzy',      status: 'pending', assigned_to: null },
    { id: 3, name: 'Jadalnia — odkurzanie i mycie podłogi', status: 'pending', assigned_to: null },
  ],
  issues: [],
  other_tasks: [],
  _seq: { users: 3, rooms: 10, common_areas: 3, issues: 0, other_tasks: 0 },
}).write();

// Pomocnik: generuje kolejne ID dla danej kolekcji
function nextId(collection) {
  const current = db.get(`_seq.${collection}`).value();
  const next = current + 1;
  db.set(`_seq.${collection}`, next).write();
  return next;
}

module.exports = { db, nextId };
