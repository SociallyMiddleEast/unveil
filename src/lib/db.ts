import "server-only";
import { createClient, type Client, type InStatement, type Row } from "@libsql/client";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { randomBytes, randomUUID } from "node:crypto";

/*
 * Data layer. Everything that touches the database lives in this file.
 * Locally it uses a SQLite file (data/unveil.db). Online it uses a hosted libSQL
 * database (Turso): set DATABASE_URL and DATABASE_AUTH_TOKEN.
 */

export type ScheduleItem = { time: string; title: string; detail: string };
export type Reveal = "veil" | "seal" | "velvet";
export type Note = { title: string; text: string };

/** The order's progress, in the order a couple sees it. */
export const STAGES = ["details", "designing", "preview", "approved", "live"] as const;
export type Stage = (typeof STAGES)[number];
export const STAGE_LABEL: Record<Stage, string> = {
  details: "Details received",
  designing: "Being designed",
  preview: "Preview ready for you",
  approved: "Approved by you",
  live: "Ready to send",
};

export type Wedding = {
  id: string;
  slug: string;
  coupleToken: string;
  partner1: string;
  partner2: string;
  startsAt: string; // ISO, UTC
  timeZone: string;
  city: string;
  venueName: string;
  venueAddress: string;
  mapsQuery: string;
  intro: string;
  storyTitle: string;
  story: string;
  schedule: ScheduleItem[];
  dressTitle: string;
  dressText: string;
  giftsText: string;
  rsvpDeadline: string; // YYYY-MM-DD or ""
  reveal: Reveal;
  /* The Velvet Court template */
  letter: string;
  venueNote: string;
  dressHer: string;
  dressHim: string;
  palette: string[];
  notes: Note[];
  meals: string[];
  createdAt: string;
  stage: Stage;
  approvedAt: string | null;
  changeRequest: string;
  changeRequestAt: string | null;
};

export type Guest = {
  id: string;
  weddingId: string;
  name: string;
  side: string;
  phone: string;
  seats: number;
  code: string;
  openedAt: string | null;
  createdAt: string;
};

export type Rsvp = {
  id: string;
  weddingId: string;
  guestId: string | null;
  name: string;
  attending: boolean;
  count: number;
  note: string;
  meal: string;
  createdAt: string;
  updatedAt: string;
};

const g = globalThis as unknown as { __unveilDb?: Promise<Client> };

