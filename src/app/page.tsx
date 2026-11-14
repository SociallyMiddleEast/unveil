import type { Metadata } from "next";
import Link from "next/link";
import { Mark, Wordmark } from "@/components/Mark";
import { CONTACT, INCLUDED, ORDER_LABEL, PACKAGES, orderLink } from "@/lib/site";
import "./home.css";

export const metadata: Metadata = {
  title: { absolute: "Unveil Invitations · Animated wedding invitations, made in Lebanon" },
  description: "Animated wedding invitations your guests open with a gesture. Personal links, RSVP tracking and WhatsApp sending. From $39.99.",
  openGraph: {
    title: "Unveil Invitations",
    description: "Every invitation deserves an entrance. Animated wedding invitations, made in Lebanon.",
  },
};

const STEPS = [
  { t: "Choose your package", d: "Pick the size of your guest list and message us on " + (CONTACT.whatsapp ? "WhatsApp." : "Instagram.") },
  { t: "Send us your details", d: "Names, date, venue, your story and your guest list. A spreadsheet is fine." },
  { t: "Approve your invitation", d: "We build it in your colours and send you a preview. Ask for changes until it feels like you." },
  { t: "Share and relax", d: "Send each guest their personal link on WhatsApp, then watch the replies arrive." },
];

const FAQ = [
  { q: "How do guests receive it?", a: "As a link, usually on WhatsApp. Each family gets their own link that greets them by name and knows how many seats are saved for them." },
  { q: "Do guests need to download anything?", a: "No. It opens in the browser on any phone or computer." },
  { q: "How do guests reply?", a: "Right inside the invitation, in a few seconds. Their answer goes straight to your guest list, and they can change it later." },
  { q: "Can we change details after it’s sent?", a: "Yes. If the time or venue changes, we update it and every guest sees the new details the next time they open their link." },
  { q: "What does a guest count include?", a: "Every person invited. A family of four counts as four guests." },
  { q: "Is it only for weddings?", a: "No. Engagements, birthdays, baptisms and other events work the same way." },
];

