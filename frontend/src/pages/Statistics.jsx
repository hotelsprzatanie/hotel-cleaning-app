import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { exportStatisticsPdf } from '../utils/exportPdf';

// ── Helpers ──────────────────────────────────────────────────────
function fmt(mins) {
  if (mins === null || mins === undefined) return null;
  if (mins < 1) return '< 1 min';
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}min`;
}

function monthOptions() {
  const opts = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
    opts.push({ val, label });
  }
  return opts;
}

const SERVICE_OPTIONS = [
  { key: 'cleaned', icon: '🧹', label: 'Zimmer gereinigt' },
  { key: 'sweet',   icon: '🍬', label: 'Süßigkeitenbeutel' },
  { key: 'dnd',     icon: '🚫', label: 'Bitte nicht stören' },
];

function parseCompletion(raw) {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return { notes: raw }; }
}

// ── Spinner ──────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center h-48 gap-3">
      <div className="w-8 h-8 rounded-full animate-spin"
        style={{ border: '3px solid #2E86C1', borderTopColor: 'transparent' }} />
      <p style={{ color: '#7F8C8D' }}>Wird geladen...</p>
    </div>
  );
}

// ── Tab-Switcher ─────────────────────────────────────────────────
function TabBar({ active, onChange }) {
  return (
    <div className="flex gap-1 mb-4 p-1 rounded-2xl" style={{ background: '#E8EEF4' }}>
      {[['verlauf', '🕐 Verlauf'], ['statistik', '📊 Statistik']].map(([key, label]) => (
        <button key={key} onClick={() => onChange(key)}
          className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
          style={active === key
            ? { background: '#1B4F72', color: '#fff', boxShadow: '0 2px 8px rgba(27,79,114,0.25)' }
            : { color: '#7F8C8D' }}>
          {label}
        </button>
      ))}
    </div>
  );
}

// ── VERLAUF ──────────────────────────────────────────────────────
const TYPE_META = {
  room_checkout: { icon: '🛏', label: 'Abreise',       color: '#C62828', bg: '#FFEBEE' },
  room_service:  { icon: '🧹', label: 'Service',        color: '#E65100', bg: '#FFF3E0' },
  area:          { icon: '🏢', label: 'Gemeinschaft',   color: '#1B4F72', bg: '#EBF5FB' },
  task:          { icon: '📋', label: 'Sonstiges',      color: '#6C3483', bg: '#F5EEF8' },
};

function entryMeta(entry) {
  if (entry.type === 'room') {
    return TYPE_META[`room_${entry.task_type}`] ?? TYPE_META.room_service;
  }
  return TYPE_META[entry.type] ?? { icon: '•', label: entry.type, color: '#7F8C8D', bg: '#F5F5F5' };
}

function entryTitle(entry) {
  if (entry.type === 'room') return `Zimmer ${entry.room_number}`;
  if (entry.type === 'area') return entry.area_name;
  if (entry.type === 'task') return entry.description;
  return '—';
}

function CompletionDetail({ raw, taskType }) {
  const data = parseCompletion(raw);
  if (!data) return null;
  const opts = data.options || [];
  const isServiceJson = Array.isArray(data.options);
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {isServiceJson && opts.length > 0 && SERVICE_OPTIONS.filter(o => opts.includes(o.key)).map(o => (
        <span key={o.key} className="text-xs px-1.5 py-0.5 rounded-lg font-medium"
          style={{ background: 'rgba(230,126,34,0.12)', color: '#C05000' }}>
          {o.icon} {o.label}
        </span>
      ))}
      {data.notes && (
        <span className="text-xs italic" style={{ color: '#7D6608' }}>💬 {data.notes}</span>
      )}
      {!isServiceJson && data.notes && (
        <span className="text-xs italic" style={{ color: '#7D6608' }}>💬 {data.notes}</span>
      )}
    </div>
  );
}

function HistoryEntry({ entry }) {
  const meta = entryMeta(entry);
  const duration = fmt(entry.duration_mins);
  const dt = new Date(entry.timestamp);
  const dateStr = dt.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  const timeStr = dt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex gap-3 py-3" style={{ borderBottom: '1px solid #F0F4F8' }}>
      {/* Ikona typu */}
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-lg"
        style={{ background: meta.bg }}>
        {meta.icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="font-semibold text-sm" style={{ color: '#2C3E50' }}>
              {entryTitle(entry)}
            </span>
            <span className="ml-1.5 text-xs font-semibold px-1.5 py-0.5 rounded-md"
              style={{ background: meta.bg, color: meta.color }}>
              {meta.label}
            </span>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xs font-semibold" style={{ color: '#2C3E50' }}>{dateStr}</div>
            <div className="text-xs" style={{ color: '#7F8C8D' }}>{timeStr}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs" style={{ color: '#7F8C8D' }}>👤 {entry.user_name}</span>
          {duration && (
            <span className="text-xs" style={{ color: '#7F8C8D' }}>· ⏱ {duration}</span>
          )}
        </div>

        {entry.completion_notes && (
          <CompletionDetail raw={entry.completion_notes} taskType={entry.task_type} />
        )}
      </div>
    </div>
  );
}

function VerlaufView() {
  const [entries, setEntries]     = useState([]);
  const [loading, setLoad]        = useState(true);
  const [cleanerFilter, setFilter] = useState('all');

  const load = useCallback(async () => {
    setLoad(true);
    try {
      const data = await api.getHistory(30);
      setEntries(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoad(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const cleaners = [...new Set(entries.map(e => e.user_name))].sort();
  const filtered = cleanerFilter === 'all'
    ? entries
    : entries.filter(e => e.user_name === cleanerFilter);

  // Grupuj po dacie
  const grouped = filtered.reduce((acc, entry) => {
    const day = new Date(entry.timestamp).toLocaleDateString('de-DE', {
      weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
    });
    (acc[day] = acc[day] || []).push(entry);
    return acc;
  }, {});

  return (
    <div>
      {/* Filtr sprzątaczki */}
      <div className="flex gap-1.5 flex-wrap mb-3">
        <button onClick={() => setFilter('all')}
          className={cleanerFilter === 'all' ? 'filter-pill-active' : 'filter-pill-inactive'}>
          Alle
        </button>
        {cleaners.map(name => (
          <button key={name} onClick={() => setFilter(name)}
            className={cleanerFilter === name ? 'filter-pill-active' : 'filter-pill-inactive'}>
            {name}
          </button>
        ))}
      </div>

      {loading && <Spinner />}

      {!loading && filtered.length === 0 && (
        <div className="card text-center py-12" style={{ color: '#7F8C8D' }}>
          <div className="text-4xl mb-2">🕐</div>
          <p>Kein Verlauf der letzten 30 Tage</p>
          <p className="text-xs mt-1">Daten werden ab sofort aufgezeichnet</p>
        </div>
      )}

      {!loading && Object.entries(grouped).map(([day, dayEntries]) => (
        <div key={day} className="mb-2">
          <div className="text-xs font-bold uppercase tracking-wide mb-1 px-1"
            style={{ color: '#7F8C8D' }}>
            {day}
          </div>
          <div className="rounded-2xl px-3"
            style={{ background: '#fff', border: '1px solid #E8EEF4', boxShadow: '0 2px 8px rgba(27,79,114,0.06)' }}>
            {dayEntries.map(entry => (
              <HistoryEntry key={entry.id} entry={entry} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── STATISTIK ────────────────────────────────────────────────────
function StatRow({ icon, label, value, highlight }) {
  return (
    <div className="flex items-center justify-between py-2.5"
      style={{ borderBottom: '1px solid #F0F4F8' }}>
      <span className="text-sm" style={{ color: '#5D6D7E' }}>{icon} {label}</span>
      <span className="font-bold text-sm" style={{ color: highlight ? '#1B4F72' : '#2C3E50' }}>
        {value}
      </span>
    </div>
  );
}

function fmtTotalWork(mins) {
  if (!mins) return '—';
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}min`;
}

