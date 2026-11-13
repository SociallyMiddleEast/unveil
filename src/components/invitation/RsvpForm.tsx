"use client";

import { useActionState, useEffect, useState } from "react";
import { submitRsvp, type RsvpState } from "@/app/i/actions";
import { Mark } from "@/components/Mark";

type Props = {
  slug: string;
  code: string;
  couple: string;
  guest: { name: string; seats: number } | null;
  existing: { attending: boolean; count: number; note: string } | null;
  onAccepted: () => void;
};

export function RsvpForm({ slug, code, couple, guest, existing, onAccepted }: Props) {
  const [state, action, pending] = useActionState<RsvpState, FormData>(submitRsvp, { status: "idle" });
  const [editing, setEditing] = useState(!existing);
  const [attending, setAttending] = useState<"" | "yes" | "no">(existing ? (existing.attending ? "yes" : "no") : "");
  const max = guest?.seats ?? 10;
  const [count, setCount] = useState(existing?.attending ? Math.max(1, existing.count) : Math.min(max, guest?.seats ?? 1));

  useEffect(() => {
    if (state.status === "saved") {
      setEditing(false);
      if (state.attending) onAccepted();
    }
  }, [state, onAccepted]);

  const saved = state.status === "saved" ? state : existing ? { attending: existing.attending, count: existing.count } : null;

  if (!editing && saved) {
    return (
      <div className="inv-done" role="status">
        <Mark className="inv-done-mark" />
        <h3>{saved.attending ? "We can’t wait to see you" : "You’ll be missed"}</h3>
        <p>
          {saved.attending
            ? `Your reply is saved: ${saved.count} ${saved.count === 1 ? "person" : "people"} attending. ${couple} have it on their guest list.`
            : `Your reply is saved. ${couple} will be sorry not to see you.`}
        </p>
        <button type="button" className="inv-linkish" onClick={() => setEditing(true)}>Change my reply</button>
      </div>
    );
  }

  return (
    <form className="inv-rsvp" action={action}>
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="code" value={code} />
      {guest ? (
        <p className="inv-for">This invitation is for <b>{guest.name}</b>{guest.seats > 1 ? `, up to ${guest.seats} people` : ""}.</p>
      ) : (
        <div className="inv-field">
          <label htmlFor="rsvp-name">Your name</label>
          <input id="rsvp-name" name="name" type="text" autoComplete="name" placeholder="Full name" required />
        </div>
      )}
      <div className="inv-field">
        <span className="lbl" id="lbl-att">Your answer</span>
        <div className="inv-seg" role="radiogroup" aria-labelledby="lbl-att">
          <label><input type="radio" name="attending" value="yes" checked={attending === "yes"} onChange={() => setAttending("yes")} />Joyfully accepts</label>
          <label><input type="radio" name="attending" value="no" checked={attending === "no"} onChange={() => setAttending("no")} />Regretfully declines</label>
        </div>
      </div>
      {attending !== "no" && max > 1 && (
        <div className="inv-field">
          <span className="lbl">Number of guests</span>
          <div className="inv-stepper">
            <button type="button" aria-label="Fewer guests" onClick={() => setCount(c => Math.max(1, c - 1))}>−</button>
            <output aria-live="polite">{count}</output>
            <button type="button" aria-label="More guests" onClick={() => setCount(c => Math.min(max, c + 1))}>+</button>
            <small>{guest ? `of ${max} invited` : "including you"}</small>
          </div>
        </div>
      )}
      <input type="hidden" name="count" value={count} />
      <div className="inv-field">
        <label htmlFor="rsvp-note">A note for the couple <span className="opt">(optional)</span></label>
        <textarea id="rsvp-note" name="note" defaultValue={existing?.note ?? ""} placeholder="Mabrouk! Can’t wait to dance with you…" />
      </div>
      <div className="inv-err" role="alert">{state.status === "error" ? state.message : ""}</div>
      <button className="btn btn-gold inv-submit" type="submit" disabled={pending}>{pending ? "Sending…" : "Send my reply"}</button>
    </form>
  );
}
