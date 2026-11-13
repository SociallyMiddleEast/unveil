"use client";

import { useActionState } from "react";
import { login, type FormState } from "../actions";
import { Mark } from "@/components/Mark";

export function LoginForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(login, {});
  return (
    <div className="st-login">
      <form action={action}>
        <Mark />
        <h1>Unveil Studio</h1>
        <div className="fld">
          <label htmlFor="pw">Studio password</label>
          <input id="pw" name="password" type="password" autoComplete="current-password" required autoFocus />
        </div>
        {state.error && <div className="msg-err" role="alert">{state.error}</div>}
        <button className="btn btn-wine" type="submit" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
      </form>
    </div>
  );
}
