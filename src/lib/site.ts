/*
 * Business details shown on the public website. Edit this file to change prices or contact details.
 */

export const CONTACT = {
  // WhatsApp number in international format, digits only, e.g. "96170123456". Leave empty to hide WhatsApp buttons.
  whatsapp: "",
  // Instagram handle without the @.
  instagram: "unveil.invitations",
  city: "Beirut, Lebanon",
};

export type Package = { id: string; name: string; guests: string; guestsShort: string; price: string; note: string };

export const PACKAGES: Package[] = [
  { id: "50", name: "Intimate", guests: "Up to 50 guests", guestsShort: "50 guests", price: "39.99", note: "Engagements, small weddings and family dinners" },
  { id: "100", name: "Classic", guests: "Up to 100 guests", guestsShort: "100 guests", price: "69.99", note: "A close circle of family and friends" },
  { id: "150", name: "Grand", guests: "Up to 150 guests", guestsShort: "150 guests", price: "74.99", note: "The full family, both sides" },
  { id: "unlimited", name: "Unlimited", guests: "Unlimited guests", guestsShort: "unlimited guests", price: "99", note: "For the big Lebanese wedding: invite everyone" },
];

export const INCLUDED = [
  "Your choice of reveal: The Veil or The Seal",
  "A personal link for every guest or family, greeting them by name",
  "Countdown, schedule, venue map and add to calendar",
  "Our story, dress code and gifts sections",
  "Background music",
  "RSVP that saves straight to your guest list",
  "Your own dashboard: who opened, who’s coming, who to remind",
  "Send each link on WhatsApp in one tap",
  "Guest list download for your venue",
];

export function orderLink(p?: Package) {
  const text = p
    ? `Hi Unveil! I’d like the ${p.name} package (${p.guestsShort}, $${p.price}) for our wedding.`
    : "Hi Unveil! I’d like to know more about your wedding invitations.";
  if (CONTACT.whatsapp) return `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(text)}`;
  return `https://instagram.com/${CONTACT.instagram}`;
}

export const ORDER_LABEL = CONTACT.whatsapp ? "Order on WhatsApp" : "Order on Instagram";
