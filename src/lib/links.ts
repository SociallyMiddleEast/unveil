import "server-only";
import { headers } from "next/headers";
import type { Guest, Wedding } from "./db";

export async function baseUrl() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export function inviteUrl(base: string, w: Wedding, g?: Guest) {
  return g ? `${base}/i/${w.slug}/${g.code}` : `${base}/i/${w.slug}`;
}

/** Lebanese numbers typed as 03 123 456 or 70123456 become 9613123456 / 96170123456. */
export function waNumber(phone: string) {
  let d = phone.replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("961")) return d;
  if (d.startsWith("0")) d = d.slice(1);
  if (d.length >= 7 && d.length <= 8) return `961${d}`;
  return d;
}

export function inviteMessage(w: Wedding, g: Guest, url: string) {
  return `Dear ${g.name},\n${w.partner1} and ${w.partner2} have something for you. Open it somewhere quiet 🤍\n${url}`;
}
export function reminderMessage(w: Wedding, g: Guest, url: string) {
  return `Dear ${g.name}, a gentle reminder from ${w.partner1} and ${w.partner2}: we'd love to know if you can join us. You can reply here 🤍\n${url}`;
}

export function waLink(phone: string, text: string) {
  const n = waNumber(phone);
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
}
