import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStudio } from "@/lib/auth";
import { getWeddingById, guestRows, STAGES, STAGE_LABEL } from "@/lib/db";
import { baseUrl, inviteUrl } from "@/lib/links";
import { formatDateLong, formatStamp, utcIsoToLocalInput } from "@/lib/time";
import { StudioBar } from "@/components/StudioBar";
import { CopyButton } from "@/components/CopyButton";
import { FilterBar, GuestTable, OpenLinkReplies, Stats, filterRows, type Filter } from "@/components/GuestTable";
import { WeddingForm } from "../WeddingForm";
import { GuestImport } from "../GuestImport";
import { changeStage, removeGuest, removeWedding } from "../actions";
import "../studio.css";

export const metadata: Metadata = { title: "Wedding", robots: { index: false } };
export const dynamic = "force-dynamic";

const FILTERS: Filter[] = ["all", "attending", "declined", "waiting", "unopened"];

export default async function WeddingStudio({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ show?: string }>;
}) {
  await requireStudio();
  const { id } = await params;
  const w = await getWeddingById(id);
  if (!w) notFound();
  const show = (FILTERS.includes((await searchParams).show as Filter) ? (await searchParams).show : "all") as Filter;
  const base = await baseUrl();
  const { rows, summary } = await guestRows(w.id);
  const counts = Object.fromEntries(FILTERS.map(f => [f, filterRows(rows, f).length])) as Record<Filter, number>;
  const publicUrl = inviteUrl(base, w);
  const coupleUrl = `${base}/c/${w.coupleToken}`;

  return (
    <div className="st">
      <StudioBar tag="Studio"><Link className="btn btn-sm" href="/studio">All weddings</Link></StudioBar>
      <main className="st-main">
        <div>
          <h1>{w.partner1} &amp; {w.partner2}</h1>
          <p className="st-sub">{formatDateLong(w.startsAt, w.timeZone)} · {w.venueName} · {w.reveal === "seal" ? "The Seal" : "The Veil"}</p>
        </div>

        <Stats s={summary} />

        <section className="st-card" style={{ display: "grid", gap: 12 }}>
          <h2>Order progress</h2>
          <p className="hint" style={{ margin: 0 }}>The couple sees this on their private page. Set it to “Preview ready” when you want them to approve.</p>
          <form action={changeStage} className="row">
            <input type="hidden" name="weddingId" value={w.id} />
            <select key={w.stage} name="stage" defaultValue={w.stage} aria-label="Order stage" style={{ maxWidth: 260 }}>
              {STAGES.map(st => <option key={st} value={st}>{STAGE_LABEL[st]}</option>)}
            </select>
            <button className="btn btn-sm btn-wine" type="submit">Update</button>
          </form>
          {w.approvedAt && <p className="msg-ok" style={{ margin: 0 }}>Approved by the couple on {formatStamp(w.approvedAt, w.timeZone)}.</p>}
          {w.changeRequest && (
            <div style={{ background: "#fff", border: "1px solid var(--line-ink)", borderRadius: 6, padding: "12px 14px" }}>
              <span className="st-label">Changes requested {w.changeRequestAt ? `· ${formatStamp(w.changeRequestAt, w.timeZone)}` : ""}</span>
              <p style={{ margin: "6px 0 0", whiteSpace: "pre-wrap" }}>{w.changeRequest}</p>
            </div>
          )}
        </section>

        <section className="st-card">
          <h2>Links</h2>
          <p className="hint">Each guest gets a personal link from the table below. The open link is for sharing in a group; replies to it show at the bottom.</p>
          <div className="st-links">
            <div className="st-link"><span className="st-label">Open invitation</span><code>{publicUrl}</code><span className="row"><CopyButton text={publicUrl} /><a className="btn btn-sm" href={publicUrl} target="_blank" rel="noopener noreferrer">Preview</a></span></div>
            <div className="st-link"><span className="st-label">Couple’s dashboard</span><code>{coupleUrl}</code><span className="row"><CopyButton text={coupleUrl} /><a className="btn btn-sm" href={coupleUrl} target="_blank" rel="noopener noreferrer">Open</a></span></div>
          </div>
          <p className="hint" style={{ marginTop: 12, marginBottom: 0 }}>Send the couple’s dashboard link only to the couple: anyone with it can see the guest list.</p>
        </section>

        <section className="st-card" style={{ display: "grid", gap: 14 }}>
          <h2>Guests</h2>
          <GuestImport weddingId={w.id} />
          <FilterBar current={show} counts={counts} hrefFor={f => `/studio/${w.id}${f === "all" ? "" : `?show=${f}`}#guests`} />
          <div id="guests"><GuestTable wedding={w} rows={filterRows(rows, show)} base={base} mode="studio" removeAction={removeGuest} /></div>
          {summary.openLinkReplies.length > 0 && <><span className="st-label">Replies through the open link</span><OpenLinkReplies replies={summary.openLinkReplies} tz={w.timeZone} /></>}
          <div className="row"><a className="btn btn-sm" href={`/c/${w.coupleToken}/guests.csv`}>Download guest list (CSV)</a></div>
        </section>

        <section className="st-card">
          <h2>Invitation details</h2>
          <p className="hint">Changes show on the invitation straight away.</p>
          <WeddingForm values={{
            id: w.id, partner1: w.partner1, partner2: w.partner2, startsLocal: utcIsoToLocalInput(w.startsAt, w.timeZone),
            city: w.city, venueName: w.venueName, venueAddress: w.venueAddress, mapsQuery: w.mapsQuery, intro: w.intro,
            storyTitle: w.storyTitle, story: w.story, schedule: w.schedule.map(s => `${s.time} | ${s.title} | ${s.detail}`).join("\n"),
            dressTitle: w.dressTitle, dressText: w.dressText, giftsText: w.giftsText, rsvpDeadline: w.rsvpDeadline, reveal: w.reveal,
          }} />
        </section>

        <section className="st-card">
          <h2>Delete this wedding</h2>
          <p className="hint">This removes the invitation, every guest and every reply. It can’t be undone. Type delete to confirm.</p>
          <form action={removeWedding} className="row">
            <input type="hidden" name="id" value={w.id} />
            <input type="text" name="confirm" aria-label="Type delete to confirm" placeholder="delete" style={{ maxWidth: 160 }} />
            <button className="btn btn-sm st-danger" type="submit">Delete wedding</button>
          </form>
        </section>
      </main>
    </div>
  );
}