async function open(): Promise<Client> {
  let url = process.env.DATABASE_URL;
  if (!url) {
    const file = process.env.DATABASE_FILE || path.join(process.cwd(), "data", "unveil.db");
    mkdirSync(path.dirname(file), { recursive: true });
    url = "file:" + file;
  }
  const c = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
  await c.batch([
    `CREATE TABLE IF NOT EXISTS weddings (
      id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, couple_token TEXT NOT NULL UNIQUE,
      data TEXT NOT NULL, created_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS guests (
      id TEXT PRIMARY KEY, wedding_id TEXT NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
      name TEXT NOT NULL, side TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT '',
      seats INTEGER NOT NULL DEFAULT 1, code TEXT NOT NULL UNIQUE, opened_at TEXT, created_at TEXT NOT NULL)`,
    `CREATE INDEX IF NOT EXISTS guests_wedding ON guests(wedding_id)`,
    `CREATE TABLE IF NOT EXISTS rsvps (
      id TEXT PRIMARY KEY, wedding_id TEXT NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
      guest_id TEXT UNIQUE REFERENCES guests(id) ON DELETE CASCADE, name TEXT NOT NULL,
      attending INTEGER NOT NULL, count INTEGER NOT NULL, note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
    `CREATE INDEX IF NOT EXISTS rsvps_wedding ON rsvps(wedding_id)`,
  ], "write");
  // Columns added after the first version.
  const cols = (await c.execute("PRAGMA table_info(weddings)")).rows.map(r => String(r.name));
  const add: [string, string][] = [
    ["stage", "TEXT NOT NULL DEFAULT 'details'"], ["approved_at", "TEXT"],
    ["change_request", "TEXT NOT NULL DEFAULT ''"], ["change_request_at", "TEXT"],
  ];
  for (const [name, def] of add) if (!cols.includes(name)) await c.execute(`ALTER TABLE weddings ADD COLUMN ${name} ${def}`);
  const rcols = (await c.execute("PRAGMA table_info(rsvps)")).rows.map(r => String(r.name));
  if (!rcols.includes("meal")) await c.execute("ALTER TABLE rsvps ADD COLUMN meal TEXT NOT NULL DEFAULT ''");
  await c.execute("PRAGMA foreign_keys = ON");
  return c;
}

function db(): Promise<Client> {
  if (!g.__unveilDb) g.__unveilDb = open().catch(e => { g.__unveilDb = undefined; throw e; });
  return g.__unveilDb;
}

async function run(sql: string, args: (string | number | null)[] = []) {
  return (await db()).execute({ sql, args });
}
async function all(sql: string, args: (string | number | null)[] = []): Promise<Row[]> {
  return (await run(sql, args)).rows;
}
async function one(sql: string, args: (string | number | null)[] = []): Promise<Row | undefined> {
  return (await run(sql, args)).rows[0];
}

const now = () => new Date().toISOString();

/** Values for the template fields on weddings created before those fields existed. */
export const TEMPLATE_DEFAULTS = {
  letter: "", venueNote: "", dressHer: "", dressHim: "",
  palette: [] as string[], notes: [] as Note[], meals: [] as string[],
};
export const newCode = (bytes = 5) => randomBytes(bytes).toString("base64url").replace(/[-_]/g, "x");

function toWedding(r: Row): Wedding {
  const data = { ...TEMPLATE_DEFAULTS, ...JSON.parse(String(r.data)) };
  const stage = STAGES.includes(String(r.stage) as Stage) ? (String(r.stage) as Stage) : "details";
  return {
    ...data, id: String(r.id), slug: String(r.slug), coupleToken: String(r.couple_token), createdAt: String(r.created_at),
    stage, approvedAt: r.approved_at ? String(r.approved_at) : null,
    changeRequest: r.change_request ? String(r.change_request) : "", changeRequestAt: r.change_request_at ? String(r.change_request_at) : null,
  };
}
function toGuest(r: Row): Guest {
  return {
    id: String(r.id), weddingId: String(r.wedding_id), name: String(r.name), side: String(r.side),
    phone: String(r.phone), seats: Number(r.seats), code: String(r.code),
    openedAt: r.opened_at ? String(r.opened_at) : null, createdAt: String(r.created_at),
  };
}
function toRsvp(r: Row): Rsvp {
  return {
    id: String(r.id), weddingId: String(r.wedding_id), guestId: r.guest_id ? String(r.guest_id) : null,
    name: String(r.name), attending: Number(r.attending) === 1, count: Number(r.count), note: String(r.note),
    meal: r.meal ? String(r.meal) : "", createdAt: String(r.created_at), updatedAt: String(r.updated_at),
  };
}

/* ---------------- Weddings ---------------- */

export type WeddingInput = Omit<Wedding, "id" | "slug" | "coupleToken" | "createdAt" | "stage" | "approvedAt" | "changeRequest" | "changeRequestAt">;

export function slugify(s: string) {
  return s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "wedding";
}

export async function createWedding(input: WeddingInput): Promise<Wedding> {
  let slug = slugify(`${input.partner1}-${input.partner2}`);
  if (await one("SELECT 1 FROM weddings WHERE slug = ?", [slug])) slug = `${slug}-${newCode(2).toLowerCase()}`;
  const id = randomUUID();
  await run("INSERT INTO weddings (id, slug, couple_token, data, created_at, stage) VALUES (?, ?, ?, ?, ?, 'details')",
    [id, slug, newCode(12), JSON.stringify(input), now()]);
  return (await getWeddingById(id))!;
}

export async function updateWedding(id: string, input: WeddingInput) {
  await run("UPDATE weddings SET data = ? WHERE id = ?", [JSON.stringify(input), id]);
}

export async function setStage(id: string, stage: Stage) {
  await run(
    "UPDATE weddings SET stage = ?, approved_at = CASE WHEN ? = 'approved' THEN COALESCE(approved_at, ?) WHEN ? IN ('details','designing','preview') THEN NULL ELSE approved_at END WHERE id = ?",
    [stage, stage, now(), stage, id]);
}

/** The couple approves their preview. Only allowed while a preview is waiting. */
export async function approvePreview(id: string) {
  await run("UPDATE weddings SET stage = 'approved', approved_at = ?, change_request = '', change_request_at = NULL WHERE id = ? AND stage = 'preview'", [now(), id]);
}

/** The couple asks for changes to their preview; it goes back to the designer. */
export async function requestChanges(id: string, text: string) {
  await run("UPDATE weddings SET stage = 'designing', change_request = ?, change_request_at = ? WHERE id = ? AND stage = 'preview'", [text, now(), id]);
}

export async function deleteWedding(id: string) {
  await run("DELETE FROM rsvps WHERE wedding_id = ?", [id]);
  await run("DELETE FROM guests WHERE wedding_id = ?", [id]);
  await run("DELETE FROM weddings WHERE id = ?", [id]);
}

export async function listWeddings(): Promise<Wedding[]> {
  return (await all("SELECT * FROM weddings ORDER BY created_at DESC")).map(toWedding);
}
export async function getWeddingById(id: string): Promise<Wedding | null> {
  const r = await one("SELECT * FROM weddings WHERE id = ?", [id]);
  return r ? toWedding(r) : null;
}
export async function getWeddingBySlug(slug: string): Promise<Wedding | null> {
  const r = await one("SELECT * FROM weddings WHERE slug = ?", [slug]);
  return r ? toWedding(r) : null;
}
export async function getWeddingByCoupleToken(token: string): Promise<Wedding | null> {
  const r = await one("SELECT * FROM weddings WHERE couple_token = ?", [token]);
  return r ? toWedding(r) : null;
}

/* ---------------- Guests ---------------- */

export type GuestInput = { name: string; side: string; phone: string; seats: number };

export async function addGuests(weddingId: string, list: GuestInput[]): Promise<number> {
  if (!list.length) return 0;
  const stmts: InStatement[] = list.map(gi => ({
    sql: "INSERT INTO guests (id, wedding_id, name, side, phone, seats, code, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    args: [randomUUID(), weddingId, gi.name, gi.side, gi.phone, gi.seats, newCode(5), now()],
  }));
  await (await db()).batch(stmts, "write");
  return list.length;
}

export async function deleteGuest(id: string, weddingId: string) {
  await run("DELETE FROM rsvps WHERE guest_id = ? AND wedding_id = ?", [id, weddingId]);
  await run("DELETE FROM guests WHERE id = ? AND wedding_id = ?", [id, weddingId]);
}
export async function listGuests(weddingId: string): Promise<Guest[]> {
  return (await all("SELECT * FROM guests WHERE wedding_id = ? ORDER BY side, name", [weddingId])).map(toGuest);
}
export async function getGuestByCode(weddingId: string, code: string): Promise<Guest | null> {
  const r = await one("SELECT * FROM guests WHERE wedding_id = ? AND code = ?", [weddingId, code]);
  return r ? toGuest(r) : null;
}
export async function markGuestOpened(guestId: string) {
  await run("UPDATE guests SET opened_at = ? WHERE id = ? AND opened_at IS NULL", [now(), guestId]);
}

/* ---------------- RSVPs ---------------- */

export type RsvpInput = { name: string; attending: boolean; count: number; note: string; meal?: string };

export async function saveRsvp(weddingId: string, guestId: string | null, r: RsvpInput): Promise<void> {
  const t = now();
  if (guestId) {
    const existing = await one("SELECT id FROM rsvps WHERE guest_id = ?", [guestId]);
    if (existing) {
      await run("UPDATE rsvps SET name = ?, attending = ?, count = ?, note = ?, meal = ?, updated_at = ? WHERE id = ?",
        [r.name, r.attending ? 1 : 0, r.count, r.note, r.meal ?? "", t, String(existing.id)]);
      return;
    }
  }
  await run("INSERT INTO rsvps (id, wedding_id, guest_id, name, attending, count, note, meal, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [randomUUID(), weddingId, guestId, r.name, r.attending ? 1 : 0, r.count, r.note, r.meal ?? "", t, t]);
}

export async function getRsvpForGuest(guestId: string): Promise<Rsvp | null> {
  const r = await one("SELECT * FROM rsvps WHERE guest_id = ?", [guestId]);
  return r ? toRsvp(r) : null;
}
export async function listRsvps(weddingId: string): Promise<Rsvp[]> {
  return (await all("SELECT * FROM rsvps WHERE wedding_id = ? ORDER BY updated_at DESC", [weddingId])).map(toRsvp);
}

/* ---------------- Summary for dashboards ---------------- */

export type GuestRow = Guest & { rsvp: Rsvp | null };
export type Summary = {
  households: number; seatsInvited: number; opened: number; replied: number;
  attendingPeople: number; declined: number; waiting: number; openLinkReplies: Rsvp[];
};

export async function guestRows(weddingId: string): Promise<{ rows: GuestRow[]; summary: Summary }> {
  const [guests, rsvps] = await Promise.all([listGuests(weddingId), listRsvps(weddingId)]);
  const byGuest = new Map(rsvps.filter(r => r.guestId).map(r => [r.guestId!, r]));
  const rows = guests.map(gu => ({ ...gu, rsvp: byGuest.get(gu.id) ?? null }));
  const openLinkReplies = rsvps.filter(r => !r.guestId);
  const allReplies = [...(rows.map(r => r.rsvp).filter(Boolean) as Rsvp[]), ...openLinkReplies];
  return {
    rows,
    summary: {
      households: guests.length,
      seatsInvited: guests.reduce((s, x) => s + x.seats, 0),
      opened: guests.filter(x => x.openedAt).length,
      replied: rows.filter(r => r.rsvp).length,
      attendingPeople: allReplies.filter(r => r.attending).reduce((s, r) => s + r.count, 0),
      declined: allReplies.filter(r => !r.attending).length,
      waiting: rows.filter(r => !r.rsvp).length,
      openLinkReplies,
    },
  };
}
