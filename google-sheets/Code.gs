/**
 * Unveil · Google Sheets backend
 *
 * Paste this whole file into Extensions → Apps Script of your Unveil Google Sheet,
 * run "setup" once, then Deploy → New deployment → Web app
 * (Execute as: Me · Who has access: Anyone). Send the web app address to your website.
 *
 * Tabs it uses (created by setup):
 *   Weddings · one row per wedding (you fill these in; this is your studio)
 *   Guests   · one row per invitation (couples can also add guests from their private page)
 *   Replies  · one row per RSVP (written by the website)
 */

var SITE = 'https://sociallymiddleeast.github.io/unveil';
var TABS = {
  Weddings: ['slug', 'coupleCode', 'partner1', 'partner2', 'date', 'timeZone', 'city', 'venueName', 'venueAddress', 'mapsQuery', 'venueNote',
    'letter', 'schedule', 'dressTitle', 'dressText', 'dressHer', 'dressHim', 'palette', 'notes', 'meals', 'replyBy',
    'stage', 'approvedAt', 'changeRequest', 'changeRequestAt', 'coupleLink', 'sharedLink', 'template'],
  Guests: ['wedding', 'code', 'name', 'side', 'phone', 'seats', 'openedAt', 'addedAt', 'link'],
  Replies: ['wedding', 'guestCode', 'name', 'attending', 'seats', 'meal', 'note', 'updatedAt']
};
var STAGES = ['details', 'designing', 'preview', 'approved', 'live'];
/* Invitation designs a wedding can use (the "template" column in Weddings). Blank means velvet-court. */
var TEMPLATES = ['velvet-court', 'jewel-box', 'velvet-box'];

/* ---------------- Menu and setup ---------------- */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Unveil')
    .addItem('Set up the sheets', 'setup')
    .addItem('Fill codes and links', 'fillCodes')
    .addToUi();
}

/** Creates the three tabs with their headers. Safe to run again. */
function setup() {
  var ss = SpreadsheetApp.getActive();
  Object.keys(TABS).forEach(function (name) {
    var sh = ss.getSheetByName(name) || ss.insertSheet(name);
    var head = TABS[name];
    sh.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold');
    sh.setFrozenRows(1);
    sh.getRange(2, 1, Math.max(1, sh.getMaxRows() - 1), head.length).setNumberFormat('@'); // keep everything as plain text
  });
  var w = ss.getSheetByName('Weddings');
  var tcol = TABS.Weddings.indexOf('template') + 1; // a dropdown so each wedding picks its design
  w.getRange(2, tcol, Math.max(1, w.getMaxRows() - 1), 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(TEMPLATES, true).setAllowInvalid(false).build());
  if (w.getLastRow() < 2) {
    w.getRange(2, 1, 1, TABS.Weddings.length).setValues([[
      'lara-karim', '', 'Lara', 'Karim', '2027-06-12 17:00', 'Asia/Beirut', 'Byblos · Lebanon', 'The Harbour Terrace', 'Old Port, Byblos, Lebanon', 'Byblos Old Port, Lebanon', 'Valet parking at the port entrance. A shuttle leaves Beirut at 15:45.',
      'Dear family & friends,\nafter seven years, two cities\nand one very nervous proposal,\nwe would love you beside us\nas we begin forever.',
      '17:00 | The ceremony | St. John the Baptist Church\n19:30 | The zaffe | Drums, dabke and our grand entrance\n20:30 | Dinner | By the old harbour\n23:30 | The cake | And we dance until late',
      'Black tie', 'Kindly leave white to the bride.', 'A long gown in wine, gold or blush', 'A dark suit or tuxedo',
      '#3a0812, #6e1423, #a3343f, #c99a94, #d8b67a',
      'Gifts | Your presence is our gift. A wishing well will be at the venue.\nChildren | This evening is for adults only.',
      'Meat, Fish, Vegetarian', '1 May 2027', 'details', '', '', '', '', '', 'velvet-court'
    ]]);
    var g = ss.getSheetByName('Guests');
    g.getRange(2, 1, 3, 6).setValues([
      ['lara-karim', '', 'Uncle Georges', "Groom's family", '', '4'],
      ['lara-karim', '', 'Nadine and Tony', "Bride's family", '', '2'],
      ['lara-karim', '', 'Rami', 'Friends', '', '1']
    ]);
  }
  fillCodes();
}

