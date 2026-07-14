import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { roomLabel } from './room';

// ── Kolory Nordhotels ────────────────────────────────────────────
const NAVY   = [27, 79, 114];    // #1B4F72
const BLUE   = [46, 134, 193];   // #2E86C1
const RED    = [198, 40, 40];    // #C62828
const ORANGE = [230, 81, 0];     // #E65100
const GREY   = [127, 140, 141];  // #7F8C8D
const LGREY  = [240, 244, 248];  // #F0F4F8

// jsPDF/Helvetica nie obsługuje emoji — używamy tekstu
const SERVICE_LABELS = {
  cleaned: 'Zimmer gereinigt',
  sweet:   'Suessigkeitenbeutel',
  dnd:     'Bitte nicht stoeren',
  none:    'Ohne Auswahl',
};


function fmtMins(mins) {
  if (mins === null || mins === undefined) return '—';
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}min`;
}

function fmtMonthLabel(month) {
  const [y, m] = month.split('-');
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
}

function fmtBusiest(bd) {
  if (!bd) return '—';
  const d = new Date(bd.date);
  const weekday = d.toLocaleDateString('de-DE', { weekday: 'long' });
  const dateStr = d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  return `${weekday} ${dateStr} — ${bd.count} Aufgaben`;
}

function entryLabel(entry) {
  if (entry.type === 'room') {
    const typ = entry.task_type === 'checkout' ? 'Abreise' : 'Service';
    return `Zimmer ${roomLabel(entry.room_number, entry.floor)} (${typ})`;
  }
  if (entry.type === 'area') return entry.area_name;
  if (entry.type === 'task') return entry.description ?? '—';
  return '—';
}

function entryType(entry) {
  if (entry.type === 'room') return entry.task_type === 'checkout' ? 'Abreise' : 'Service';
  if (entry.type === 'area') return 'Gemeinschaft';
  return 'Sonstiges';
}

function parseServiceNotes(raw) {
  if (!raw) return null;
  try {
    const d = JSON.parse(raw);
    const parts = [];
    if (Array.isArray(d.options) && d.options.length > 0)
      parts.push(...d.options.map(o => SERVICE_LABELS[o] ?? o)); // bez emoji
    if (d.notes) parts.push(d.notes);
    return parts.join(', ') || null;
  } catch {
    return raw;
  }
}

// ── Główna funkcja eksportu ──────────────────────────────────────
export async function exportStatisticsPdf({ month, stats, history }) {
  const doc   = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W     = doc.internal.pageSize.getWidth();   // 210
  const monthLabel = fmtMonthLabel(month);
  const today = new Date().toLocaleDateString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });

  let y = 0; // aktualna pozycja Y

  // ── Nagłówek ──────────────────────────────────────────────────
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, W, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(`Nordhotels — Statistik`, 14, 12);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(monthLabel, 14, 21);
  doc.setFontSize(9);
  doc.text(`Erstellt am: ${today}`, W - 14, 21, { align: 'right' });
  y = 36;

  // ── Podsumowanie miesiąca ─────────────────────────────────────
  const total = {
    checkout: stats.reduce((s, c) => s + (c.rooms_checkout ?? 0), 0),
    service:  stats.reduce((s, c) => s + (c.rooms_service  ?? 0), 0),
    areas:    stats.reduce((s, c) => s + c.areas_done, 0),
    tasks:    stats.reduce((s, c) => s + c.tasks_done, 0),
  };

  doc.setTextColor(...NAVY);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Monatsübersicht', 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [['Abreise', 'Service', 'Gemeinschaftsbereiche', 'Sonstige Aufgaben']],
    body: [[total.checkout, total.service, total.areas, total.tasks]],
    styles:     { fontSize: 11, halign: 'center', cellPadding: 4 },
    headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: 'bold' },
    bodyStyles: { fillColor: LGREY, textColor: [44, 62, 80] },
    margin: { left: 14, right: 14 },
    theme: 'grid',
  });
  y = doc.lastAutoTable.finalY + 8;

  // ── Karta per sprzątaczka ─────────────────────────────────────
  for (const stat of stats) {
    // Sprawdź czy trzeba nową stronę (karta zajmuje ~90mm)
    if (y > 190) { doc.addPage(); y = 16; }

    // Nagłówek karty
    doc.setFillColor(...BLUE);
    doc.roundedRect(14, y, W - 28, 9, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(stat.user_name, 19, y + 6);
    y += 13;

    // Główne dane
    const rows = [
      ['Abreise',             String(stat.rooms_checkout ?? 0)],
      ['Service',             String(stat.rooms_service  ?? 0)],
      ['Gemeinschaftsbereiche', String(stat.areas_done)],
      ['Sonstige Aufgaben',   String(stat.tasks_done)],
      ['Störungen gemeldet',  String(stat.issues_reported)],
      ['Gesamtarbeitszeit',   fmtMins(stat.total_work_mins)],
      ['Ø Abreise',           fmtMins(stat.avg_checkout_time)],
      ['Ø Service',           fmtMins(stat.avg_service_time)],
      ['Aktivster Tag',       fmtBusiest(stat.busiest_day)],
      ['Schnellstes Zimmer',  stat.fastest_room ? `Zi. ${roomLabel(stat.fastest_room.number, stat.fastest_room.floor)} — ${fmtMins(stat.fastest_room.mins)}` : '—'],
      ['Langsamstes Zimmer',  stat.slowest_room ? `Zi. ${roomLabel(stat.slowest_room.number, stat.slowest_room.floor)} — ${fmtMins(stat.slowest_room.mins)}` : '—'],
    ];

    autoTable(doc, {
      startY: y,
      body: rows,
      styles:      { fontSize: 9, cellPadding: 2.5 },
      columnStyles: {
        0: { fontStyle: 'bold', textColor: GREY,             cellWidth: 65 },
        1: { textColor: [44, 62, 80],                        cellWidth: 'auto' },
      },
      margin: { left: 14, right: 14 },
      theme: 'striped',
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
    y = doc.lastAutoTable.finalY + 2;

    // Opcje serwisu (tylko jeśli były) — bez emoji (jsPDF/Helvetica)
    if (stat.rooms_service > 0 && stat.service_options) {
      const optRows = [
        ['cleaned', 'Zimmer gereinigt'],
        ['sweet',   'Suessigkeitenbeutel'],
        ['dnd',     'Bitte nicht stoeren'],
        ['none',    'Ohne Auswahl'],
      ]
        .filter(([k]) => (stat.service_options[k] ?? 0) > 0)
        .map(([k, label]) => [label, `${stat.service_options[k]}x`]);

      if (optRows.length) {
        if (y > 260) { doc.addPage(); y = 16; }
        doc.setTextColor(...ORANGE);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('Service-Optionen:', 19, y + 4);
        y += 6;

        autoTable(doc, {
          startY: y,
          body: optRows,
          styles:      { fontSize: 8, cellPadding: 1.8 },
          columnStyles: {
            0: { textColor: [100, 80, 20], cellWidth: 65 },
            1: { textColor: [...ORANGE], fontStyle: 'bold', halign: 'right' },
          },
          margin: { left: 19, right: 14 },
          theme: 'plain',
        });
        y = doc.lastAutoTable.finalY;
      }
    }

    y += 8;
  }

  // ── Historia zadań w miesiącu ─────────────────────────────────
  if (history && history.length > 0) {
    if (y > 200) { doc.addPage(); y = 16; }

    doc.setTextColor(...NAVY);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Aufgabenhistorie — ${monthLabel}`, 14, y);
    y += 5;

    const histRows = history.map(h => [
      new Date(h.timestamp).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
      new Date(h.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
      h.user_name,
      entryLabel(h),
      entryType(h),
      fmtMins(h.duration_mins),
      parseServiceNotes(h.completion_notes) ?? '—',
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Datum', 'Zeit', 'Name', 'Aufgabe', 'Typ', 'Dauer', 'Anmerkungen']],
      body: histRows,
      styles:     { fontSize: 7.5, cellPadding: 2 },
      headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 14 },
        1: { cellWidth: 11 },
        2: { cellWidth: 22 },
        3: { cellWidth: 45 },
        4: { cellWidth: 20 },
        5: { cellWidth: 16 },
        6: { cellWidth: 'auto' },
      },
      margin: { left: 14, right: 14 },
      theme: 'striped',
      alternateRowStyles: { fillColor: [248, 250, 252] },
      didParseCell(data) {
        if (data.section === 'body' && data.column.index === 4) {
          const typ = data.cell.raw;
          if (typ === 'Abreise')     data.cell.styles.textColor = RED;
          else if (typ === 'Service')  data.cell.styles.textColor = ORANGE;
          else if (typ === 'Gemeinschaft') data.cell.styles.textColor = NAVY;
        }
      },
    });
  }

  // ── Stopka ────────────────────────────────────────────────────
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(...GREY);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Nordhotels — ${monthLabel} — Seite ${i} von ${pages}`,
      W / 2, doc.internal.pageSize.getHeight() - 6,
      { align: 'center' }
    );
  }

  doc.save(`Nordhotels_Statistik_${month}.pdf`);
}
