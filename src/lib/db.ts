import "server-only";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { randomBytes, randomUUID } from "node:crypto";

/*
 * Data layer. Everything that touches the database lives in this file, so moving
 * from the local SQLite file to a hosted Postgres database later only changes here.
 */

export type ScheduleItem = { time: string; title: string; detail: string };
export type Reveal = "veil" | "seal";

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
  createdAt: string;
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
  createdAt: string;
  updatedAt: string;
};

const g = globalThis as unknown as { __unveilDb?: DatabaseSync };

function db(): DatabaseSync {
  if (g.__unveilDb) return g.__unveilDb;
  const file = process.env.DATABASE_FILE || path.join(process.cwd(), "data", "unveil.db");
  mkdirSync(path.dirname(file), { recursive: true });
  const d = new DatabaseSync(file);
  d.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS weddings (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      couple_token TEXT NOT NULL UNIQUE,
      data TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS guests (
      id TEXT PRIMARY KEY,
      wedding_id TEXT NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      side TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      seats INTEGER NOT NULL DEFAULT 1,
      code TEXT NOT NULL UNIQUE,
      opened_at TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS guests_wedding ON guests(wedding_id);
    CREATE TABLE IF NOT EXISTS rsvps (
      id TEXT PRIMARY KEY,
      wedding_id TEXT NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
      guest_id TEXT UNIQUE REFERENCES guests(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      attending INTEGER NOT NULL,
      count INTEGER NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS rsvps_wedding ON rsvps(wedding_id);
  `);
  g.__unveilDb = d;
  return d;
}

const now = () => new Date().toISOString();
export const newCode = (bytes = 5) => randomBytes(bytes).toString("base64url").replace(/[-_]/g, "x");

type Row = Record<string, unknown>;

function toWedding(r: Row): Wedding {
  const data = JSON.parse(String(r.data));
  return { ...data, id: String(r.id), slug: String(r.slug), coupleToken: String(r.couple_token), createdAt: String(r.created_at) };
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
    createdAt: String(r.created_at), updatedAt: String(r.updated_at),
  };
}

/* ---------------- Weddings ---------------- */

export type WeddingInput = Omit<Wedding, "id" | "slug" | "coupleToken" | "createdAt">;

export function slugify(s: string) {
  return s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "wedding";
}

export function createWedding(input: WeddingInput): Wedding {
  const d = db();
  let slug = slugify(`${input.partner1}-${input.partner2}`);
  const taken = d.prepare("SELECT 1 FROM weddings WHERE slug = ?");
  if (taken.get(slug)) slug = `${slug}-${newCode(2).toLowerCase()}`;
  const id = randomUUID();
  const createdAt = now();
  d.prepare("INSERT INTO weddings (id, slug, couple_token, data, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(id, slug, newCode(12), JSON.stringify(input), createdAt);
  return getWeddingById(id)!;
}

export function updateWedding(id: string, input: WeddingInput) {
  db().prepare("UPDATE weddings SET data = ? WHERE id = ?").run(JSON.stringify(input), id);
}

export function deleteWedding(id: string) {
  db().prepare("DELETE FROM weddings WHERE id = ?").run(id);
}

export function listWeddings(): Wedding[] {
  return (db().prepare("SELECT * FROM weddings ORDER BY created_at DESC").all() as Row[]).map(toWedding);
}
export function getWeddingById(id: string): Wedding | null {
  const r = db().prepare("SELECT * FROM weddings WHERE id = ?").get(id) as Row | undefined;
  return r ? toWedding(r) : null;
}
export function getWeddingBySlug(slug: string): Wedding | null {
  const r = db().prepare("SELECT * FROM weddings WHERE slug = ?").get(slug) as Row | undefined;
  return r ? toWedding(r) : null;
}
export function getWeddingByCoupleToken(token: string): Wedding | null {
  const r = db().prepare("SELECT * FROM weddings WHERE couple_token = ?").get(token) as Row | undefined;
  return r ? toWedding(r) : null;
}

/* ---------------- Guests ---------------- */

export type GuestInput = { name: string; side: string; phone: string; seats: number };

export function addGuests(weddingId: string, list: GuestInput[]): number {
  const d = db();
  const ins = d.prepare("INSERT INTO guests (id, wedding_id, name, side, phone, seats, code, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  d.exec("BEGIN");
  try {
    for (const gi of list) ins.run(randomUUID(), weddingId, gi.name, gi.side, gi.phone, gi.seats, newCode(5), now());
    d.exec("COMMIT");
  } catch (e) {
    d.exec("ROLLBACK");
    throw e;
  }
  return list.length;
}

export function updateGuest(id: string, weddingId: string, gi: GuestInput) {
  db().prepare("UPDATE guests SET name = ?, side = ?, phone = ?, seats = ? WHERE id = ? AND wedding_id = ?")
    .run(gi.name, gi.side, gi.phone, gi.seats, id, weddingId);
}
export function deleteGuest(id: string, weddingId: string) {
  db().prepare("DELETE FROM guests WHERE id = ? AND wedding_id = ?").run(id, weddingId);
}
export function listGuests(weddingId: string): Guest[] {
  return (db().prepare("SELECT * FROM guests WHERE wedding_id = ? ORDER BY side, name").all(weddingId) as Row[]).map(toGuest);
}
export function getGuestByCode(weddingId: string, code: string): Guest | null {
  const r = db().prepare("SELECT * FROM guests WHERE wedding_id = ? AND code = ?").get(weddingId, code) as Row | undefined;
  return r ? toGuest(r) : null;
}
export function markGuestOpened(guestId: string) {
  db().prepare("UPDATE guests SET opened_at = ? WHERE id = ? AND opened_at IS NULL").run(now(), guestId);
}

/* ---------------- RSVPs ---------------- */

export type RsvpInput = { name: string; attending: boolean; count: number; note: string };

export function saveRsvp(weddingId: string, guestId: string | null, r: RsvpInput): Rsvp {
  const d = db();
  const t = now();
  if (guestId) {
    const existing = d.prepare("SELECT id FROM rsvps WHERE guest_id = ?").get(guestId) as Row | undefined;
    if (existing) {
      d.prepare("UPDATE rsvps SET name = ?, attending = ?, count = ?, note = ?, updated_at = ? WHERE id = ?")
        .run(r.name, r.attending ? 1 : 0, r.count, r.note, t, String(existing.id));
      return toRsvp(d.prepare("SELECT * FROM rsvps WHERE id = ?").get(String(existing.id)) as Row);
    }
  }
  const id = randomUUID();
  d.prepare("INSERT INTO rsvps (id, wedding_id, guest_id, name, attending, count, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .run(id, weddingId, guestId, r.name, r.attending ? 1 : 0, r.count, r.note, t, t);
  return toRsvp(d.prepare("SELECT * FROM rsvps WHERE id = ?").get(id) as Row);
}

export function getRsvpForGuest(guestId: string): Rsvp | null {
  const r = db().prepare("SELECT * FROM rsvps WHERE guest_id = ?").get(guestId) as Row | undefined;
  return r ? toRsvp(r) : null;
}
export function listRsvps(weddingId: string): Rsvp[] {
  return (db().prepare("SELECT * FROM rsvps WHERE wedding_id = ? ORDER BY updated_at DESC").all(weddingId) as Row[]).map(toRsvp);
}

/* ---------------- Summary for dashboards ---------------- */

export type GuestRow = Guest & { rsvp: Rsvp | null };
export type Summary = {
  households: number; seatsInvited: number; opened: number; replied: number;
  attendingPeople: number; declined: number; waiting: number; openLinkReplies: Rsvp[];
};

export function guestRows(weddingId: string): { rows: GuestRow[]; summary: Summary } {
  const guests = listGuests(weddingId);
  const rsvps = listRsvps(weddingId);
  const byGuest = new Map(rsvps.filter(r => r.guestId).map(r => [r.guestId!, r]));
  const rows = guests.map(gu => ({ ...gu, rsvp: byGuest.get(gu.id) ?? null }));
  const openLinkReplies = rsvps.filter(r => !r.guestId);
  const all = [...rows.map(r => r.rsvp).filter(Boolean) as Rsvp[], ...openLinkReplies];
  return {
    rows,
    summary: {
      households: guests.length,
      seatsInvited: guests.reduce((s, x) => s + x.seats, 0),
      opened: guests.filter(x => x.openedAt).length,
      replied: rows.filter(r => r.rsvp).length,
      attendingPeople: all.filter(r => r.attending).reduce((s, r) => s + r.count, 0),
      declined: all.filter(r => !r.attending).length,
      waiting: rows.filter(r => !r.rsvp).length,
      openLinkReplies,
    },
  };
}
