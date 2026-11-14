"use client";

import { useEffect, useRef, useState } from "react";
import { Mark } from "@/components/Mark";
import type { ScheduleItem, Reveal } from "@/lib/db";
import { markOpened } from "@/app/i/actions";
import { RevealCover } from "./Reveal";
import { RsvpForm } from "./RsvpForm";
import { MusicButton } from "./Music";
import { goldDust } from "./dust";
import "./invitation.css";

export type InvitationProps = {
  slug: string;
  code: string;
  partner1: string;
  partner2: string;
  startsAt: string;
  dateDots: string;
  dateLong: string;
  time: string;
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
  deadline: string;
  reveal: Reveal;
  guest: { name: string; seats: number } | null;
  existing: { attending: boolean; count: number; note: string } | null;
  demo?: boolean;
};

function useCountdown(target: string) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const t = Date.parse(target);
    const tick = () => setLeft(Math.max(0, Math.floor((t - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  if (left === null) return ["–", "–", "–", "–"];
  return [String(Math.floor(left / 86400)), String(Math.floor((left % 86400) / 3600)).padStart(2, "0"),
    String(Math.floor((left % 3600) / 60)).padStart(2, "0"), String(left % 60).padStart(2, "0")];
}

function calendarUrl(p: InvitationProps) {
  const fmt = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const start = Date.parse(p.startsAt);
  const end = start + 8 * 3600 * 1000;
  return "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + encodeURIComponent(`${p.partner1} & ${p.partner2}'s Wedding`) +
    "&dates=" + fmt(start) + "/" + fmt(end) + "&location=" + encodeURIComponent(`${p.venueName}, ${p.venueAddress}`);
}

export function Invitation(p: InvitationProps) {
  const [open, setOpen] = useState(false);
  const opened = useRef(false);
  const [d, h, m, s] = useCountdown(p.startsAt);
  const couple = `${p.partner1} & ${p.partner2}`;

  useEffect(() => {
    document.documentElement.classList.toggle("inv-locked", !open);
    return () => document.documentElement.classList.remove("inv-locked");
  }, [open]);

  function onRevealed() {
    setOpen(true);
    goldDust();
    if (!opened.current && p.code) {
      opened.current = true;
      markOpened(p.slug, p.code).catch(() => {});
    }
  }

  return (
    <div className="inv">
      <main className="inv-col">
        <header className="inv-hero">
          <div className="inv-dear">{p.guest ? `Dear ${p.guest.name},` : ""}</div>
          <div className="inv-fam">Together with their families</div>
          <h1 className="inv-names">{p.partner1}<span className="amp">&amp;</span>{p.partner2}</h1>
          <p className="inv-req">{p.intro}</p>
          <div className="inv-date">{p.dateDots}</div>
          <div className="inv-place">{p.city}</div>
          <div className="inv-cue">Scroll</div>
        </header>

        <section className="inv-blk" aria-labelledby="h-count">
          <div className="inv-kicker">Until we say I do</div>
          <h2 id="h-count">The countdown has begun</h2>
          <div className="inv-count">
            <div><b>{d}</b><small>Days</small></div>
            <div><b>{h}</b><small>Hours</small></div>
            <div><b>{m}</b><small>Min</small></div>
            <div><b>{s}</b><small>Sec</small></div>
          </div>
          <div className="inv-btns"><a className="btn" href={calendarUrl(p)} target="_blank" rel="noopener noreferrer">Add to calendar</a></div>
        </section>

        {p.story && (
          <section className="inv-blk" aria-labelledby="h-story">
            <div className="inv-kicker">Our story</div>
            <h2 id="h-story">{p.storyTitle || "Our story"}</h2>
            <p>{p.story}</p>
          </section>
        )}

        {p.schedule.length > 0 && (
          <section className="inv-blk" aria-labelledby="h-day">
            <div className="inv-kicker">{p.dateLong}</div>
            <h2 id="h-day">The day</h2>
            <ol className="inv-timeline">
              {p.schedule.map((it, i) => (
                <li key={i}><time>{it.time}</time><div><b>{it.title}</b>{it.detail && <span>{it.detail}</span>}</div></li>
              ))}
            </ol>
          </section>
        )}

        <section className="inv-blk" aria-labelledby="h-venue">
          <div className="inv-kicker">The venue</div>
          <h2 id="h-venue">Where we’ll celebrate</h2>
          <div className="inv-venue">
            <Mark className="inv-venue-mark" />
            <div className="vn">{p.venueName}</div>
            <div className="va">{p.venueAddress}</div>
            <div className="inv-btns">
              <a className="btn btn-gold" target="_blank" rel="noopener noreferrer"
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.mapsQuery)}`}>Open in Maps</a>
            </div>
          </div>
        </section>

        {p.dressText && (
          <section className="inv-blk" aria-labelledby="h-dress">
            <div className="inv-kicker">Dress code</div>
            <h2 id="h-dress">{p.dressTitle || "Dress code"}</h2>
            <p>{p.dressText}</p>
          </section>
        )}

        {p.giftsText && (
          <section className="inv-blk" aria-labelledby="h-gift">
            <div className="inv-kicker">Gifts</div>
            <h2 id="h-gift">Your presence is our gift</h2>
            <p>{p.giftsText}</p>
          </section>
        )}

        <section className="inv-blk" id="rsvp" aria-labelledby="h-rsvp">
          <div className="inv-kicker">{p.deadline ? `Kindly reply by ${p.deadline}` : "Kindly reply"}</div>
          <h2 id="h-rsvp">Will you join us?</h2>
          <RsvpForm slug={p.slug} code={p.code} guest={p.guest} existing={p.existing} couple={couple} onAccepted={goldDust} demo={p.demo} />
        </section>

        <footer className="inv-made">
          <Mark className="inv-made-mark" />
          <div className="w">Unveil<span>.</span></div>
          <small>Invitations · Made in Lebanon</small>
          {p.demo && <a className="btn btn-gold" href="/#packages" style={{ marginTop: 14 }}>See packages</a>}
        </footer>
      </main>

      <MusicButton />
      <canvas id="inv-dust" aria-hidden="true" />
      {!open && <RevealCover kind={p.reveal} couple={couple} guestName={p.guest?.name ?? ""} onDone={onRevealed} />}
    </div>
  );
}
