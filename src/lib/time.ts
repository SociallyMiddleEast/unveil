/* Wedding times are entered as Lebanon local time and stored in UTC. */

export const DEFAULT_TZ = "Asia/Beirut";

function offsetMs(utcMs: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(new Date(utcMs));
  const v = (t: string) => Number(parts.find(p => p.type === t)?.value);
  const asUtc = Date.UTC(v("year"), v("month") - 1, v("day"), v("hour"), v("minute"), v("second"));
  return asUtc - utcMs;
}

/** "2027-06-12T17:00" in Beirut → ISO UTC string. */
export function localToUtcIso(local: string, timeZone = DEFAULT_TZ): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(local);
  if (!m) throw new Error("Invalid date");
  const guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  let utc = guess - offsetMs(guess, timeZone);
  utc = guess - offsetMs(utc, timeZone); // second pass settles daylight-saving edges
  return new Date(utc).toISOString();
}

/** ISO UTC → "2027-06-12T17:00" in the wedding's time zone, for form inputs. */
export function utcIsoToLocalInput(iso: string, timeZone = DEFAULT_TZ): string {
  const t = Date.parse(iso);
  const local = new Date(t + offsetMs(t, timeZone));
  return local.toISOString().slice(0, 16);
}

export function formatDateLong(iso: string, timeZone = DEFAULT_TZ) {
  return new Intl.DateTimeFormat("en-GB", { timeZone, weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
}
export function formatDateDots(iso: string, timeZone = DEFAULT_TZ) {
  const p = new Intl.DateTimeFormat("en-GB", { timeZone, day: "2-digit", month: "2-digit", year: "numeric" }).formatToParts(new Date(iso));
  const v = (t: string) => p.find(x => x.type === t)?.value ?? "";
  return `${v("day")} · ${v("month")} · ${v("year")}`;
}
export function formatTime(iso: string, timeZone = DEFAULT_TZ) {
  return new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(iso));
}
export function formatDeadline(ymd: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return "";
  const [y, m, d] = ymd.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" }).format(new Date(Date.UTC(y, m - 1, d)));
}
export function formatStamp(iso: string | null, timeZone = DEFAULT_TZ) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-GB", { timeZone, day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(iso));
}
