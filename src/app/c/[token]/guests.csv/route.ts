import { getWeddingByCoupleToken, guestRows } from "@/lib/db";

export const dynamic = "force-dynamic";

const cell = (v: unknown) => {
  const s = String(v ?? "");
  // Neutralise spreadsheet formulas and quote every cell.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const w = getWeddingByCoupleToken(token);
  if (!w) return new Response("Not found", { status: 404 });
  const { rows, summary } = guestRows(w.id);
  const lines = [["Guest", "Side", "Phone", "Seats invited", "Answer", "Coming", "Note", "Opened", "Replied"]];
  for (const r of rows) {
    lines.push([r.name, r.side, r.phone, String(r.seats),
      r.rsvp ? (r.rsvp.attending ? "Attending" : "Declined") : "No reply",
      r.rsvp ? String(r.rsvp.count) : "", r.rsvp?.note ?? "", r.openedAt ? "Yes" : "No", r.rsvp?.updatedAt ?? ""]);
  }
  for (const r of summary.openLinkReplies) {
    lines.push([r.name, "Shared link", "", "", r.attending ? "Attending" : "Declined", String(r.count), r.note, "", r.updatedAt]);
  }
  const csv = "﻿" + lines.map(l => l.map(cell).join(",")).join("\r\n");
  const file = `${w.partner1}-${w.partner2}-guests.csv`.replace(/[^\w.-]+/g, "-");
  return new Response(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${file}"`, "Cache-Control": "no-store" },
  });
}
