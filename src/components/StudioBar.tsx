import Link from "next/link";
import { Mark, Wordmark } from "./Mark";

export function StudioBar({ tag, children }: { tag: string; children?: React.ReactNode }) {
  return (
    <div className="st-bar">
      <div className="st-bar-in">
        <Link href={tag === "Studio" ? "/studio" : "#"}><Mark /><Wordmark className="wm" /></Link>
        <span className="tag">{tag}</span>
        <span className="sp" />
        {children}
      </div>
    </div>
  );
}
