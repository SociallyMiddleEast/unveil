# Unveil Invitations

Animated wedding invitations, made in Lebanon. This is **phase 1: done for you**. The Unveil team builds each couple's invitation in the studio, guests reply through personal links, and couples follow replies on their own dashboard.

## Run it on your Mac

```bash
npm install
cp .env.example .env.local   # then set STUDIO_PASSWORD and STUDIO_SECRET
npm run dev
```

Open http://localhost:3000/studio and sign in with the `STUDIO_PASSWORD` from `.env.local`.

## The four parts

| Address | Who uses it | What it does |
| --- | --- | --- |
| `/studio` | You | Create weddings, choose the reveal (Veil or Seal), paste guest lists, copy links |
| `/i/<couple>/<guest code>` | Each guest | Personal invitation: greets them by name, caps the RSVP at their seats, records when they open it |
| `/i/<couple>` | Group chats | Shared invitation: guests type their own name |
| `/c/<private code>` | The couple | Live guest list, WhatsApp invites and reminders, CSV download for the venue |

## How a wedding goes out

1. In the studio, select **New wedding**, or **Create sample wedding** to get a ready-made demo.
2. Paste the guest list, one invitation per line: `Name, seats, phone, side`. You can paste straight from a spreadsheet.
3. Send the couple their dashboard link. From the dashboard, they tap **WhatsApp** next to each guest to send that guest's personal link.
4. Replies show up on the dashboard straight away. Download the CSV for the venue when replies close.

## Code map

- `src/lib/db.ts`: all data access (weddings, guests, RSVPs). This is the only file to change when moving to a hosted database.
- `src/components/invitation/`: the guest-facing invitation, reveals, RSVP form, music and gold dust.
- `src/app/studio/`: the studio pages and server actions.
- `src/app/c/[token]/`: the couple's dashboard and CSV export.
- `docs/`: brand directions, brand book and the original HTML sample.

## Before going live

- Data is stored in a local SQLite file at `data/unveil.db` (Node's built-in `node:sqlite`). Hosting such as Vercel can't keep a local file, so move `src/lib/db.ts` to a hosted Postgres database (for example Supabase) before launch.
- Set `APP_URL` to the real domain so the links sent to guests are correct.
