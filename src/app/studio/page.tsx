import type { Metadata } from "next";
import Link from "next/link";
import { requireStudio } from "@/lib/auth";
import { guestRows, listWeddings } from "@/lib/db";
import { formatDateLong } from "@/lib/time";
import { StudioBar } from "@/components/StudioBar";
import { createSampleWedding, logout } from "./actions";
import "./studio.css";

export const metadata: Metadata = { title: "Studio", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function StudioHome() {
  await requireStudio();
  const weddings = listWeddings();
  return (
    <div className="st">
      <StudioBar tag="Studio">
        <form action={logout}><button className="btn btn-sm" type="submit">Sign out</button></form>
      </StudioBar>
      <main className="st-main">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <h1>Weddings</h1>
            <p className="st-sub">{weddings.length ? `${weddings.length} ${weddings.length === 1 ? "invitation" : "invitations"} in the studio.` : "No weddings yet. Create the first one."}</p>
          </div>
          <div className="row">
            <form action={createSampleWedding}><button className="btn" type="submit">Create sample wedding</button></form>
            <Link className="btn btn-wine" href="/studio/new">New wedding</Link>
          </div>
        </div>
        {weddings.length > 0 && (
          <div className="st-list">
            {weddings.map(w => {
              const { summary } = guestRows(w.id);
              return (
                <Link key={w.id} href={`/studio/${w.id}`} className="st-card st-wed">
                  <span className="n">{w.partner1} &amp; {w.partner2}</span>
                  <span className="d">{formatDateLong(w.startsAt, w.timeZone)} · {w.city || w.venueName}</span>
                  <span className="d">{summary.households} guests invited · {summary.replied} replied · {summary.attendingPeople} attending</span>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
