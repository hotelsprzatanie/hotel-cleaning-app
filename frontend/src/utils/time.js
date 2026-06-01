/**
 * Oblicza i formatuje czas trwania sprzątania.
 * Zwraca np. "23 min" lub "1h 05min", albo null gdy brak danych.
 */
export function formatDuration(startedAt, finishedAt) {
  if (!startedAt || !finishedAt) return null;
  const mins = Math.round((new Date(finishedAt) - new Date(startedAt)) / 60000);
  if (mins < 1) return '< 1 min';
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${String(m).padStart(2, '0')}min`;
}