function PhoneDemo() {
  return (
    <div className="hp-phone" aria-hidden="true">
      <div className="hp-screen">
        <div className="hp-invite">
          <span className="hp-fam">Together with their families</span>
          <span className="hp-names">Lara<i>&amp;</i>Karim</span>
          <span className="hp-date">12 · 06 · 2027</span>
          <span className="hp-place">Byblos · Lebanon</span>
          <span className="hp-rsvp">Will you join us?</span>
        </div>
        <div className="hp-veil">
          <Mark className="hp-veil-mark" />
          <span>Lara &amp; Karim have something for you</span>
          <small>Swipe up to lift the veil</small>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="home">
      <nav className="hm-nav" aria-label="Main">
        <div className="hm-wrap hm-nav-in">
          <a href="#top" className="hm-brand"><Mark className="hm-nav-mark" /><Wordmark className="hm-nav-word" /></a>
          <div className="hm-links">
            <a href="#reveals">Reveals</a>
            <a href="#how">How it works</a>
            <a href="#packages">Packages</a>
            <a href="#faq">FAQ</a>
          </div>
          <a className="btn btn-gold btn-sm" href="#packages">See prices</a>
        </div>
      </nav>

      <header className="hm-hero" id="top">
        <div className="hm-wrap hm-hero-in">
          <div className="hm-hero-copy">
            <div className="hm-eyebrow">Animated invitations · Made in Lebanon</div>
            <h1>Every invitation deserves an <em>entrance.</em></h1>
            <p className="hm-lede">Your guests lift a veil or break a wax seal, and your wedding unfolds on their phone: the date, the venue, the schedule, and a reply in one tap. You get a live guest list, ready for your venue.</p>
            <div className="hm-cta">
              <Link className="btn btn-gold" href="/demo">Open a live invitation</Link>
              <a className="btn" href="#packages">From $39.99</a>
            </div>
          </div>
          <PhoneDemo />
        </div>
      </header>

      <section className="hm-sec hm-light" id="reveals" aria-labelledby="h-reveals">
        <div className="hm-wrap">
          <div className="hm-eyebrow">The reveal</div>
          <h2 id="h-reveals">It opens with a gesture they’ll remember</h2>
          <p className="hm-intro">Every Unveil invitation starts with a small ritual. Choose the one that feels like your wedding.</p>
          <div className="hm-reveals">
            <article className="hm-reveal">
              <div className="hm-reveal-art veil" aria-hidden="true"><Mark /></div>
              <h3>The Veil</h3>
              <p>A sheer bridal veil covers the screen. Guests swipe it up, and your names come into focus as gold dust falls.</p>
              <Link href="/demo">Try The Veil</Link>
            </article>
            <article className="hm-reveal">
              <div className="hm-reveal-art seal" aria-hidden="true"><span>L·K</span></div>
              <h3>The Seal</h3>
              <p>A wax seal with your initials. Guests tap to break it, the envelope opens, and the invitation appears.</p>
              <Link href="/demo?reveal=seal">Try The Seal</Link>
            </article>
          </div>
        </div>
      </section>

      <section className="hm-sec hm-light hm-tight" aria-labelledby="h-inc">
        <div className="hm-wrap hm-inc">
          <div>
            <div className="hm-eyebrow">In every package</div>
            <h2 id="h-inc">Everything about your day, in one link</h2>
            <p className="hm-intro">Every package includes every feature. The only difference is how many guests you invite.</p>
          </div>
          <ul className="hm-checks">
            {INCLUDED.map(i => <li key={i}>{i}</li>)}
          </ul>
        </div>
      </section>

      <section className="hm-sec" id="how" aria-labelledby="h-how">
        <div className="hm-wrap">
          <div className="hm-eyebrow">How it works</div>
          <h2 id="h-how">From your first message to the last reply</h2>
          <ol className="hm-steps">
            {STEPS.map((s, i) => (
              <li key={s.t}><span className="hm-step-n">{i + 1}</span><h3>{s.t}</h3><p>{s.d}</p></li>
            ))}
          </ol>
        </div>
      </section>

      <section className="hm-sec hm-light" id="packages" aria-labelledby="h-pk">
        <div className="hm-wrap">
          <div className="hm-eyebrow">Packages</div>
          <h2 id="h-pk">One price per event, sized to your guest list</h2>
          <p className="hm-intro">One payment per event. Prices in US dollars.</p>
          <div className="hm-packages">
            {PACKAGES.map(p => (
              <article key={p.id} className={`hm-pk${p.id === "unlimited" ? " hm-pk-top" : ""}`}>
                <h3>{p.name}</h3>
                <div className="hm-pk-guests">{p.guests}</div>
                <div className="hm-pk-price"><sup>$</sup>{p.price}</div>
                <p>{p.note}</p>
                <a className={`btn ${p.id === "unlimited" ? "btn-gold" : "btn-wine"}`} href={orderLink(p)} target="_blank" rel="noopener noreferrer">{ORDER_LABEL}</a>
              </article>
            ))}
          </div>
          <p className="hm-small">All packages include every feature listed above.</p>
        </div>
      </section>

      <section className="hm-sec hm-light hm-tight" id="faq" aria-labelledby="h-faq">
        <div className="hm-wrap hm-faq-wrap">
          <div>
            <div className="hm-eyebrow">Questions</div>
            <h2 id="h-faq">Good to know</h2>
          </div>
          <div className="hm-faq">
            {FAQ.map(f => (
              <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>
            ))}
          </div>
        </div>
      </section>

      <section className="hm-sec hm-final" aria-labelledby="h-final">
        <div className="hm-wrap hm-final-in">
          <Mark className="hm-final-mark" />
          <h2 id="h-final">Reserve your date</h2>
          <p>Tell us your wedding date and guest count, and we’ll take it from there.</p>
          <div className="hm-cta" style={{ justifyContent: "center" }}>
            <a className="btn btn-gold" href={orderLink()} target="_blank" rel="noopener noreferrer">{ORDER_LABEL}</a>
            <Link className="btn" href="/demo">Open a live invitation</Link>
          </div>
        </div>
      </section>

      <footer className="hm-foot">
        <div className="hm-wrap hm-foot-in">
          <span className="hm-brand"><Mark className="hm-nav-mark" /><Wordmark className="hm-nav-word" /></span>
          <span>Instagram <a href={`https://instagram.com/${CONTACT.instagram}`} target="_blank" rel="noopener noreferrer">@{CONTACT.instagram}</a></span>
          <span>{CONTACT.city}</span>
        </div>
      </footer>
    </div>
  );
}