/** Gives every wedding a private couple code and every guest a personal code, and writes their links. */
function fillCodes() {
  var w = sheet('Weddings'), wd = w.getDataRange().getValues(), wh = wd[0];
  for (var i = 1; i < wd.length; i++) {
    var slug = String(wd[i][wh.indexOf('slug')]).trim();
    if (!slug) continue;
    if (!wd[i][wh.indexOf('coupleCode')]) w.getRange(i + 1, wh.indexOf('coupleCode') + 1).setValue(newCode(14));
    if (!wd[i][wh.indexOf('stage')]) w.getRange(i + 1, wh.indexOf('stage') + 1).setValue('details');
    var code = w.getRange(i + 1, wh.indexOf('coupleCode') + 1).getValue();
    w.getRange(i + 1, wh.indexOf('coupleLink') + 1).setValue(SITE + '/couple.html?t=' + code);
    w.getRange(i + 1, wh.indexOf('sharedLink') + 1).setValue(SITE + '/invite.html?w=' + slug);
  }
  var g = sheet('Guests'), gd = g.getDataRange().getValues(), gh = gd[0];
  for (var j = 1; j < gd.length; j++) {
    var ws = String(gd[j][gh.indexOf('wedding')]).trim();
    if (!ws || !String(gd[j][gh.indexOf('name')]).trim()) continue;
    var c = String(gd[j][gh.indexOf('code')]).trim();
    if (!c) { c = newCode(8); g.getRange(j + 1, gh.indexOf('code') + 1).setValue(c); }
    if (!gd[j][gh.indexOf('seats')]) g.getRange(j + 1, gh.indexOf('seats') + 1).setValue('1');
    g.getRange(j + 1, gh.indexOf('link') + 1).setValue(SITE + '/invite.html?w=' + ws + '&g=' + c);
  }
}

/* ---------------- Web app: reading ---------------- */

function doGet(e) {
  var p = (e && e.parameter) || {};
  try {
    if (p.a === 'invite') return json(invite(p.w, p.g));
    if (p.a === 'couple') return json(couple(p.t));
    return json({ ok: true, service: 'unveil' });
  } catch (err) { return json({ error: String(err.message || err) }); }
}

/** What a guest's invitation needs. Never includes the couple's private code or other guests. */
function invite(slug, code) {
  var w = weddingBy('slug', slug);
  if (!w) return { error: 'not_found' };
  var guest = null, reply = null;
  if (code) {
    var g = rows('Guests').filter(function (r) { return r.wedding === w.slug && r.code === String(code); })[0];
    if (!g) return { error: 'not_found' };
    guest = { name: g.name, seats: Number(g.seats) || 1 };
    var rp = rows('Replies').filter(function (r) { return r.wedding === w.slug && r.guestCode === g.code; })[0];
    if (rp) reply = { attending: rp.attending === 'yes', seats: Number(rp.seats) || 0, meal: rp.meal, note: rp.note };
  }
  return { wedding: publicWedding(w), guest: guest, reply: reply };
}

/** Everything for the couple's private page. */
function couple(token) {
  var w = weddingBy('coupleCode', token);
  if (!w || !token) return { error: 'not_found' };
  var replies = rows('Replies').filter(function (r) { return r.wedding === w.slug; });
  var byCode = {};
  replies.forEach(function (r) { if (r.guestCode) byCode[r.guestCode] = r; });
  var guests = rows('Guests').filter(function (r) { return r.wedding === w.slug && r.name; }).map(function (g) {
    var r = byCode[g.code];
    return { code: g.code, name: g.name, side: g.side, phone: g.phone, seats: Number(g.seats) || 1, openedAt: g.openedAt,
      link: SITE + '/invite.html?w=' + w.slug + '&g=' + g.code,
      reply: r ? { attending: r.attending === 'yes', seats: Number(r.seats) || 0, meal: r.meal, note: r.note, updatedAt: r.updatedAt } : null };
  });
  var shared = replies.filter(function (r) { return !r.guestCode; }).map(function (r) {
    return { name: r.name, attending: r.attending === 'yes', seats: Number(r.seats) || 0, meal: r.meal, note: r.note, updatedAt: r.updatedAt };
  });
  var pw = publicWedding(w);
  pw.stage = STAGES.indexOf(w.stage) >= 0 ? w.stage : 'details';
  pw.approvedAt = w.approvedAt; pw.changeRequest = w.changeRequest; pw.changeRequestAt = w.changeRequestAt;
  pw.sharedLink = SITE + '/invite.html?w=' + w.slug;
  return { wedding: pw, guests: guests, shared: shared };
}

