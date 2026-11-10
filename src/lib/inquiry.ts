/**
 * Cleans a booking request from the public website before it is stored.
 * The browser can send anything, so every field is re-checked here.
 */

// Control characters and invisible "direction override" characters (used to fake what text says)
const INVISIBLE = new RegExp("[" + ["0000-001F","007F-009F","200B-200F","202A-202E","2066-2069","FEFF"].map((r) => r.split("-").map((h) => "\\u" + h).join("-")).join("") + "]", "g");

export const oneLine = (v: unknown, max: number) =>
  String(v ?? "")
    .normalize("NFC")
    .replace(INVISIBLE, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

function validDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export interface CleanInquiry {
  name: string;
  phone: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  room: string;
  message: string;
}

/** Returns the cleaned request, or null if it should be rejected. */
export function cleanInquiry(i: Record<string, unknown>): CleanInquiry | null {
  const name = oneLine(i.name, 100);
  if (!name) return null;

  const phone = oneLine(i.phone, 25);
  if (phone && !/^\+?[0-9 ()-]{5,25}$/.test(phone)) return null;

  const checkIn = oneLine(i.checkIn, 10);
  const checkOut = oneLine(i.checkOut, 10);
  if (checkIn && !validDate(checkIn)) return null;
  if (checkOut && !validDate(checkOut)) return null;
  if (checkIn && checkOut && checkOut < checkIn) return null;

  const g = Number(i.guests);
  const guests = Number.isFinite(g) ? Math.min(Math.max(Math.round(g), 1), 50) : 1;

  return { name, phone, checkIn, checkOut, guests, room: oneLine(i.room, 100), message: "" };
}
