# Connect the Unveil website to Google Sheets

The website stays on GitHub Pages. Your Google Sheet is the database and the studio.
A small Apps Script inside the Sheet lets the website read invitations and save replies.

## One-time setup (about 10 minutes)

1. **Create the Sheet.** In Google Drive, create a new Google Sheet named **Unveil**.
2. **Add the script.** In the Sheet, open **Extensions → Apps Script**. Delete what's there, paste the whole of [`Code.gs`](Code.gs), and click **Save**.
3. **Create the tabs.** In the Apps Script editor, choose the function **setup** and click **Run**. Google asks you to authorise the script: choose your account, then **Advanced → Go to Unveil (unsafe) → Allow**. This is normal for your own scripts.
   Back in the Sheet you now have three tabs, **Weddings**, **Guests** and **Replies**, with a sample wedding (Lara & Karim) and three guests.
4. **Publish it.** In Apps Script, click **Deploy → New deployment → Select type: Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**

   Click **Deploy** and copy the **Web app URL** (it ends in `/exec`).
5. **Send the URL** so it can be added to `docs/config.js`. That's the only change the website needs.

## Day to day

- **New wedding:** add a row in **Weddings**. Fill in the details, then use the **Unveil → Fill codes and links** menu. It creates the couple's private code and fills in their **coupleLink** (their private page) and **sharedLink** (the invitation for group chats).
- **Design:** pick the wedding's invitation in the **template** column: `velvet-court` (the wax seal envelope) or `jewel-box` (the ivory box with golden doors). Blank means `velvet-court`. Guest links stay the same whichever design you choose.
- **Date format:** `2027-06-12 17:00`, in the wedding's time zone (`Asia/Beirut`).
- **Multi-line cells** (letter, schedule, notes): use Ctrl+Enter or Cmd+Enter for a new line inside a cell.
  - schedule: `17:00 | The ceremony | St. John's Church`
  - notes: `Gifts | Your presence is our gift.`
- **Lists** (palette, meals): separate items with commas, for example `Meat, Fish, Vegetarian`.
- **Order progress:** set **stage** to `details`, `designing`, `preview`, `approved` or `live`. The couple sees it on their private page. When it's `preview`, they can approve it or request changes, which fill in `approvedAt` or `changeRequest`.
- **Guests:** couples can add guests from their private page, or you can add rows in **Guests** (wedding = the wedding's slug) and run **Fill codes and links** to get each guest's personal link.
- **Replies** appear in **Replies** as guests answer.

## If you change the script later

Use **Deploy → Manage deployments → Edit → Version: New version → Deploy**. The web app URL stays the same.
