"use client";

import { useActionState } from "react";
import { saveWedding, type FormState } from "./actions";

export type WeddingFormValues = {
  id: string; partner1: string; partner2: string; startsLocal: string; city: string; venueName: string;
  venueAddress: string; mapsQuery: string; intro: string; storyTitle: string; story: string; schedule: string;
  dressTitle: string; dressText: string; giftsText: string; rsvpDeadline: string; reveal: "veil" | "seal";
};

const EMPTY: WeddingFormValues = {
  id: "", partner1: "", partner2: "", startsLocal: "", city: "", venueName: "", venueAddress: "", mapsQuery: "",
  intro: "request the pleasure of your company as they begin forever", storyTitle: "", story: "",
  schedule: "17:00 | The ceremony | \n19:30 | The zaffe | Drums, dabke and our grand entrance\n20:30 | Dinner & dancing | \n23:30 | The cake | ",
  dressTitle: "", dressText: "", giftsText: "", rsvpDeadline: "", reveal: "veil",
};

export function WeddingForm({ values = EMPTY }: { values?: WeddingFormValues }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveWedding, {});
  const v = values;
  return (
    <form className="grid" action={action}>
      <input type="hidden" name="id" value={v.id} />
      <div className="fld"><label htmlFor="p1">First name (bride or partner)</label><input id="p1" name="partner1" type="text" defaultValue={v.partner1} required /></div>
      <div className="fld"><label htmlFor="p2">First name (groom or partner)</label><input id="p2" name="partner2" type="text" defaultValue={v.partner2} required /></div>
      <div className="fld"><label htmlFor="when">Date and start time</label><input id="when" name="startsLocal" type="datetime-local" defaultValue={v.startsLocal} required /><small>Lebanon time.</small></div>
      <div className="fld"><label htmlFor="dl">Reply by</label><input id="dl" name="rsvpDeadline" type="date" defaultValue={v.rsvpDeadline} /></div>

      <div className="fld full">
        <span className="st-label">Reveal</span>
        <div className="st-reveal">
          <label><span className="row"><input type="radio" name="reveal" value="veil" defaultChecked={v.reveal === "veil"} /><b>The Veil</b></span><span>Guests swipe up to lift a sheer veil.</span></label>
          <label><span className="row"><input type="radio" name="reveal" value="seal" defaultChecked={v.reveal === "seal"} /><b>The Seal</b></span><span>Guests break a wax seal and the envelope opens.</span></label>
        </div>
      </div>

      <div className="fld"><label htmlFor="vn">Venue name</label><input id="vn" name="venueName" type="text" defaultValue={v.venueName} required /></div>
      <div className="fld"><label htmlFor="va">Venue address</label><input id="va" name="venueAddress" type="text" defaultValue={v.venueAddress} placeholder="Old Port, Byblos" /></div>
      <div className="fld"><label htmlFor="city">Town shown under the date</label><input id="city" name="city" type="text" defaultValue={v.city} placeholder="Byblos · Lebanon" /></div>
      <div className="fld"><label htmlFor="mq">Google Maps search</label><input id="mq" name="mapsQuery" type="text" defaultValue={v.mapsQuery} /><small>Leave empty to use the venue name and address.</small></div>
      <div className="fld full"><label htmlFor="intro">Invitation line</label><input id="intro" name="intro" type="text" defaultValue={v.intro} /></div>
      <div className="fld"><label htmlFor="st">Story heading</label><input id="st" name="storyTitle" type="text" defaultValue={v.storyTitle} placeholder="It started with a coffee in Gemmayzeh" /></div>
      <div className="fld"><label htmlFor="dt">Dress code heading</label><input id="dt" name="dressTitle" type="text" defaultValue={v.dressTitle} placeholder="Black tie" /></div>
      <div className="fld"><label htmlFor="story">Our story</label><textarea id="story" name="story" defaultValue={v.story} /><small>Leave empty to hide this section.</small></div>
      <div className="fld"><label htmlFor="dress">Dress code</label><textarea id="dress" name="dressText" defaultValue={v.dressText} /><small>Leave empty to hide this section.</small></div>
      <div className="fld full"><label htmlFor="sched">Schedule</label><textarea id="sched" className="mono" name="schedule" defaultValue={v.schedule} /><small>One line each: time | title | detail</small></div>
      <div className="fld full"><label htmlFor="gifts">Gifts</label><textarea id="gifts" name="giftsText" defaultValue={v.giftsText} /><small>Leave empty to hide this section.</small></div>

      <div className="full row">
        <button className="btn btn-wine" type="submit" disabled={pending}>{pending ? "Saving…" : v.id ? "Save changes" : "Create wedding"}</button>
        {state.error && <span className="msg-err" role="alert">{state.error}</span>}
        {state.ok && <span className="msg-ok" role="status">{state.ok}</span>}
      </div>
    </form>
  );
}
