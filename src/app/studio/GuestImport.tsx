"use client";

import { useActionState, useEffect, useRef } from "react";
import { importGuests, type FormState } from "./actions";

export function GuestImport({ weddingId }: { weddingId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(importGuests, {});
  const ta = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (state.ok && ta.current) ta.current.value = ""; }, [state]);
  return (
    <form action={action} style={{ display: "grid", gap: 10 }}>
      <input type="hidden" name="weddingId" value={weddingId} />
      <div className="fld">
        <label htmlFor="gl">Paste guests, one invitation per line</label>
        <textarea id="gl" ref={ta} name="list" className="mono" rows={6}
          placeholder={"Nadine and Tony Haddad, 2, 03 123 456, Bride's family\nUncle Georges, 4, 71 222 333, Groom's family\nRami Khoury, 1, , Friends"} />
        <small>Name, number of seats, phone, side. You can paste straight from a spreadsheet. Only the name is required.</small>
      </div>
      <div className="row">
        <button className="btn btn-wine" type="submit" disabled={pending}>{pending ? "Adding…" : "Add guests"}</button>
        {state.error && <span className="msg-err" role="alert">{state.error}</span>}
        {state.ok && <span className="msg-ok" role="status">{state.ok}</span>}
      </div>
    </form>
  );
}
