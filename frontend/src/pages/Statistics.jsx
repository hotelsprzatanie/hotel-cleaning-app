import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

function fmt(mins) {
  if (mins === null || mins === undefined) return '—';
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

function StatRow({ icon, label, value, highlight }) {
  return (
    <div className="flex items-center justify-between py-2.5"
      style={{ borderBottom: '1px solid #F0F4F8' }}>
      <span className="text-sm" style={{ color: '#5D6D7E' }}>
        {icon} {label}
      </span>
      <span className="font-bold text-sm"
        style={{ color: highlight ? '#1B4F72' : '#2C3E50' }}>
        {value}
      </span>
    </div>
  );
}

function CleanerCard({ stat }) {
  const hasRoomTimes = stat.fastest_room || stat.slowest_room;

  return (
    <div className="rounded-2xl overflow-hidden animate-in"
      style={{ background: '#fff', boxShadow: '0 2px 12px rgba(27,79,114,0.08)', border: '1px solid #E8EEF4' }}>
      {/* Nagłówek karty */}
      <div className="px-4 py-3 flex items-center gap-3"
        style={{ background: 'linear-gradient(135deg, #1B4F72, #2E86C1)' }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
          style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
          {stat.user_name[0]}
        </div>
        <span className="font-bold text-lg text-white">{stat.user_name}</span>
      </div>

      <div className="px-4 pt-1 pb-3">
        <StatRow icon="🛏" label="Zimmer gereinigt"       value={stat.rooms_done}       highlight={stat.rooms_done > 0} />
        <StatRow icon="🏢" label="Gemeinschaftsbereiche"  value={stat.areas_done}       highlight={stat.areas_done > 0} />
        <StatRow icon="📋" label="Sonstige Aufgaben"      value={stat.tasks_done}       highlight={stat.tasks_done > 0} />
        <StatRow icon="⚠️" label="Störungen gemeldet"     value={stat.issues_reported}  highlight={false} />
        <StatRow icon="⏱" label="Ø Reinigungszeit"       value={fmt(stat.avg_room_time)} highlight={false} />

        {hasRoomTimes && (
          <div className="mt-3 flex gap-2">
            {stat.fastest_room && (
              <div className="flex-1 rounded-xl px-3 py-2 text-center"
                style={{ background: '#EAFAF1', border: '1px solid #A9DFBF' }}>
                <div className="text-xs mb-0.5" style={{ color: '#1E8449' }}>🚀 Schnellstes</div>
                <div className="font-bold text-sm" style={{ color: '#1E8449' }}>
                  Zi. {stat.fastest_room.number}
                </div>
                <div className="text-xs font-medium" style={{ color: '#27AE60' }}>
                  {fmt(stat.fastest_room.mins)}
                </div>
              </div>
            )}
            {stat.slowest_room && (
              <div className="flex-1 rounded-xl px-3 py-2 text-center"
                style={{ background: '#FEF9E7', border: '1px solid #F9E79F' }}>
                <div className="text-xs mb-0.5" style={{ color: '#B7950B' }}>🐢 Längstes</div>
                <div className="font-bold text-sm" style={{ color: '#B7950B' }}>
                  Zi. {stat.slowest_room.number}
                </div>
                <div className="text-xs font-medium" style={{ color: '#D4AC0D' }}>
                  {fmt(stat.slowest_room.mins)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Statistics() {
  const options = monthOptions();
  const [month, setMonth]   = useState(options[0].val);
  const [data, setData]     = useState(null);
  const [loading, setLoad]  = useState(true);
  const [error, setError]   = useState('');

  const fetch = useCallback(async (m) => {
    setLoad(true); setError('');
    try {
      const result = await api.getStatistics(m);
      setData(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoad(false);
    }
  }, []);

  useEffect(() => { fetch(month); }, [month, fetch]);

  const total = data ? {
    rooms:  data.stats.reduce((s, c) => s + c.rooms_done, 0),
    areas:  data.stats.reduce((s, c) => s + c.areas_done, 0),
    tasks:  data.stats.reduce((s, c) => s + c.tasks_done, 0),
    issues: data.stats.reduce((s, c) => s + c.issues_reported, 0),
  } : null;

  return (
    <div>
      {/* Filtr miesiąca */}
      <div className="mb-4">
        <select value={month} onChange={e => setMonth(e.target.value)}
          className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base
                     font-semibold focus:outline-none focus:border-[#2E86C1] bg-white"
          style={{ color: '#1B4F72' }}>
          {options.map(o => (
            <option key={o.val} value={o.val}>{o.label}</option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center h-48 gap-3">
          <div className="w-8 h-8 rounded-full animate-spin"
            style={{ border: '3px solid #2E86C1', borderTopColor: 'transparent' }} />
          <p style={{ color: '#7F8C8D' }}>Wird geladen...</p>
        </div>
      )}

      {error && (
        <div className="rounded-xl px-4 py-3 text-sm font-medium mb-4"
          style={{ background: '#FDEDEC', color: '#C0392B' }}>
          {error}
        </div>
      )}

      {!loading && data && (
        <>
          {/* Podsumowanie miesiąca */}
          {total && (
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { icon: '🛏', val: total.rooms,  label: 'Zimmer' },
                { icon: '🏢', val: total.areas,  label: 'Bereiche' },
                { icon: '📋', val: total.tasks,  label: 'Aufgaben' },
                { icon: '⚠️', val: total.issues, label: 'Störungen' },
              ].map(({ icon, val, label }) => (
                <div key={label} className="rounded-2xl p-2.5 text-center"
                  style={{ background: '#fff', boxShadow: '0 2px 8px rgba(27,79,114,0.07)', border: '1px solid #E8EEF4' }}>
                  <div className="text-xl mb-0.5">{icon}</div>
                  <div className="font-bold text-lg leading-none" style={{ color: '#1B4F72' }}>{val}</div>
                  <div className="text-xs mt-0.5" style={{ color: '#7F8C8D' }}>{label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Karty sprzątaczek */}
          <div className="space-y-4">
            {data.stats.map(stat => (
              <CleanerCard key={stat.user_id} stat={stat} />
            ))}
          </div>

          {data.stats.every(s => s.rooms_done === 0 && s.areas_done === 0 && s.tasks_done === 0 && s.issues_reported === 0) && (
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
