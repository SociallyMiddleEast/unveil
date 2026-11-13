"use client";

import { useRef, useState } from "react";

/* Soft piano-like arpeggios generated in the browser, so no audio files are needed. */
const CHORDS = [[57, 64, 69, 72], [53, 60, 65, 69], [55, 62, 67, 71], [52, 59, 64, 67]];
const hz = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

type Engine = { ctx: AudioContext; out: GainNode; timer: ReturnType<typeof setInterval> | null; bar: number };

export function MusicButton() {
  const [on, setOn] = useState(false);
  const eng = useRef<Engine | null>(null);

  function playBar(e: Engine) {
    const now = e.ctx.currentTime, chord = CHORDS[e.bar++ % CHORDS.length];
    [0, 1, 2, 3, 2, 1].forEach((k, j) => {
      const o = e.ctx.createOscillator(), g = e.ctx.createGain();
      o.type = "triangle"; o.frequency.value = hz(chord[k] + 12);
      const t = now + j * 0.42;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.05, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0008, t + 1.8);
      o.connect(g); g.connect(e.out); o.start(t); o.stop(t + 1.9);
    });
    const b = e.ctx.createOscillator(), bg = e.ctx.createGain();
    b.type = "sine"; b.frequency.value = hz(chord[0] - 12);
    bg.gain.setValueAtTime(0, now); bg.gain.linearRampToValueAtTime(0.06, now + 0.2); bg.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
    b.connect(bg); bg.connect(e.out); b.start(now); b.stop(now + 2.6);
  }

  function toggle() {
    try {
      if (!eng.current) {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AC();
        const out = ctx.createGain(); out.gain.value = 0.9;
        const delay = ctx.createDelay(); delay.delayTime.value = 0.33;
        const fb = ctx.createGain(); fb.gain.value = 0.35;
        out.connect(ctx.destination); out.connect(delay); delay.connect(fb); fb.connect(delay); delay.connect(ctx.destination);
        eng.current = { ctx, out, timer: null, bar: 0 };
      }
      const e = eng.current;
      if (!on) {
        e.ctx.resume();
        playBar(e);
        e.timer = setInterval(() => playBar(e), 2520);
        setOn(true);
      } else {
        if (e.timer) clearInterval(e.timer);
        e.timer = null;
        e.ctx.suspend();
        setOn(false);
      }
    } catch {
      setOn(false);
    }
  }

  return (
    <button type="button" className="inv-fab" aria-pressed={on} aria-label={on ? "Pause music" : "Play music"} onClick={toggle}>
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9 17.5V6.2l10-2.2v11.3a3 3 0 1 1-1.5-2.6V7.1l-7 1.6v8.8a3 3 0 1 1-1.5-2.6z" /></svg>
    </button>
  );
}
