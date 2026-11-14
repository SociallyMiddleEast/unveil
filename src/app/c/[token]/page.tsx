import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Cinzel, Cormorant_Garamond } from "next/font/google";
import { getWeddingByCoupleToken, guestRows, STAGES, STAGE_LABEL, type GuestRow } from "@/lib/db";
import { baseUrl, inviteMessage, inviteUrl, reminderMessage, waLink, waNumber } from "@/lib/links";
import { formatDateLong, formatDeadline, formatStamp } from "@/lib/time";
import { CopyButton } from "@/components/CopyButton";
import { filterRows, type Filter } from "@/components/GuestTable";
import { approveAction, removeGuestAction } from "../actions";
import { AddGuestsForm, ChangeRequestForm } from "./CoupleForms";
import "./couple.css";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "500"], variable: "--cp-cinzel" });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500"], style: ["normal", "italic"], variable: "--cp-serif" });

export const metadata: Metadata = { title: "My invitation", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const FILTERS: [Filter, string][] = [["all", "All"], ["attending", "Attending"], ["declined", "Declined"], ["waiting", "Waiting"], ["unopened", "Not opened"]];

function Status({ r }: { r: GuestRow }) {
  if (r.rsvp) return r.rsvp.attending
    ? <span className="cp-pill ok">Attending · {r.rsvp.count}</span>
    : <span className="cp-pill no">Declined</span>;
  if (r.openedAt) return <span className="cp-pill seen">Opened, no reply</span>;
  return <span className="cp-pill wait">Not opened</span>;
}

export default async function CouplePage({ params, searchParams }: {
  params: Promise<{ token: string }>; searchParams: Promise<{ show?: string }>;
}) {
  const { token } = await params;
  const w = await getWeddingByCoupleToken(token);
  if (!w) notFound();
  const sp = await searchParams;
  const show = (FILTERS.some(([f]) => f === sp.show) ? sp.show : "all") as Filter;
  const base = await baseUrl();
  const { rows, summary } = await guestRows(w.id);
  const shown = filterRows(rows, show);
  const publicUrl = inviteUrl(base, w);
  const deadline = formatDeadline(w.rsvpDeadline);
  const stageIdx = STAGES.indexOf(w.stage);
  const ready = w.stage === "approved" || w.stage === "live";

  return (
    <div className={`cp ${cinzel.variable} ${cormorant.variable}`}>
      <header className="cp-bar">
        <div className="cp-wrap cp-bar-in">
          <span className="cp-logo">UNVEIL</span>
          <span className="cp-tag">MY INVITATION</span>
          <a className="cp-btn cp-btn-line cp-sm" href={publicUrl} target="_blank" rel="noopener noreferrer">View invitation</a>
        </div>
      </header>

      <main className="cp-wrap cp-main">
        <section className="cp-hero">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/seal-u.png" alt="" width={600} height={608} className="cp-seal" />
          <h1>{w.partner1} &amp; {w.partner2}</h1>
          <p>{formatDateLong(w.startsAt, w.timeZone)} · {w.venueName}{deadline ? ` · replies due ${deadline}` : ""}</p>
        </section>

        <section className="cp-card" aria-labelledby="h-progress">
          <h2 id="h-progress">Your invitation’s progress</h2>
          <ol className="cp-steps">
            {STAGES.map((st, i) => (
              <li key={st} className={i < stageIdx ? "done" : i === stageIdx ? "now" : ""} aria-current={i === stageIdx ? "step" : undefined}>
                <span className="dot">{i < stageIdx ? "✓" : i + 1}</span>
                <span className="lbl">{STAGE_LABEL[st]}</span>
              </li>
            ))}
          </ol>

          {w.stage === "preview" && (
            <div className="cp-approve">
              <h3>Your preview is ready</h3>
              <p>Open your invitation and check every detail. When you’re happy, approve it and your guest links are ready to send.</p>
              <div className="cp-row">
                <a className="cp-btn cp-btn-line" href={publicUrl} target="_blank" rel="noopener noreferrer">Open my preview</a>
                <form action={approveAction}>
                  <input type="hidden" name="token" value={token} />
                  <button className="cp-btn cp-btn-foil" type="submit">Approve my invitation</button>
                </form>
              </div>
              <ChangeRequestForm token={token} />
            </div>
          )}
          {(w.stage === "details" || w.stage === "designing") && (
            <p className="cp-note">
              {w.changeRequest
                ? <>Your designer is working on your changes{w.changeRequestAt ? ` (sent ${formatStamp(w.changeRequestAt, w.timeZone)})` : ""}. You’ll be able to approve the new preview here.</>
                : <>Your designer is preparing your invitation. You’ll be able to approve your preview here.</>}
            </p>
          )}
          {ready && (
            <p className="cp-note ok">
              {w.approvedAt ? `You approved your invitation on ${formatStamp(w.approvedAt, w.timeZone)}. ` : ""}Your guest links are ready to send.
            </p>
          )}
        </section>

        <section className="cp-stats" aria-label="Replies at a glance">
          <div className="hi"><b>{summary.attendingPeople}</b><span>People attending</span></div>
          <div><b>{summary.replied}<small> / {summary.households}</small></b><span>Invitations replied</span></div>
          <div><b>{summary.opened}</b><span>Opened</span></div>
          <div><b>{summary.declined}</b><span>Declined</span></div>
          <div><b>{summary.waiting}</b><span>Still waiting</span></div>
        </section>

        <section className="cp-card" aria-labelledby="h-guests">
          <h2 id="h-guests">Your guests</h2>
          <p className="cp-hint">Each guest gets a personal link that greets them by name and keeps their seats. {ready ? "Send it on WhatsApp in one tap." : "You can add guests now and send the links once you’ve approved your invitation."}</p>
          <AddGuestsForm token={token} />

          <nav className="cp-filter" aria-label="Filter guests">
            {FILTERS.map(([f, label]) => (
              <a key={f} href={`/c/${token}${f === "all" ? "" : `?show=${f}`}#h-guests`} aria-current={show === f}>
                {label} · {filterRows(rows, f).length}
              </a>
            ))}
          </nav>

          {shown.length === 0 ? <p className="cp-hint">No guests here yet.</p> : (
            <div className="cp-tablewrap">
              <table>
                <thead><tr><th>Guest</th><th>Side</th><th>Seats</th><th>Reply</th><th>Note</th><th>Their link</th></tr></thead>
                <tbody>
                  {shown.map(r => {
                    const url = inviteUrl(base, w, r);
                    const msg = r.openedAt || r.rsvp ? reminderMessage(w, r, url) : inviteMessage(w, r, url);
                    return (
                      <tr key={r.id}>
                        <td><b>{r.name}</b>{r.phone && <div className="cp-sub">{r.phone}</div>}</td>
                        <td>{r.side}</td>
                        <td className="num">{r.seats}</td>
                        <td><Status r={r} />{r.rsvp?.meal && <div className="cp-sub">Meal: {r.rsvp.meal}</div>}{r.rsvp && <div className="cp-sub">{formatStamp(r.rsvp.updatedAt, w.timeZone)}</div>}</td>
                        <td>{r.rsvp?.note && <div className="cp-quote">“{r.rsvp.note}”</div>}</td>
                        <td>
                          <div className="cp-actions">
                            {ready && !r.rsvp && (waNumber(r.phone)
                              ? <a className="cp-btn cp-btn-foil cp-sm" target="_blank" rel="noopener noreferrer" href={waLink(r.phone, msg)}>{r.openedAt ? "Remind" : "WhatsApp"}</a>
                              : <CopyButton text={msg} label="Copy message" />)}
                            <CopyButton text={url} label="Copy link" />
                            <form action={removeGuestAction}>
                              <input type="hidden" name="token" value={token} />
                              <input type="hidden" name="guestId" value={r.id} />
                              <button className="cp-btn cp-btn-ghost cp-sm" type="submit" aria-label={`Remove ${r.name}`}>Remove</button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {summary.openLinkReplies.length > 0 && (
            <>
              <h3 className="cp-h3">Replies through your shared link</h3>
              <div className="cp-tablewrap">
                <table>
                  <thead><tr><th>Name</th><th>Reply</th><th>Note</th><th>When</th></tr></thead>
                  <tbody>
                    {summary.openLinkReplies.map(r => (
                      <tr key={r.id}>
                        <td>{r.name}</td>
                        <td>{r.attending ? <span className="cp-pill ok">Attending · {r.count}</span> : <span className="cp-pill no">Declined</span>}</td>
                        <td>{r.note && <div className="cp-quote">“{r.note}”</div>}</td>
                        <td>{formatStamp(r.updatedAt, w.timeZone)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <div className="cp-row" style={{ marginTop: 18 }}>
            <a className="cp-btn cp-btn-line" href={`/c/${token}/guests.csv`}>Download for the venue</a>
            <CopyButton text={publicUrl} label="Copy shared link for groups" />
          </div>
        </section>

        <p className="cp-private">Keep this page private: anyone with its link can see your guest list.</p>
      </main>
    </div>
  );
}
