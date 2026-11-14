"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { Note, ScheduleItem } from "@/lib/db";
import { markOpened, submitRsvp, type RsvpState } from "@/app/i/actions";
import "./velvet.css";

/* Unveil · Template I · The Velvet Court. Every detail comes from the couple's wedding in the studio. */

export type VelvetProps = {
  slug: string; code: string;
  p1: string; p2: string;
  startsAt: string; timeZone: string;
  city: string; venueName: string; venueAddress: string; mapsQuery: string;
  intro: string; letter: string[];
  schedule: ScheduleItem[];
  dressTitle: string; dressText: string; dressHer: string; dressHim: string; palette: string[];
  notes: Note[]; meals: string[]; deadline: string; venueNote: string;
  guest: { name: string; seats: number } | null;
  existing: { attending: boolean; count: number; note: string; meal: string } | null;
};

const fmt = (iso: string, tz: string, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { timeZone: tz, ...o }).format(new Date(iso));
function roman(n: number) {
  let r = ""; for (const [v, s] of [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]] as [number, string][]) while (n >= v) { r += s; n -= v; }
  return r;
}

function goldDust() {
  if (typeof window === "undefined" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const c = document.getElementById("vc-dust") as HTMLCanvasElement | null, x = c?.getContext("2d");
  if (!c || !x) return;
  const W = innerWidth, H = innerHeight, r = Math.min(2, devicePixelRatio || 1);
  c.width = W * r; c.height = H * r; x.setTransform(r, 0, 0, r, 0, 0);
  const P = Array.from({ length: 150 }, () => ({ x: Math.random() * W, y: -Math.random() * H * .7, s: .7 + Math.random() * 1.9, v: .6 + Math.random() * 1.4, w: Math.random() * 6.3, a: .5 + Math.random() * .5 }));
  const t0 = performance.now();
  const fr = (t: number) => {
    const age = (t - t0) / 1000, f = age < 3.4 ? 1 : Math.max(0, 1 - (age - 3.4) / 1.2);
    x.clearRect(0, 0, W, H);
    for (const q of P) { q.y += q.v; q.w += .03; q.x += Math.sin(q.w) * .5; x.globalAlpha = q.a * f * (.6 + .4 * Math.sin(q.w * 3)); x.fillStyle = "#e9cf8a"; x.beginPath(); x.arc(q.x, q.y, q.s, 0, 6.283); x.fill(); }
    if (f > 0) requestAnimationFrame(fr); else x.clearRect(0, 0, W, H);
  };
  requestAnimationFrame(fr);
}

function Envelope({ to, onOpen }: { to: string; onOpen: () => void }) {
  const env = useRef<HTMLDivElement>(null);
  const st = useRef({ p: 0, holding: false, last: 0, opened: false });
  const [opened, setOpened] = useState(false);
  const [gone, setGone] = useState(false);

  function paint() { env.current?.style.setProperty("--p", st.current.p.toFixed(3)); }
  function open() {
    const s = st.current; if (s.opened) return; s.opened = true; s.p = 1; paint();
    try { navigator.vibrate?.([20, 40, 30]); } catch { /* not supported */ }
    setOpened(true); onOpen();
    setTimeout(() => setGone(true), 2200);
  }
  function loop(t: number) {
    const s = st.current, dt = s.last ? Math.min(50, t - s.last) : 16; s.last = t;
    if (!s.opened) { s.p = Math.max(0, Math.min(1, s.p + (s.holding ? dt / 1300 : -dt / 700))); paint(); if (s.p >= 1) open(); }
    if (!s.opened && (s.holding || s.p > 0)) requestAnimationFrame(loop); else s.last = 0;
  }
  useEffect(() => {
    const up = () => { st.current.holding = false; };
    addEventListener("pointerup", up); addEventListener("pointercancel", up);
    return () => { removeEventListener("pointerup", up); removeEventListener("pointercancel", up); };
  }, []);

  if (gone) return null;
  return (
    <div ref={env} className={`vc-env${opened ? " opened" : ""}`} role="dialog" aria-label="Your invitation">
      <div className="vc-env__back" /><div className="vc-env__flap" />
      <div className="vc-env__to"><small>AN INVITATION FOR</small><b className="vc-foil">{to}</b></div>
      <svg className="vc-ring" viewBox="0 0 36 36" aria-hidden="true"><circle className="track" cx="18" cy="18" r="15.9" pathLength={100} /><circle cx="18" cy="18" r="15.9" pathLength={100} /></svg>
      <button className="vc-seal" type="button" aria-label="Press and hold the seal to open your invitation"
        onPointerDown={e => { e.preventDefault(); st.current.holding = true; st.current.last = 0; requestAnimationFrame(loop); }}
        onContextMenu={e => e.preventDefault()}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="l" src="/seal-u.png" alt="" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="r" src="/seal-u.png" alt="" />
      </button>
      <div className="vc-env__hint"><b>Press &amp; hold the seal</b><small>to open your invitation</small></div>
    </div>
  );
}

function Countdown({ target }: { target: string }) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const t = Date.parse(target), tick = () => setLeft(Math.max(0, Math.floor((t - Date.now()) / 1000)));
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, [target]);
  const v = left === null ? ["–", "–", "–", "–"] : [String(Math.floor(left / 86400)), String(Math.floor(left % 86400 / 3600)).padStart(2, "0"), String(Math.floor(left % 3600 / 60)).padStart(2, "0"), String(left % 60).padStart(2, "0")];
  return (
    <div className="vc-count">
      {["Days", "Hours", "Minutes", "Seconds"].map((l, i) => <div key={l}><b className="vc-foil">{v[i]}</b><small>{l}</small></div>)}
    </div>
  );
}