function fmtBusiestDay(bd) {
  if (!bd) return '—';
  const d = new Date(bd.date);
  const weekday = d.toLocaleDateString('de-DE', { weekday: 'long' });
  const dateStr = d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  return `${weekday} ${dateStr} — ${bd.count} Aufgaben`;
}

function CleanerCard({ stat }) {
  const hasRoomTimes = stat.fastest_room || stat.slowest_room;
  return (
    <div className="rounded-2xl overflow-hidden animate-in"
      style={{ background: '#fff', boxShadow: '0 2px 12px rgba(27,79,114,0.08)', border: '1px solid #E8EEF4' }}>
      <div className="px-4 py-3 flex items-center gap-3"
        style={{ background: 'linear-gradient(135deg, #1B4F72, #2E86C1)' }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
          style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
          {stat.user_name[0]}
        </div>
        <span className="font-bold text-lg text-white">{stat.user_name}</span>
      </div>
      <div className="px-4 pt-1 pb-3">
        {/* Pokoje — Abreise + Service rozdzielnie */}
        <div className="py-2.5" style={{ borderBottom: '1px solid #F0F4F8' }}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm" style={{ color: '#5D6D7E' }}>🛏 Zimmer</span>
            <span className="font-bold text-sm" style={{ color: stat.rooms_done > 0 ? '#1B4F72' : '#2C3E50' }}>
              {stat.rooms_done}
            </span>
          </div>
          <div className="flex gap-2 ml-1">
            <span className="text-xs px-2 py-0.5 rounded-lg font-semibold"
              style={{ background: '#FFEBEE', color: '#C62828' }}>
              Abreise: {stat.rooms_checkout ?? 0}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-lg font-semibold"
              style={{ background: '#FFF3E0', color: '#E65100' }}>
              Service: {stat.rooms_service ?? 0}
            </span>
          </div>
          {/* Szczegóły opcji serwisu */}
          {stat.rooms_service > 0 && stat.service_options && (
            <div className="mt-2 ml-1 space-y-0.5">
              {[
                { key: 'cleaned', icon: '🧹', label: 'Zimmer gereinigt' },
                { key: 'sweet',   icon: '🍬', label: 'Süßigkeitenbeutel' },
                { key: 'dnd',     icon: '🚫', label: 'Bitte nicht stören' },
                { key: 'none',    icon: '—',  label: 'Ohne Auswahl' },
              ].filter(o => (stat.service_options[o.key] ?? 0) > 0).map(o => (
                <div key={o.key} className="flex items-center justify-between text-xs"
                  style={{ color: '#7F8C8D' }}>
                  <span>{o.icon} {o.label}</span>
                  <span className="font-semibold" style={{ color: '#5D6D7E' }}>
                    {stat.service_options[o.key]}×
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <StatRow icon="🏢" label="Gemeinschaftsbereiche"   value={stat.areas_done}                         highlight={stat.areas_done > 0} />
        <StatRow icon="📋" label="Sonstige Aufgaben"       value={stat.tasks_done}                         highlight={stat.tasks_done > 0} />
        <StatRow icon="⚠️" label="Störungen gemeldet"      value={stat.issues_reported}                    highlight={false} />
        <StatRow icon="⏱" label="Gesamtarbeitszeit"       value={fmtTotalWork(stat.total_work_mins)}      highlight={false} />
        <StatRow icon="📅" label="Aktivster Tag"           value={fmtBusiestDay(stat.busiest_day)}         highlight={false} />

        {/* Średnie czasy per typ */}
        {(stat.avg_checkout_time !== null || stat.avg_service_time !== null) && (
          <div className="mt-3 mb-2 flex gap-2">
            <div className="flex-1 rounded-xl px-3 py-2 text-center"
              style={{ background: '#FFEBEE', border: '1px solid #FFCDD2' }}>
              <div className="text-xs mb-0.5 font-semibold" style={{ color: '#C62828' }}>Ø Abreise</div>
              <div className="font-bold text-sm" style={{ color: '#C62828' }}>
                {fmt(stat.avg_checkout_time) ?? '—'}
              </div>
            </div>
            <div className="flex-1 rounded-xl px-3 py-2 text-center"
              style={{ background: '#FFF3E0', border: '1px solid #FFE0B2' }}>
              <div className="text-xs mb-0.5 font-semibold" style={{ color: '#E65100' }}>Ø Service</div>
              <div className="font-bold text-sm" style={{ color: '#E65100' }}>
                {fmt(stat.avg_service_time) ?? '—'}
              </div>
            </div>
          </div>
        )}

        {/* Najszybszy / najwolniejszy pokój */}
        {hasRoomTimes && (
          <div className="flex gap-2 mt-1">
            {stat.fastest_room && (
              <div className="flex-1 rounded-xl px-3 py-2 text-center"
                style={{ background: '#EAFAF1', border: '1px solid #A9DFBF' }}>
                <div className="text-xs mb-0.5" style={{ color: '#1E8449' }}>🚀 Schnellstes</div>
                <div className="font-bold text-sm" style={{ color: '#1E8449' }}>Zi. {stat.fastest_room.number}</div>
                <div className="text-xs font-medium" style={{ color: '#27AE60' }}>{fmt(stat.fastest_room.mins)}</div>
              </div>
            )}
            {stat.slowest_room && (
              <div className="flex-1 rounded-xl px-3 py-2 text-center"
                style={{ background: '#FEF9E7', border: '1px solid #F9E79F' }}>
                <div className="text-xs mb-0.5" style={{ color: '#B7950B' }}>🐢 Längstes</div>
                <div className="font-bold text-sm" style={{ color: '#B7950B' }}>Zi. {stat.slowest_room.number}</div>
                <div className="text-xs font-medium" style={{ color: '#D4AC0D' }}>{fmt(stat.slowest_room.mins)}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatistikView() {
  const options = monthOptions();
  const [month, setMonth]      = useState(options[0].val);
  const [data, setData]        = useState(null);
  const [loading, setLoad]     = useState(true);
  const [exporting, setExport] = useState(false);

  const load = useCallback(async (m) => {
    setLoad(true);
    try { setData(await api.getStatistics(m)); }
    catch (e) { console.error(e); }
    finally { setLoad(false); }
  }, []);

  useEffect(() => { load(month); }, [month, load]);

  async function handleExport() {
    if (!data) return;
    setExport(true);
    try {
      const history = await api.getHistoryByMonth(month);
      await exportStatisticsPdf({ month, stats: data.stats, history });
    } catch (e) {
      alert('PDF-Export fehlgeschlagen: ' + e.message);
    } finally {
      setExport(false);
    }
  }

  const total = data ? {
    checkout: data.stats.reduce((s, c) => s + (c.rooms_checkout ?? 0), 0),
    service:  data.stats.reduce((s, c) => s + (c.rooms_service  ?? 0), 0),
    areas:    data.stats.reduce((s, c) => s + c.areas_done, 0),
    tasks:    data.stats.reduce((s, c) => s + c.tasks_done, 0),
    issues:   data.stats.reduce((s, c) => s + c.issues_reported, 0),
  } : null;

  const empty = data?.stats.every(
    s => s.rooms_done === 0 && s.areas_done === 0 && s.tasks_done === 0 && s.issues_reported === 0
  );

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <select value={month} onChange={e => setMonth(e.target.value)}
          className="flex-1 border-2 border-slate-200 rounded-xl px-4 py-3 text-base
                     font-semibold focus:outline-none focus:border-[#2E86C1] bg-white"
          style={{ color: '#1B4F72' }}>
          {options.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
        </select>
        <button onClick={handleExport} disabled={exporting || !data}
          className="shrink-0 flex items-center gap-1.5 px-4 py-3 rounded-xl font-semibold text-sm
                     text-white transition-all active:scale-95 disabled:opacity-50"
          style={{ background: '#1B4F72', boxShadow: '0 2px 8px rgba(27,79,114,0.3)' }}>
          {exporting ? '⏳' : '📄'} {exporting ? 'Wird erstellt...' : 'PDF'}
        </button>
      </div>

      {loading && <Spinner />}

      {!loading && data && (
        <>
          {total && (
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { icon: '🛏', val: total.checkout, label: 'Abreise',   color: '#C62828', bg: '#FFEBEE' },
                { icon: '🧹', val: total.service,  label: 'Service',   color: '#E65100', bg: '#FFF3E0' },
                { icon: '🏢', val: total.areas,    label: 'Bereiche',  color: '#1B4F72', bg: null },
                { icon: '📋', val: total.tasks,    label: 'Aufgaben',  color: '#1B4F72', bg: null },
              ].map(({ icon, val, label, color, bg }) => (
                <div key={label} className="rounded-2xl p-2.5 text-center"
                  style={{ background: bg ?? '#fff', boxShadow: '0 2px 8px rgba(27,79,114,0.07)', border: '1px solid #E8EEF4' }}>
                  <div className="text-xl mb-0.5">{icon}</div>
                  <div className="font-bold text-lg leading-none" style={{ color }}>{val}</div>
                  <div className="text-xs mt-0.5" style={{ color: color ?? '#7F8C8D' }}>{label}</div>
                </div>
              ))}
            </div>
          )}
          <div className="space-y-4">
            {data.stats.map(stat => <CleanerCard key={stat.user_id} stat={stat} />)}
          </div>
          {empty && (
            <div className="card text-center py-12 mt-2" style={{ color: '#7F8C8D' }}>
              <div className="text-4xl mb-2">📊</div>
              <p>Keine Daten für diesen Monat</p>
              <p className="text-xs mt-1">Daten werden ab sofort aufgezeichnet</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────
export default function Statistics() {
  const [tab, setTab] = useState('verlauf');
  return (
    <div>
      <TabBar active={tab} onChange={setTab} />
      {tab === 'verlauf'   && <VerlaufView />}
      {tab === 'statistik' && <StatistikView />}
    </div>
  );
}
