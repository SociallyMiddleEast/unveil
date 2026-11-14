import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getGuestByCode, getRsvpForGuest, getWeddingBySlug } from "@/lib/db";
import { formatDateDots, formatDateLong, formatDeadline, formatTime } from "@/lib/time";
import { Invitation, type InvitationProps } from "@/components/invitation/Invitation";

type Params = { slug: string; code?: string[] };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const w = await getWeddingBySlug(slug);
  if (!w) return { title: "Invitation" };
  const title = `${w.partner1} & ${w.partner2}`;
  return {
    title,
    description: "Something beautiful is waiting.",
    robots: { index: false, follow: false },
    openGraph: { title, description: "Something beautiful is waiting." },
  };
}

export default async function InvitationPage({ params }: { params: Promise<Params> }) {
  const { slug, code } = await params;
  const w = await getWeddingBySlug(slug);
  if (!w) notFound();
  const guestCode = code?.[0] ?? "";
  const guest = guestCode ? await getGuestByCode(w.id, guestCode) : null;
  if (guestCode && !guest) notFound();
  const rsvp = guest ? await getRsvpForGuest(guest.id) : null;

  const props: InvitationProps = {
    slug: w.slug,
    code: guest?.code ?? "",
    partner1: w.partner1,
    partner2: w.partner2,
    startsAt: w.startsAt,
    dateDots: formatDateDots(w.startsAt, w.timeZone),
    dateLong: formatDateLong(w.startsAt, w.timeZone),
    time: formatTime(w.startsAt, w.timeZone),
    city: w.city,
    venueName: w.venueName,
    venueAddress: w.venueAddress,
    mapsQuery: w.mapsQuery || `${w.venueName}, ${w.venueAddress}`,
    intro: w.intro,
    storyTitle: w.storyTitle,
    story: w.story,
    schedule: w.schedule,
    dressTitle: w.dressTitle,
    dressText: w.dressText,
    giftsText: w.giftsText,
    deadline: formatDeadline(w.rsvpDeadline),
    reveal: w.reveal,
    guest: guest ? { name: guest.name, seats: guest.seats } : null,
    existing: rsvp ? { attending: rsvp.attending, count: rsvp.count, note: rsvp.note } : null,
  };
  return <Invitation {...props} />;
}