function publicWedding(w) {
  var raw = String(w.date).trim();
  var start = /T\d\d:\d\d/.test(raw) ? new Date(raw) : Utilities.parseDate(raw, w.timeZone || 'Asia/Beirut', 'yyyy-MM-dd HH:mm');
  return {
    slug: w.slug, partner1: w.partner1, partner2: w.partner2, start: start.toISOString(), timeZone: w.timeZone || 'Asia/Beirut',
    city: w.city, venueName: w.venueName, venueAddress: w.venueAddress, mapsQuery: w.mapsQuery || (w.venueName + ', ' + w.venueAddress), venueNote: w.venueNote,
    letter: lines(w.letter), schedule: lines(w.schedule).map(function (l) { var p = l.split('|'); return { time: (p[0] || '').trim(), title: (p[1] || '').trim(), detail: p.slice(2).join('|').trim() }; }).filter(function (s) { return s.title; }),
    dressTitle: w.dressTitle, dressText: w.dressText, dressHer: w.dressHer, dressHim: w.dressHim,
    palette: list(w.palette).filter(function (c) { return /^#[0-9a-fA-F]{3,8}$/.test(c); }),
    notes: lines(w.notes).map(function (l) { var p = l.split('|'); return { title: (p[0] || '').trim(), text: p.slice(1).join('|').trim() }; }).filter(function (n) { return n.title; }),
    meals: list(w.meals), replyBy: w.replyBy,
    template: String(w.template || '').trim().toLowerCase() || 'velvet-court'
  };
}

/* ---------------- Web app: writing ---------------- */

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var b = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (b.a === 'rsvp') return json(saveReply(b));
    if (b.a === 'opened') return json(markOpened(b));
    if (b.a === 'addGuests') return json(addGuests(b));
    if (b.a === 'removeGuest') return json(removeGuest(b));
    if (b.a === 'approve') return json(setApproval(b, true));
    if (b.a === 'changes') return json(setApproval(b, false));
    return json({ error: 'unknown_action' });
  } catch (err) { return json({ error: String(err.message || err) }); }
  finally { try { lock.releaseLock(); } catch (x) {} }
}

function saveReply(b) {
  var w = weddingBy('slug', b.w);
  if (!w) return { error: 'This invitation link is no longer valid.' };
  var guest = null;
  if (b.g) {
    guest = rows('Guests').filter(function (r) { return r.wedding === w.slug && r.code === String(b.g); })[0];
    if (!guest) return { error: 'This personal link is no longer valid.' };
  }
  var name = clip(guest ? guest.name : b.name, 120);
  if (!name) return { error: 'Please add your name so the couple knows who replied.' };
  var attending = b.attending === 'yes' ? 'yes' : b.attending === 'no' ? 'no' : '';
  if (!attending) return { error: 'Please choose whether you can come.' };
  var max = guest ? (Number(guest.seats) || 1) : 10;
  var seats = attending === 'yes' ? Math.max(1, Math.min(max, Math.round(Number(b.seats) || 1))) : 0;
  var meal = attending === 'yes' && list(w.meals).indexOf(String(b.meal)) >= 0 ? String(b.meal) : '';
  var row = [w.slug, guest ? guest.code : '', name, attending, String(seats), meal, clip(b.note, 1000), new Date().toISOString()];
  var sh = sheet('Replies');
  if (guest) {
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === w.slug && String(data[i][1]) === guest.code) { sh.getRange(i + 1, 1, 1, row.length).setValues([row]); return { ok: true, attending: attending, seats: seats, name: name }; }
    }
  }
  sh.appendRow(row);
  return { ok: true, attending: attending, seats: seats, name: name };
}

function markOpened(b) {
  var sh = sheet('Guests'), d = sh.getDataRange().getValues(), h = d[0];
  for (var i = 1; i < d.length; i++) {
    if (d[i][h.indexOf('wedding')] === b.w && String(d[i][h.indexOf('code')]) === String(b.g) && !d[i][h.indexOf('openedAt')]) {
      sh.getRange(i + 1, h.indexOf('openedAt') + 1).setValue(new Date().toISOString());
    }
  }
  return { ok: true };
}

