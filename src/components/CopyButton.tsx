"use client";

import { useState } from "react";

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState("");
  return (
    <button type="button" className="btn btn-sm" onClick={async () => {
      try { await navigator.clipboard.writeText(text); setDone("Copied"); }
      catch { setDone("Copy failed"); }
      setTimeout(() => setDone(""), 1800);
    }}>{done || label}</button>
  );
}
