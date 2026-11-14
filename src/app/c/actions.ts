"use server";

import { revalidatePath } from "next/cache";
import { addGuests, approvePreview, deleteGuest, getWeddingByCoupleToken, listGuests, requestChanges } from "@/lib/db";
import { parseGuestList } from "@/lib/guests";

/*
 * Actions on the couple's private page. The private code in the link is the couple's key:
 * every action looks the wedding up by that code and only touches that wedding.
 */

export type CoupleFormState = { error?: string; ok?: string };

const MAX_GUESTS = 2000;

async function weddingFor(form: FormData) {
  const token = String(form.get("token") || "");
  if (!/^[A-Za-z0-9]{6,40}$/.test(token)) return null;
  return getWeddingByCoupleToken(token);
}

export async function approveAction(form: FormData) {
  const w = await weddingFor(form);
  if (!w) return;
  await approvePreview(w.id);
  revalidatePath(`/c/${w.coupleToken}`);
}

export async function requestChangesAction(_prev: CoupleFormState, form: FormData): Promise<CoupleFormState> {
  const w = await weddingFor(form);
  if (!w) return { error: "This private page is no longer valid. Please message us." };
  if (w.stage !== "preview") return { error: "There’s no preview waiting for your approval right now." };
  const text = String(form.get("changes") || "").trim().slice(0, 2000);
  if (!text) return { error: "Tell us what you’d like to change." };
  await requestChanges(w.id, text);
  revalidatePath(`/c/${w.coupleToken}`);
  return { ok: "Sent to your designer. We’ll let you know when the new preview is ready." };
}

export async function addGuestsAction(_prev: CoupleFormState, form: FormData): Promise<CoupleFormState> {
  const w = await weddingFor(form);
  if (!w) return { error: "This private page is no longer valid. Please message us." };
  const list = parseGuestList(String(form.get("list") || ""));
  if (!list.length) return { error: "Add at least one guest: one name per line." };
  const existing = (await listGuests(w.id)).length;
  if (existing + list.length > MAX_GUESTS) return { error: `That would be more than ${MAX_GUESTS} invitations. Please message us.` };
  await addGuests(w.id, list);
  revalidatePath(`/c/${w.coupleToken}`);
  return { ok: `Added ${list.length} ${list.length === 1 ? "guest" : "guests"}, each with their own link.` };
}

export async function removeGuestAction(form: FormData) {
  const w = await weddingFor(form);
  if (!w) return;
  await deleteGuest(String(form.get("guestId") || ""), w.id);
  revalidatePath(`/c/${w.coupleToken}`);
}
