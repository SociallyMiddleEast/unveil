/* Falling champagne-gold dust, drawn on the #inv-dust canvas for about four seconds. */
export function goldDust() {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const c = document.getElementById("inv-dust") as HTMLCanvasElement | null;
  const x = c?.getContext("2d");
  if (!c || !x) return;
  const W = window.innerWidth, H = window.innerHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
  c.width = W * dpr; c.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0);
  const P = Array.from({ length: 140 }, () => ({
    x: Math.random() * W, y: -Math.random() * H * 0.6, r: 0.6 + Math.random() * 1.8,
    v: 0.6 + Math.random() * 1.4, w: Math.random() * 6.28, a: 0.5 + Math.random() * 0.5,
  }));
  const t0 = performance.now();
  const frame = (t: number) => {
    const age = (t - t0) / 1000;
    x.clearRect(0, 0, W, H);
    const fade = age < 3.2 ? 1 : Math.max(0, 1 - (age - 3.2) / 1.2);
    for (const p of P) {
      p.y += p.v; p.w += 0.03; p.x += Math.sin(p.w) * 0.5;
      x.globalAlpha = p.a * fade * (0.6 + 0.4 * Math.sin(p.w * 3));
      x.fillStyle = "#e6c88e";
      x.beginPath(); x.arc(p.x, p.y, p.r, 0, 6.283); x.fill();
    }
    if (fade > 0) requestAnimationFrame(frame); else x.clearRect(0, 0, W, H);
  };
  requestAnimationFrame(frame);
}
