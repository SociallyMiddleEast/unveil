import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, timingSafeEqual } from "node:crypto";

/* The studio is for the Unveil team only: one shared password from .env.local. */

const COOKIE = "unveil_studio";

function secret() {
  const s = process.env.STUDIO_SECRET || process.env.STUDIO_PASSWORD;
  if (!s) throw new Error("Set STUDIO_PASSWORD and STUDIO_SECRET in .env.local");
  return s;
}
function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}
function safeEqual(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function checkPassword(input: string) {
  const pw = process.env.STUDIO_PASSWORD;
  return !!pw && safeEqual(sign(input), sign(pw));
}

export async function startSession() {
  const issued = Date.now().toString();
  (await cookies()).set(COOKIE, `${issued}.${sign(issued)}`, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    path: "/", maxAge: 60 * 60 * 24 * 14,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

export async function isStudio() {
  const v = (await cookies()).get(COOKIE)?.value;
  if (!v) return false;
  const [issued, sig] = v.split(".");
  return !!issued && !!sig && safeEqual(sig, sign(issued));
}

export async function requireStudio() {
  if (!(await isStudio())) redirect("/studio/login");
}
