import type { GuestRow, Rsvp, Wedding } from "@/lib/db";
import { inviteMessage, inviteUrl, reminderMessage, waLink, waNumber } from "@/lib/links";
import { formatStamp } from "@/lib/time";
import { CopyButton } from "./CopyButton";

export type Filter = "all" | "attending" | "declined" | "waiting" | "unopened";

export function filterRows(rows: GuestRow[], f: Filter) {
  switch (f) {
    case "attending": return rows.filter(r => r.rsvp?.attending);
    case "declined": return rows.filter(r => r.rsvp && !r.rsvp.attending);
    case "waiting": return rows.filter(r => !r.rsvp);
    case "unopened": return rows.filter(r => !r.openedAt);
    default: return rows;
  }
}

function Status({ r }: { r: GuestRow }) {
  if (r.rsvp) return r.rsvp.attending
    ? <span className="st-pill yes">Attending · {r.rsvp.count}</span>
    : <span className="st-pill no">Declined</span>;
  if (r.openedAt) return <span className="st-pill seen">Opened, no reply</span>;
  return <span className="st-pill wait">Not opened</span>;
}

/** Guest table shared by the studio and the couple dashboard. */
export function GuestTable({ wedding, rows, base, mode, removeAction }: {
  wedding: Wedding; rows: GuestRow[]; base: string; mode: "studio" | "couple";
  removeAction?: (form: FormData) => Promise<void>;
}) {
  if (!rows.length) return <p className="hint">No guests here yet.</p>;
  return (
    <div className="st-tablewrap">
      <table>
        <thead>
          <tr><th>Guest</th><th>Side</th><th>Seats</th><th>Status</th><th>Note</th><th>Last change</th><th>Send</th></tr>
        </thead>
        <tbody>
          {rows.map(r => {
            const url = inviteUrl(base, wedding, r);
            const hasPhone = !!waNumber(r.phone);
            const msg = r.rsvp || r.openedAt ? reminderMessage(wedding, r, url) : inviteMessage(wedding, r, url);
            return (
              <tr key={r.id}>
                <td><b style={{ fontWeight: 500 }}>{r.name}</b>{r.phone && <div className="note" style={{ fontStyle: "normal" }}>{r.phone}</div>}</td>
                <td>{r.side}</td>
                <td className="num">{r.seats}</td>
                <td><Status r={r} /></td>
                <td>{r.rsvp?.note && <div className="note">“{r.rsvp.note}”</div>}</td>
                <td style={{ whiteSpace: "nowrap" }}>{formatStamp(r.rsvp?.updatedAt ?? r.openedAt, wedding.timeZone)}</td>
                <td>
                  <div className="st-actions">
                    {!r.rsvp && (hasPhone
                      ? <a className="btn btn-sm" target="_blank" rel="noopener noreferrer" href={waLink(r.phone, msg)}>{r.openedAt ? "Remind" : "WhatsApp"}</a>
                      : <CopyButton text={msg} label="Copy message" />)}
                    {mode === "studio" && <CopyButton text={url} label="Copy link" />}
                    {mode === "studio" && removeAction && (
                      <form action={removeAction}>
                        <input type="hidden" name="weddingId" value={wedding.id} />
                        <input type="hidden" name="guestId" value={r.id} />
                        <button className="btn btn-sm st-danger" type="submit" aria-label={`Remove ${r.name}`}>Remove</button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function OpenLinkReplies({ replies, tz }: { replies: Rsvp[]; tz: string }) {
  if (!replies.length) return null;
  return (
    <div className="st-tablewrap">
      <table>
        <thead><tr><th>Name</th><th>Answer</th><th>Note</th><th>When</th></tr></thead>
        <tbody>
          {replies.map(r => (
            <tr key={r.id}>
              <td>{r.name}</td>
              <td>{r.attending ? <span className="st-pill yes">Attending · {r.count}</span> : <span className="st-pill no">Declined</span>}</td>
              <td>{r.note && <div className="note">“{r.note}”</div>}</td>
              <td style={{ whiteSpace: "nowrap" }}>{formatStamp(r.updatedAt, tz)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Stats({ s }: { s: { households: number; seatsInvited: number; opened: number; replied: number; attendingPeople: number; declined: number; waiting: number } }) {
  return (
    <div className="st-stats">
      <div className="st-stat hi"><b>{s.attendingPeople}</b><span>People attending</span></div>
      <div className="st-stat"><b>{s.seatsInvited}</b><span>Seats invited</span></div>
      <div className="st-stat"><b>{s.replied}<small style={{ fontSize: 16 }}> / {s.households}</small></b><span>Invitations replied</span></div>
      <div className="st-stat"><b>{s.opened}</b><span>Opened</span></div>
      <div className="st-stat"><b>{s.declined}</b><span>Declined</span></div>
      <div className="st-stat"><b>{s.waiting}</b><span>Still waiting</span></div>
    </div>
  );
}

export function FilterBar({ current, counts, hrefFor }: { current: Filter; counts: Record<Filter, number>; hrefFor: (f: Filter) => string }) {
  const items: [Filter, string][] = [["all", "All"], ["attending", "Attending"], ["declined", "Declined"], ["waiting", "Waiting"], ["unopened", "Not opened"]];
  return (
    <nav className="st-filter" aria-label="Filter guests">
      {items.map(([f, label]) => <a key={f} href={hrefFor(f)} aria-current={current === f}>{label} · {counts[f]}</a>)}
    </nav>
  );
}
