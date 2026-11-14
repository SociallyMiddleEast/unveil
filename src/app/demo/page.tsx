import type { Metadata } from "next";
import { Invitation } from "@/components/invitation/Invitation";
import { formatDateDots, formatDateLong, formatTime } from "@/lib/time";

export const metadata: Metadata = {
  title: "Live demo",
  description: "Open a sample Unveil invitation and try the reveal.",
};

/* A sample invitation for the website. Nothing here touches the database. */
const STARTS = "2027-06-12T14:00:00.000Z"; // 17:00 in Beirut

export default async function Demo({ searchParams }: { searchParams: Promise<{ reveal?: string }> }) {
  const reveal = (await searchParams).reveal === "seal" ? "seal" : "veil";
  return (
    <Invitation
      demo
      slug="demo"
      code=""
      partner1="Lara"
      partner2="Karim"
      startsAt={STARTS}
      dateDots={formatDateDots(STARTS)}
      dateLong={formatDateLong(STARTS)}
      time={formatTime(STARTS)}
      city="Byblos · Lebanon"
      venueName="The Harbour Terrace"
      venueAddress="Old Port, Byblos, Lebanon"
      mapsQuery="Byblos Old Port, Lebanon"
      intro="request the pleasure of your company as they begin forever"
      storyTitle="It started with a coffee in Gemmayzeh"
      story="Seven years, two cities and one very nervous proposal at the Byblos lighthouse later, we can’t wait to celebrate with the people who made the journey so beautiful."
      schedule={[
        { time: "17:00", title: "The ceremony", detail: "St. John the Baptist Church, Byblos" },
        { time: "19:30", title: "The zaffe", detail: "Drums, dabke and our grand entrance" },
        { time: "20:30", title: "Dinner & dancing", detail: "By the old harbour" },
        { time: "23:30", title: "The cake", detail: "Then we dance until sunrise" },
      ]}
      dressTitle="Black tie, evening glow"
      dressText="Long gowns and dark suits. Please leave white to the bride."
      giftsText="Your presence is our gift. If you’d like to celebrate with something more, there will be a wishing well at the venue for our honeymoon."
      deadline="1 May 2027"
      reveal={reveal}
      guest={null}
      existing={null}
    />
  );
}