function addGuests(b) {
  var w = weddingBy('coupleCode', b.t);
  if (!w || !b.t) return { error: 'This private page is no longer valid.' };
  var out = [];
  lines(b.list).slice(0, 500).forEach(function (l) {
    var parts = l.split(/\t|,/).map(function (s) { return s.trim(); }), name = parts[0];
    if (!name) return;
    var seats = 1, seatsSet = false, phone = '', side = '';
    parts.slice(1).forEach(function (p) {
      if (!p) return;
      var digits = p.replace(/[\s+()-]/g, '');
      if (/^\d{1,2}$/.test(digits) && !seatsSet && +digits > 0 && +digits <= 30) { seats = +digits; seatsSet = true; }
      else if (/^\d{6,15}$/.test(digits)) phone = p; else side = p;
    });
    var code = newCode(8);
    out.push([w.slug, code, clip(name, 120), clip(side, 60), clip(phone, 40), String(seats), '', new Date().toISOString(), SITE + '/invite.html?w=' + w.slug + '&g=' + code]);
  });
  if (!out.length) return { error: 'Add at least one guest: one name per line.' };
  var sh = sheet('Guests');
  sh.getRange(sh.getLastRow() + 1, 1, out.length, out[0].length).setNumberFormat('@').setValues(out);
  return { ok: true, added: out.length };
}

function removeGuest(b) {
  var w = weddingBy('coupleCode', b.t);
  if (!w || !b.t) return { error: 'This private page is no longer valid.' };
  deleteWhere('Replies', function (r) { return r[0] === w.slug && String(r[1]) === String(b.code); });
  deleteWhere('Guests', function (r) { return r[0] === w.slug && String(r[1]) === String(b.code); });
  return { ok: true };
}

/** The couple approves the preview, or asks for changes (only while a preview is waiting). */
function setApproval(b, approve) {
  var sh = sheet('Weddings'), d = sh.getDataRange().getValues(), h = d[0];
  for (var i = 1; i < d.length; i++) {
    if (String(d[i][h.indexOf('coupleCode')]) !== String(b.t) || !b.t) continue;
    if (d[i][h.indexOf('stage')] !== 'preview') return { error: 'There’s no preview waiting for your approval right now.' };
    var now = new Date().toISOString();
    if (approve) {
      sh.getRange(i + 1, h.indexOf('stage') + 1).setValue('approved');
      sh.getRange(i + 1, h.indexOf('approvedAt') + 1).setValue(now);
    } else {
      var text = clip(b.text, 2000);
      if (!text) return { error: 'Tell us what you’d like to change.' };
      sh.getRange(i + 1, h.indexOf('stage') + 1).setValue('designing');
      sh.getRange(i + 1, h.indexOf('changeRequest') + 1).setValue(text);
      sh.getRange(i + 1, h.indexOf('changeRequestAt') + 1).setValue(now);
    }
    return { ok: true };
  }
  return { error: 'This private page is no longer valid.' };
}

/* ---------------- Helpers ---------------- */

function sheet(name) { var s = SpreadsheetApp.getActive().getSheetByName(name); if (!s) throw new Error('Run "Set up the sheets" first.'); return s; }
function rows(name) {
  var d = sheet(name).getDataRange().getValues(), h = d[0];
  return d.slice(1).map(function (r) { var o = {}; h.forEach(function (k, i) { o[k] = r[i] instanceof Date ? r[i].toISOString() : String(r[i]); }); return o; });
}
function weddingBy(key, value) {
  if (!value) return null;
  return rows('Weddings').filter(function (r) { return r[key] === String(value).trim() && r.slug; })[0] || null;
}
function deleteWhere(name, test) {
  var sh = sheet(name), d = sh.getDataRange().getValues();
  for (var i = d.length - 1; i >= 1; i--) if (test(d[i])) sh.deleteRow(i + 1);
}
function lines(s) { return String(s || '').split('\n').map(function (x) { return x.trim(); }).filter(String); }
function list(s) { return String(s || '').split(',').map(function (x) { return x.trim(); }).filter(String); }
function clip(s, n) { return String(s || '').trim().slice(0, n); }
function newCode(n) {
  var abc = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789', out = '';
  for (var i = 0; i < n; i++) out += abc.charAt(Math.floor(Math.random() * abc.length));
  return out;
}
function json(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
