import { Mark, Wordmark } from "@/components/Mark";
import "./home.css";

export default function Home() {
  return (
    <div className="home">
      <header className="home-hero">
        <Mark className="home-mark" label="Unveil" />
        <h1><Wordmark /></h1>
        <div className="home-desc">Invitations</div>
        <p className="home-tag">Every invitation deserves an entrance.</p>
        <p className="home-lede">Animated wedding invitations, made in Lebanon. Your guests lift a veil or break a wax seal, then find everything about your day, and reply in one tap.</p>
      </header>
      <section className="home-points">
        <div><h2>The reveal</h2><p>Each invitation opens with a gesture your guests will remember: The Veil, The Seal, and more to come.</p></div>
        <div><h2>A personal link</h2><p>Every family gets their own link, greeted by name, with the number of seats saved for them.</p></div>
        <div><h2>A live guest list</h2><p>See who opened, who is coming and who still needs a reminder, and send the final list to your venue.</p></div>
      </section>
      <footer className="home-foot">
        <p>To reserve your date, message us on Instagram <b>@unveil.invitations</b></p>
        <small>Unveil Invitations · Beirut, Lebanon</small>
      </footer>
    </div>
  );
}
