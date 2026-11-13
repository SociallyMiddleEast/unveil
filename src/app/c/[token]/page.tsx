import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getWeddingByCoupleToken, guestRows } from "@/lib/db";
import { baseUrl, inviteUrl } from "@/lib/links";
import { formatDateLong, formatDeadline } from "@/lib/time";
import { StudioBar } from "@/components/StudioBar";
import { CopyButton } from "@/components/CopyButton";
import { FilterBar, GuestTable, OpenLinkReplies, Stats, filterRows, type Filter } from "@/components/GuestTable";
import "../../studio/studio.css";

export const metadata: Metadata = { title: "Your guest list", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const FILTERS: Filter[] = ["all", "attending", "declined", "waiting", "unopened"];

export default async function CoupleDashboard({ params, searchParams }: {
  params: Promise<{ token: string }>; searchParams: Promise<{ show?: string }>;
}) {
  const { token } = await params;
  const w = getWeddingByCoupleToken(token);
  if (!w) notFound();
  const sp = await searchParams;
  const show = (FILTERS.includes(sp.show as Filter) ? sp.show : "all") as Filter;
  const base = await baseUrl();
  const { rows, summary } = guestRows(w.id);
  const counts = Object.fromEntries(FILTERS.map(f => [f, filterRows(rows, f).length])) as Record<Filter, number>;
  const publicUrl = inviteUrl(base, w);
  const deadline = formatDeadline(w.rsvpDeadline);

  return (
    <div className="st">
      <StudioBar tag="Your guest list">
        <a className="btn btn-sm" href={publicUrl} target="_blank" rel="noopener noreferrer">View invitation</a>
      </StudioBar>
      <main className="st-main">
        <div>
          <h1>{w.partner1} &amp; {w.partner2}</h1>
          <p className="st-sub">{formatDateLong(w.startsAt, w.timeZone)} · {w.venueName}{deadline ? ` · replies due ${deadline}` : ""}</p>
        </div>
        <Stats s={summary} />
        <section className="st-card" style={{ display: "grid", gap: 14 }}>
          <div>
            <h2>Guests</h2>
            <p className="hint" style={{ margin: 0 }}>Replies appear here as soon as guests send them. Use WhatsApp or Remind to send a guest their personal link.</p>
          </div>
          <FilterBar current={show} counts={counts} hrefFor={f => `/c/${token}${f === "all" ? "" : `?show=${f}`}`} />
          <GuestTable wedding={w} rows={filterRows(rows, show)} base={base} mode="couple" />
          {summary.openLinkReplies.length > 0 && <><span className="st-label">Replies through the shared link</span><OpenLinkReplies replies={summary.openLinkReplies} tz={w.timeZone} /></>}
          <div className="row">
            <a className="btn btn-sm" href={`/c/${token}/guests.csv`}>Download for the venue (CSV)</a>
            <CopyButton text={publicUrl} label="Copy shared invitation link" />
          </div>
        </section>
        <p className="hint">Keep this page’s link private: anyone with it can see your guest list.</p>
      </main>
    </div>
  );
}
