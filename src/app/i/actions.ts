"use server";

import { getGuestByCode, getWeddingBySlug, markGuestOpened, saveRsvp } from "@/lib/db";

export type RsvpState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "saved"; attending: boolean; count: number; name: string };

export async function submitRsvp(_prev: RsvpState, form: FormData): Promise<RsvpState> {
  const wedding = getWeddingBySlug(String(form.get("slug") || ""));
  if (!wedding) return { status: "error", message: "This invitation link is no longer valid. Please ask the couple for a new one." };

  const code = String(form.get("code") || "");
  const guest = code ? getGuestByCode(wedding.id, code) : null;
  if (code && !guest) return { status: "error", message: "This personal link is no longer valid. Please ask the couple for a new one." };

  const name = (guest?.name ?? String(form.get("name") || "")).trim().slice(0, 120);
  if (!name) return { status: "error", message: "Please add your name so the couple knows who replied." };

  const att = String(form.get("attending") || "");
  if (att !== "yes" && att !== "no") return { status: "error", message: "Please choose whether you can come." };
  const attending = att === "yes";

  const max = guest ? guest.seats : 10;
  let count = Math.round(Number(form.get("count") || 1));
  if (!Number.isFinite(count) || count < 1) count = 1;
  if (count > max) return { status: "error", message: `Your invitation is for ${max} ${max === 1 ? "person" : "people"}. Please choose ${max} or fewer.` };

  const note = String(form.get("note") || "").trim().slice(0, 1000);
  saveRsvp(wedding.id, guest?.id ?? null, { name, attending, count: attending ? count : 0, note });
  return { status: "saved", attending, count: attending ? count : 0, name };
}

export async function markOpened(slug: string, code: string) {
  const wedding = getWeddingBySlug(slug);
  if (!wedding || !code) return;
  const guest = getGuestByCode(wedding.id, code);
  if (guest) markGuestOpened(guest.id);
}
