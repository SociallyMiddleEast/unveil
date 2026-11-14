import type { GuestInput } from "./db";

/**
 * One guest per line: "Name, seats, phone, side" (commas or tabs, so a spreadsheet paste works).
 * Only the name is required; a 1–2 digit number is the seat count, a long number is the phone.
 */
export function parseGuestLine(line: string): GuestInput | null {
  const parts = line.split(/\t|,/).map(s => s.trim());
  const name = parts[0];
  if (!name) return null;
  let seats = 1, seatsSet = false, phone = "", side = "";
  for (const p of parts.slice(1)) {
    if (!p) continue;
    const digits = p.replace(/[\s+()-]/g, "");
    if (/^\d{1,2}$/.test(digits) && !seatsSet && Number(digits) > 0 && Number(digits) <= 30) { seats = Number(digits); seatsSet = true; }
    else if (/^\d{6,15}$/.test(digits)) phone = p;
    else side = p;
  }
  return { name: name.slice(0, 120), seats, phone: phone.slice(0, 40), side: side.slice(0, 60) };
}

export function parseGuestList(text: string, max = 500): GuestInput[] {
  return text.split("\n").map(l => l.trim()).filter(Boolean).slice(0, max).map(parseGuestLine).filter(Boolean) as GuestInput[];
}