function Rsvp(p: VelvetProps & { longDate: string }) {
  const [state, action, pending] = useActionState<RsvpState, FormData>(submitRsvp, { status: "idle" });
  const [editing, setEditing] = useState(!p.existing);
  const [come, setCome] = useState<"" | "yes" | "no">(p.existing ? (p.existing.attending ? "yes" : "no") : "");
  const max = p.guest?.seats ?? 10;
  const [seats, setSeats] = useState(p.existing?.attending ? Math.max(1, p.existing.count) : Math.min(max, p.guest?.seats ?? 1));
  useEffect(() => { if (state.status === "saved") { setEditing(false); if (state.attending) goldDust(); } }, [state]);
  const saved = state.status === "saved" ? state : p.existing ? { attending: p.existing.attending, count: p.existing.count, name: p.guest?.name ?? "" } : null;

  if (!editing && saved) {
    return (
      <div className="vc-seat" role="status" tabIndex={-1}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/seal-u.png" alt="" width={600} height={608} />
        <p className="k">{saved.attending ? "YOUR SEAT IS SAVED" : "THANK YOU FOR LETTING US KNOW"}</p>
        <p className="who vc-foil">{saved.name || p.guest?.name}</p>
        <p className="meta">{saved.attending
          ? `${saved.count} ${saved.count === 1 ? "seat" : "seats"} · ${p.longDate} · ${p.venueName}`
          : `You will be missed. ${p.p1} & ${p.p2} send their love.`}</p>
        <button className="vc-linkish" type="button" onClick={() => setEditing(true)}>Change my reply</button>
      </div>
    );
  }
  return (
    <form className="vc-form" action={action} data-come={come}>
      <input type="hidden" name="slug" value={p.slug} />
      <input type="hidden" name="code" value={p.code} />
      <input type="hidden" name="count" value={seats} />
      {p.guest
        ? <p className="vc-for">This invitation is for <b>{p.guest.name}</b>{p.guest.seats > 1 ? `, up to ${p.guest.seats} seats` : ""}.</p>
        : <div className="vc-fld"><label htmlFor="vc-name">YOUR NAME</label><input className="vc-inp" id="vc-name" name="name" autoComplete="name" required /></div>}
      <div className="vc-fld"><span className="vc-lbl" id="vc-cl">YOUR ANSWER</span>
        <div className="vc-choices" role="radiogroup" aria-labelledby="vc-cl">
          <label><input type="radio" name="attending" value="yes" checked={come === "yes"} onChange={() => setCome("yes")} />Joyfully accepts</label>
          <label><input type="radio" name="attending" value="no" checked={come === "no"} onChange={() => setCome("no")} />Regretfully declines</label>
        </div>
      </div>
      {come === "yes" && max > 1 && (
        <div className="vc-fld"><span className="vc-lbl" id="vc-sl">SEATS</span>
          <div className="vc-stepper" role="group" aria-labelledby="vc-sl">
            <button type="button" aria-label="Fewer seats" onClick={() => setSeats(s => Math.max(1, s - 1))}>−</button>
            <output aria-live="polite">{seats}</output>
            <button type="button" aria-label="More seats" onClick={() => setSeats(s => Math.min(max, s + 1))}>+</button>
          </div>
        </div>
      )}
      {come === "yes" && p.meals.length > 0 && (
        <div className="vc-fld"><span className="vc-lbl" id="vc-ml">YOUR MAIN COURSE</span>
          <div className="vc-choices" role="radiogroup" aria-labelledby="vc-ml">
            {p.meals.map(m => <label key={m}><input type="radio" name="meal" value={m} defaultChecked={p.existing?.meal === m} />{m}</label>)}
          </div>
        </div>
      )}
      <div className="vc-fld"><label htmlFor="vc-note">A NOTE FOR THE COUPLE</label><textarea className="vc-inp" id="vc-note" name="note" defaultValue={p.existing?.note ?? ""} placeholder="Mabrouk…" /></div>
      <p className="vc-err" role="alert">{state.status === "error" ? state.message : ""}</p>
      <button className="vc-btn vc-btn-foil" type="submit" disabled={pending}>{pending ? "SENDING…" : "SEND MY REPLY"}</button>
    </form>
  );
}

