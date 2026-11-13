"use client";

import { useRef, useState } from "react";
import { Mark } from "@/components/Mark";
import type { Reveal } from "@/lib/db";

type Props = { kind: Reveal; couple: string; guestName: string; onDone: () => void };

export function RevealCover(props: Props) {
  return props.kind === "seal" ? <SealCover {...props} /> : <VeilCover {...props} />;
}

/* The Veil: swipe up (or tap) to lift a sheer veil. */
function VeilCover({ couple, guestName, onDone }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const start = useRef<number | null>(null);
  const dy = useRef(0);
  const [lifting, setLifting] = useState(false);

  function setY(y: number) {
    const v = el.current;
    if (!v) return;
    const p = Math.min(1, Math.abs(Math.min(0, y)) / window.innerHeight);
    v.style.transform = `translateY(${y}px) scaleY(${1 + p * 0.06})`;
    const blur = `blur(${9 * (1 - p)}px)`;
    v.style.backdropFilter = blur;
    v.style.setProperty("-webkit-backdrop-filter", blur);
  }
  function lift() {
    if (lifting) return;
    setLifting(true);
    el.current?.classList.remove("settle");
    setTimeout(onDone, 1250);
  }
  function end() {
    if (start.current === null) return;
    start.current = null;
    if (Math.abs(dy.current) < 6 || dy.current < -window.innerHeight * 0.18) lift();
    else { el.current?.classList.add("settle"); setY(0); }
  }

  return (
    <div ref={el} className={`inv-veil${lifting ? " lifting" : ""}`} role="button" tabIndex={0}
      aria-label="Lift the veil to open your invitation"
      onPointerDown={(e) => { if (lifting) return; start.current = e.clientY; dy.current = 0; el.current?.classList.remove("settle"); e.currentTarget.setPointerCapture(e.pointerId); }}
      onPointerMove={(e) => { if (start.current === null) return; dy.current = Math.min(40, e.clientY - start.current); setY(dy.current < 0 ? dy.current : dy.current * 0.3); }}
      onPointerUp={end} onPointerCancel={end}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " " || e.key === "ArrowUp") { e.preventDefault(); lift(); } }}>
      <Mark className="inv-cover-mark" />
      <div className="who">{guestName ? `${guestName}, ${couple} have something for you` : `${couple} have something for you`}</div>
      <div className="sub">Something beautiful is waiting</div>
      <div className="cta">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 14l6-6 6 6" /></svg>
        Swipe up to lift the veil
      </div>
    </div>
  );
}

/* The Seal: tap the wax seal, the envelope opens and slides away. */
function SealCover({ couple, guestName, onDone }: Props) {
  const [broken, setBroken] = useState(false);
  const initials = couple.split("&").map(s => s.trim().charAt(0)).join("·");
  function crack() {
    if (broken) return;
    setBroken(true);
    setTimeout(onDone, 1900);
  }
  return (
    <button type="button" className={`inv-seal${broken ? " broken" : ""}`} onClick={crack} aria-label="Break the wax seal to open your invitation">
      <span className="env" />
      <span className="flap" />
      <span className="who">{guestName ? `For ${guestName}` : `From ${couple}`}</span>
      <span className="wax"><i className="s1">{initials}</i><i className="s2">{initials}</i></span>
      <span className="cta">Tap the seal to open</span>
    </button>
  );
}
