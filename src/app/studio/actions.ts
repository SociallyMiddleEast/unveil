"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { checkPassword, endSession, requireStudio, startSession } from "@/lib/auth";
import {
  addGuests, createWedding, deleteGuest, deleteWedding, getWeddingById, setStage, updateWedding,
  STAGES, type Reveal, type ScheduleItem, type Stage, type WeddingInput,
} from "@/lib/db";
import { parseGuestList } from "@/lib/guests";
import { DEFAULT_TZ, localToUtcIso } from "@/lib/time";

export type FormState = { error?: string; ok?: string };

export async function login(_prev: FormState, form: FormData): Promise<FormState> {
  if (!checkPassword(String(form.get("password") || ""))) return { error: "That password isn’t right." };
  await startSession();
  redirect("/studio");
}

export async function logout() {
  await endSession();
  redirect("/studio/login");
}

/** "17:00 | The ceremony | St. John's Church" per line. */
export async function parseSchedule(text: string): Promise<ScheduleItem[]> {
  return text.split("\n").map(l => l.trim()).filter(Boolean).map(l => {
    const [time = "", title = "", detail = ""] = l.split("|").map(s => s.trim());
    return { time, title, detail };
  }).filter(s => s.title);
}

async function readWedding(form: FormData): Promise<WeddingInput | string> {
  const s = (k: string) => String(form.get(k) || "").trim();
  if (!s("partner1") || !s("partner2")) return "Add both names.";
  if (!s("startsLocal")) return "Add the date and time.";
  if (!s("venueName")) return "Add the venue name.";
  let startsAt: string;
  try { startsAt = localToUtcIso(s("startsLocal"), DEFAULT_TZ); } catch { return "The date and time aren’t valid."; }
  const reveal = (s("reveal") === "seal" ? "seal" : "veil") as Reveal;
  return {
    partner1: s("partner1"), partner2: s("partner2"), startsAt, timeZone: DEFAULT_TZ,
    city: s("city"), venueName: s("venueName"), venueAddress: s("venueAddress"), mapsQuery: s("mapsQuery"),
    intro: s("intro") || "request the pleasure of your company as they begin forever",
    storyTitle: s("storyTitle"), story: s("story"), schedule: await parseSchedule(s("schedule")),
    dressTitle: s("dressTitle"), dressText: s("dressText"), giftsText: s("giftsText"),
    rsvpDeadline: /^\d{4}-\d{2}-\d{2}$/.test(s("rsvpDeadline")) ? s("rsvpDeadline") : "", reveal,
  };
}

export async function saveWedding(_prev: FormState, form: FormData): Promise<FormState> {
  await requireStudio();
  const input = await readWedding(form);
  if (typeof input === "string") return { error: input };
  const id = String(form.get("id") || "");
  if (id) {
    if (!await getWeddingById(id)) return { error: "This wedding no longer exists." };
    await updateWedding(id, input);
    revalidatePath(`/studio/${id}`);
    return { ok: "Saved. Guests see the changes the next time they open the link." };
  }
  const w = await createWedding(input);
  redirect(`/studio/${w.id}`);
}

export async function removeWedding(form: FormData) {
  await requireStudio();
  const id = String(form.get("id") || "");
  if (String(form.get("confirm") || "").trim().toLowerCase() !== "delete") return;
  await deleteWedding(id);
  redirect("/studio");
}

export async function importGuests(_prev: FormState, form: FormData): Promise<FormState> {
  await requireStudio();
  const id = String(form.get("weddingId") || "");
  if (!await getWeddingById(id)) return { error: "This wedding no longer exists." };
  const list = parseGuestList(String(form.get("list") || ""));
  if (!list.length) return { error: "Paste at least one guest, one per line." };
  await addGuests(id, list);
  revalidatePath(`/studio/${id}`);
  return { ok: `Added ${list.length} ${list.length === 1 ? "guest" : "guests"}.` };
}

/** A ready-made demo wedding for filming reels and showing couples. */
export async function createSampleWedding() {
  await requireStudio();
  const w = await createWedding({
    partner1: "Lara", partner2: "Karim", startsAt: localToUtcIso("2027-06-12T17:00", DEFAULT_TZ), timeZone: DEFAULT_TZ,
    city: "Byblos · Lebanon", venueName: "The Harbour Terrace", venueAddress: "Old Port, Byblos, Lebanon", mapsQuery: "Byblos Old Port, Lebanon",
    intro: "request the pleasure of your company as they begin forever",
    storyTitle: "It started with a coffee in Gemmayzeh",
    story: "Seven years, two cities and one very nervous proposal at the Byblos lighthouse later, we can’t wait to celebrate with the people who made the journey so beautiful.",
    schedule: [
      { time: "17:00", title: "The ceremony", detail: "St. John the Baptist Church, Byblos" },
      { time: "19:30", title: "The zaffe", detail: "Drums, dabke and our grand entrance" },
      { time: "20:30", title: "Dinner & dancing", detail: "By the old harbour" },
      { time: "23:30", title: "The cake", detail: "Then we dance until sunrise" },
    ],
    dressTitle: "Black tie, evening glow", dressText: "Long gowns and dark suits. Please leave white to the bride.",
    giftsText: "Your presence is our gift. If you’d like to celebrate with something more, there will be a wishing well at the venue for our honeymoon.",
    rsvpDeadline: "2027-05-01", reveal: "veil",
  });
  await addGuests(w.id, [
    { name: "Nadine and Tony", side: "Bride's family", phone: "", seats: 2 },
    { name: "Uncle Georges", side: "Groom's family", phone: "", seats: 4 },
    { name: "Rami", side: "Friends", phone: "", seats: 1 },
  ]);
  redirect(`/studio/${w.id}`);
}

export async function removeGuest(form: FormData) {
  await requireStudio();
  const weddingId = String(form.get("weddingId") || "");
  await deleteGuest(String(form.get("guestId") || ""), weddingId);
  revalidatePath(`/studio/${weddingId}`);
}

/** Move an order to another stage (details → designing → preview → approved → live). */
export async function changeStage(form: FormData) {
  await requireStudio();
  const id = String(form.get("weddingId") || "");
  const stage = String(form.get("stage") || "") as Stage;
  if (!STAGES.includes(stage)) return;
  await setStage(id, stage);
  revalidatePath(`/studio/${id}`);
}