export function VelvetCourt(p: VelvetProps) {
  const [revealed, setRevealed] = useState(false);
  const opened = useRef(false);
  const dayRef = useRef<HTMLOListElement>(null);
  const [dayP, setDayP] = useState(0);
  const [lit, setLit] = useState(0);
  const [dock, setDock] = useState(false);
  const rsvpRef = useRef<HTMLElement>(null);
  const couple = `${p.p1} & ${p.p2}`;
  const longDate = fmt(p.startsAt, p.timeZone, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const dots = `${fmt(p.startsAt, p.timeZone, { day: "2-digit" })} · ${fmt(p.startsAt, p.timeZone, { month: "2-digit" })} · ${fmt(p.startsAt, p.timeZone, { year: "numeric" })}`;
  const romanDate = `${fmt(p.startsAt, p.timeZone, { day: "2-digit" })} · ${roman(+fmt(p.startsAt, p.timeZone, { month: "numeric" }))} · ${roman(+fmt(p.startsAt, p.timeZone, { year: "numeric" }))}`;
  const start = Date.parse(p.startsAt);
  const g = (t: number) => new Date(t).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const cal = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`${couple}'s wedding`)}&dates=${g(start)}/${g(start + 8 * 3600e3)}&location=${encodeURIComponent(`${p.venueName}, ${p.venueAddress}`)}`;
  const dir = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(p.mapsQuery)}`;
  const letter = p.letter.length ? p.letter.map((l, i) => (i === 0 && p.guest && /^dear\b/i.test(l) ? `Dear ${p.guest.name},` : l)) : [];

  useEffect(() => {
    document.documentElement.classList.toggle("vc-locked", !revealed);
    return () => document.documentElement.classList.remove("vc-locked");
  }, [revealed]);

  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const els = document.querySelectorAll<HTMLElement>(".vc .rv");
    if (reduce || !("IntersectionObserver" in window)) { els.forEach(el => el.classList.add("in")); return; }
    const io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); } }), { rootMargin: "0px 0px -10% 0px" });
    els.forEach((el, i) => { el.style.transitionDelay = `${(i % 6) * .08}s`; io.observe(el); });
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    let rsvpVisible = false;
    const io = "IntersectionObserver" in window ? new IntersectionObserver(es => { rsvpVisible = es[0].isIntersecting; onScroll(); }) : null;
    if (rsvpRef.current && io) io.observe(rsvpRef.current);
    function onScroll() {
      const d = dayRef.current;
      if (d) {
        const r = d.getBoundingClientRect(), mid = innerHeight * .62;
        setDayP(Math.max(0, Math.min(1, (mid - r.top) / Math.max(1, r.height))));
        setLit([...d.querySelectorAll("li")].filter(li => li.getBoundingClientRect().top + 20 < mid).length);
      }
      setDock(scrollY > innerHeight * .9 && !rsvpVisible);
    }
    const h = () => requestAnimationFrame(onScroll);
    addEventListener("scroll", h, { passive: true }); onScroll();
    return () => { removeEventListener("scroll", h); io?.disconnect(); };
  }, []);

  function onOpen() {
    setTimeout(() => { setRevealed(true); goldDust(); }, 1300);
    if (!opened.current && p.code) { opened.current = true; markOpened(p.slug, p.code).catch(() => {}); }
  }

  return (
    <div className={`vc${revealed ? " revealed" : ""}`}>
      <Envelope to={p.guest?.name ?? "You & your family"} onOpen={onOpen} />
      <canvas id="vc-dust" aria-hidden="true" />

      <header className="vc-hero">
        <div className="vc-frame">
          <p className="fam">{p.guest ? `Dear ${p.guest.name}, together with their families` : "Together with their families"}</p>
          <h1 className="vc-names vc-foil">{p.p1}<i>&amp;</i>{p.p2}</h1>
          <p className="date">{dots}</p>
          <p className="place">{p.city}</p>
        </div>
        <div className="vc-cue">SCROLL</div>
      </header>

      <main>
        {letter.length > 0 && (
          <section className="vc-sec deep vc-letter">
            <div className="vc-col">
              <p className="vc-kicker rv">A LETTER</p>
              {letter.map((l, i) => <p key={i} className="rv">{l}</p>)}
              <p className="sig vc-foil rv">{couple}</p>
            </div>
          </section>
        )}

        <section className="vc-sec">
          <div className="vc-col">
            <p className="vc-kicker rv">UNTIL WE SAY I DO</p>
            <h2 className="vc-title vc-foil rv">{longDate}</h2>
            <div className="rv"><Countdown target={p.startsAt} /></div>
            <a className="vc-btn rv" href={cal} target="_blank" rel="noopener noreferrer">ADD TO CALENDAR</a>
          </div>
        </section>

        {p.schedule.length > 0 && (
          <section className="vc-sec deep">
            <div className="vc-col">
              <p className="vc-kicker rv">THE EVENING</p>
              <h2 className="vc-title vc-foil rv">The day</h2>
              <ol className="vc-day" ref={dayRef} style={{ ["--d" as string]: dayP.toFixed(3) }}>
                <span className="fill" aria-hidden="true" />
                {p.schedule.map((s, i) => (
                  <li key={i} className={i < lit ? "on" : ""}><time>{s.time}</time><div><b>{s.title}</b>{s.detail && <span>{s.detail}</span>}</div></li>
                ))}
              </ol>
            </div>
          </section>
        )}

        <section className="vc-sec vc-venue">
          <div className="vc-col">
            <p className="vc-kicker rv">THE VENUE</p>
            <p className="name vc-foil rv">{p.venueName}</p>
            <p className="addr rv">{p.venueAddress}</p>
            <div className="vc-acts rv"><a className="vc-btn vc-btn-foil" href={dir} target="_blank" rel="noopener noreferrer">DIRECTIONS</a><a className="vc-btn" href={cal} target="_blank" rel="noopener noreferrer">CALENDAR</a></div>
            {p.venueNote && <p className="note rv">{p.venueNote}</p>}
          </div>
        </section>

        {(p.dressTitle || p.dressText || p.dressHer || p.dressHim || p.palette.length > 0) && (
          <section className="vc-sec deep">
            <div className="vc-col">
              <p className="vc-kicker rv">DRESS CODE</p>
              <h2 className="vc-title vc-foil rv">{p.dressTitle || "Dress code"}</h2>
              {p.palette.length > 0 && <div className="vc-palette rv" aria-label="Suggested colours">{p.palette.map(c => <i key={c} style={{ background: c }} />)}</div>}
              {(p.dressHer || p.dressHim) && (
                <div className="vc-looks rv">
                  {p.dressHer && <div><b>HER</b><span>{p.dressHer}</span></div>}
                  {p.dressHim && <div><b>HIM</b><span>{p.dressHim}</span></div>}
                </div>
              )}
              {p.dressText && <><div className="vc-fleuron rv"><hr /><i className="vc-foil">❦</i><hr /></div><p className="vc-lead rv">{p.dressText}</p></>}
            </div>
          </section>
        )}

        {p.notes.length > 0 && (
          <section className="vc-sec">
            <div className="vc-col">
              <p className="vc-kicker rv">GOOD TO KNOW</p>
              <h2 className="vc-title vc-foil rv">A few notes</h2>
              <div className="vc-notes rv">{p.notes.map((n, i) => <details key={i}><summary>{n.title}</summary>{n.text && <p>{n.text}</p>}</details>)}</div>
            </div>
          </section>
        )}

        <section className="vc-sec deep" id="rsvp" ref={rsvpRef}>
          <div className="vc-col">
            <p className="vc-kicker">{p.deadline ? `KINDLY REPLY BY ${p.deadline.toUpperCase()}` : "KINDLY REPLY"}</p>
            <h2 className="vc-title vc-foil">Will you join us?</h2>
            <Rsvp {...p} longDate={longDate} />
          </div>
        </section>

        <section className="vc-finale">
          <div className="vc-arch rv">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <div><img src="/seal-u.png" alt="" width={600} height={608} /></div>
          </div>
          <p className="until rv">Until then,</p>
          <p className="n vc-foil rv">{couple}</p>
          <p className="d rv">{romanDate}</p>
        </section>
      </main>
      <small className="vc-made">Made with Unveil</small>
      <div className={`vc-dock${dock && revealed ? " on" : ""}`}><a className="vc-btn vc-btn-foil" href="#rsvp">REPLY TO THE INVITATION</a></div>
    </div>
  );
}
