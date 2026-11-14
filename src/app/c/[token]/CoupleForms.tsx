"use client";

import { useActionState, useEffect, useRef } from "react";
import { addGuestsAction, requestChangesAction, type CoupleFormState } from "../actions";

export function AddGuestsForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<CoupleFormState, FormData>(addGuestsAction, {});
  const ta = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (state.ok && ta.current) ta.current.value = ""; }, [state]);
  return (
    <form action={action} className="cp-form">
      <input type="hidden" name="token" value={token} />
      <label htmlFor="cp-list">Add your guests, one invitation per line</label>
      <textarea id="cp-list" ref={ta} name="list" rows={5}
        placeholder={"Nadine and Tony Haddad, 2, 03 123 456, Bride's family\nUncle Georges, 4, 71 222 333, Groom's family\nRami Khoury, 1"} />
      <small>Name, number of seats, phone, side. Paste straight from a spreadsheet if you like. Only the name is required.</small>
      <div className="cp-row">
        <button className="cp-btn cp-btn-foil" type="submit" disabled={pending}>{pending ? "Adding…" : "Add guests & create links"}</button>
        {state.error && <span className="cp-err" role="alert">{state.error}</span>}
        {state.ok && <span className="cp-ok" role="status">{state.ok}</span>}
      </div>
    </form>
  );
}

export function ChangeRequestForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<CoupleFormState, FormData>(requestChangesAction, {});
  return (
    <form action={action} className="cp-form">
      <input type="hidden" name="token" value={token} />
      <label htmlFor="cp-changes">Or tell your designer what to change</label>
      <textarea id="cp-changes" name="changes" rows={3} placeholder="e.g. Please change the dinner time to 21:00 and use a softer gold." />
      <div className="cp-row">
        <button className="cp-btn cp-btn-line" type="submit" disabled={pending}>{pending ? "Sending…" : "Request changes"}</button>
        {state.error && <span className="cp-err" role="alert">{state.error}</span>}
        {state.ok && <span className="cp-ok" role="status">{state.ok}</span>}
      </div>
    </form>
  );
}
