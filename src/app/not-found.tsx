import { Mark } from "@/components/Mark";
import "./home.css";

export default function NotFound() {
  return (
    <div className="home" style={{ display: "grid", placeItems: "center", textAlign: "center", padding: 24 }}>
      <div style={{ display: "grid", justifyItems: "center", gap: 12 }}>
        <Mark className="home-mark" />
        <h1 style={{ fontFamily: "var(--display)", fontStyle: "italic", fontWeight: 400, fontSize: 34, margin: 0 }}>This link isn’t working</h1>
        <p style={{ maxWidth: "36ch", opacity: 0.85, margin: 0 }}>The invitation may have moved. Please ask the couple to send you the link again.</p>
      </div>
    </div>
  );
}
