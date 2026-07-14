const FLOOR_PREFIX = { 1: 'HB', 2: 'KM' };

/**
 * "HB 01" dla Haus Borkum (floor 1), "KM 01" dla Kleine Möwe (floor 2).
 * Bez prefiksu gdy piętro nieznane/inne (np. stare wpisy historii bez floor).
 */
export function roomLabel(number, floor) {
  const prefix = FLOOR_PREFIX[floor];
  return prefix ? `${prefix} ${number}` : number;
}
