// Builds City4Christ-UI-UX-Redesign.pptx (editable) from the redesign content.
// Usage: node build-pptx.js <dir-with-cropped-pngs>
// Crops come from mockups.webp (see crop regions in README comment below).
const path = require('path');
const pptxgen = require('pptxgenjs');

const IMG = process.argv[2] || path.join(__dirname, 'crops');
const img = (n) => path.join(IMG, n + '.png');

const C = {
  navy: '160D2E', navy2: '241647', purple: '6B3FE0', purple2: '8A5CF6', gold: 'F4B73B',
  lav: 'F3EFFD', lav2: 'E6DEFB', ink: '1D1530', muted: '6A6380', line: 'DDD5F2',
  white: 'FFFFFF', paleGold: 'FDECC5', goldInk: '8A5A00', pillInk: '4B2BB0', softInk: 'CFC6EA',
};
const FONT = 'Calibri';
const MONO = 'Courier New';
const W = 13.333, H = 7.5, M = 0.6;

const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE';
pres.title = 'City4Christ Mobile & Desktop UI/UX Redesign';
pres.company = 'City4Christ';

const shadow = () => ({ type: 'outer', color: '281A5A', blur: 14, offset: 4, angle: 90, opacity: 0.22 });
const cardShadow = () => ({ type: 'outer', color: '281A5A', blur: 8, offset: 1, angle: 90, opacity: 0.08 });

function text(slide, t, o) {
  slide.addText(t, Object.assign({ isTextBox: true, fontFace: FONT, color: C.ink, margin: 0, valign: 'top' }, o));
}

function base(opts) {
  const s = pres.addSlide();
  const dark = !!opts.dark;
  s.background = { color: dark ? C.navy : (opts.soft ? C.lav : C.white) };
  if (dark) {
    s.addShape(pres.shapes.OVAL, { x: 8.2, y: -3.2, w: 8, h: 6.5, fill: { color: '3A1F7A', transparency: 35 }, line: { type: 'none' } });
  }
  if (opts.kicker) text(s, opts.kicker.toUpperCase(), { x: M, y: 0.45, w: 9, h: 0.3, fontSize: 11, bold: true, charSpacing: 3, color: dark ? C.gold : C.purple });
  if (opts.title) text(s, opts.title, { x: M, y: 0.75, w: 12, h: 0.7, fontSize: 32, bold: true, color: dark ? C.white : C.ink });
  if (opts.num) {
    const fc = dark ? '9A8FC4' : C.muted;
    text(s, 'City4Christ UI/UX Redesign', { x: M, y: 7.08, w: 5, h: 0.25, fontSize: 9, color: fc });
    text(s, String(opts.num), { x: W - M - 1, y: 7.08, w: 1, h: 0.25, fontSize: 9, color: fc, align: 'right' });
  }
  if (opts.notes) s.addNotes(opts.notes);
  s._dark = dark;
  return s;
}

// Card with optional title and body (string or runs array).
function card(s, x, y, w, h, o = {}) {
  const dark = o.dark ?? s._dark;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h, rectRadius: 0.14,
    fill: { color: o.fill || (dark ? '2A1E4E' : C.white) },
    line: o.border ? { color: o.border, width: 1.5 } : (o.noLine ? { type: 'none' } : { color: dark ? '3C2F66' : C.line, width: 0.75 }),
    shadow: dark || o.noShadow ? undefined : cardShadow(),
  });
  let cy = y + 0.16;
  if (o.kicker) { text(s, o.kicker.toUpperCase(), { x: x + 0.2, y: cy, w: w - 0.4, h: 0.22, fontSize: 9.5, bold: true, charSpacing: 2, color: dark ? C.gold : C.purple }); cy += 0.26; }
  if (o.title) { text(s, o.title, { x: x + 0.2, y: cy, w: w - 0.4, h: 0.3, fontSize: o.titleSize || 13, bold: true, color: o.titleColor || (dark ? C.white : C.ink) }); cy += (o.titleSize || 13) > 16 ? 0.42 : 0.32; }
  if (o.body) text(s, o.body, { x: x + 0.2, y: cy, w: w - 0.4, h: y + h - cy - 0.12, fontSize: o.bodySize || 11.5, color: o.bodyColor || (dark ? C.softInk : '3B3452'), lineSpacingMultiple: 1.1 });
  return cy;
}

// Flowing pill badges; returns y below the last row.
function pills(s, x, y, maxW, items, o = {}) {
  const size = o.size || 10;
  const hgt = 0.28 + (size - 10) * 0.02;
  let cx = x, cy = y;
  for (const it of items) {
    const label = typeof it === 'string' ? it : it.t;
    const gold = typeof it === 'object' && it.gold;
    const emoji = (label.match(/\p{Extended_Pictographic}/gu) || []).length;
    const w = (label.length + emoji) * size * 0.0078 + 0.3;
    if (cx + w > x + maxW && cx > x) { cx = x; cy += hgt + 0.08; }
    const dark = s._dark && !o.light;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: cx, y: cy, w, h: hgt, rectRadius: hgt / 2,
      fill: { color: gold ? C.paleGold : (dark ? '3A2D63' : C.lav2) }, line: { type: 'none' } });
    text(s, label, { x: cx, y: cy, w, h: hgt, fontSize: size, bold: true, align: 'center', valign: 'middle', color: gold ? C.goldInk : (dark ? C.white : C.pillInk) });
    cx += w + 0.08;
  }
  return cy + hgt;
}

function mono(s, t, x, y, w, h, o = {}) {
  text(s, t, Object.assign({ x, y, w, h, fontFace: MONO, fontSize: 10, color: s._dark ? 'E3DCFF' : '3A2D63', lineSpacingMultiple: 1.05 }, o));
}

// Phone screenshot sized to height hIn; returns width.
function phone(s, name, ratio, x, y, hIn, cap = 'Mobile') {
  const w = hIn * ratio;
  s.addImage({ path: img(name), x, y, w, h: hIn, shadow: shadow(), altText: `City4Christ ${name} mobile screen` });
  if (cap) text(s, cap.toUpperCase(), { x, y: y + hIn + 0.08, w, h: 0.22, fontSize: 9, bold: true, charSpacing: 2, color: C.muted, align: 'center' });
  return w;
}
const R = { home: 312 / 676, groups: 286 / 676, profile: 250 / 676, sermons: 278 / 676, prayer: 292 / 676,
  dHome: 481 / 318, dGroups: 358 / 318, dProfile: 335 / 318, dSermons: 360 / 318, full: 1536 / 1024 };

// ---------- 1. Cover ----------
{
  const s = base({ dark: true, notes: 'Title slide. The redesign turns separate feature mockups into one unified church community platform across mobile and desktop.' });
  text(s, 'UI/UX REDESIGN · MOBILE & DESKTOP', { x: M, y: 1.9, w: 5, h: 0.3, fontSize: 11, bold: true, charSpacing: 3, color: C.gold });
  text(s, 'City4Christ\nMember App', { x: M, y: 2.25, w: 5, h: 1.7, fontSize: 48, bold: true, color: C.white, lineSpacingMultiple: 0.95 });
  text(s, 'One unified church community platform for the Bible, fellowship, prayer, ministry groups, sermons, events and member relationships.',
    { x: M, y: 4.05, w: 4.7, h: 1.0, fontSize: 14, color: C.softInk, lineSpacingMultiple: 1.15 });
  pills(s, M, 5.25, 4.8, ['Dashboard', 'Ministry Groups', 'Profile', 'Sermons & Media', 'Prayer Wall']);
  const iw = 6.9, ih = iw / R.full;
  s.addImage({ path: img('full'), x: W - M - iw + 0.1, y: (H - ih) / 2, w: iw, h: ih, shadow: shadow(), altText: 'City4Christ mobile and desktop mockups' });
  text(s, 'City4Christ · Design Presentation', { x: M, y: 7.08, w: 5, h: 0.25, fontSize: 9, color: '9A8FC4' });
}

// ---------- 2. Vision ----------
{
  const s = base({ kicker: '01 · Design Vision', title: 'From separate feature mockups to one platform', num: 2 });
  text(s, 'The original screens read as individual feature mockups. The redesign should feel like one church social and community platform. It should be as easy to use as a modern social app, but built around faith and fellowship.',
    { x: M, y: 1.5, w: 10.5, h: 0.8, fontSize: 15, color: C.muted, lineSpacingMultiple: 1.15 });
  const items = [
    ['Unified', 'One design system, one navigation model and shared components across every module.'],
    ['Participatory', 'Members pray, post, join and RSVP, not only read. Actions like “I Prayed For This” record real participation.'],
    ['Word-centred', 'Scripture, devotionals and sermons appear everywhere, starting with the verse on the home screen.'],
    ['Device-native', 'Mobile and desktop are separate layouts built on one design system. Desktop is not a stretched phone screen.'],
  ];
  const gw = (W - 2 * M - 3 * 0.25) / 4;
  items.forEach(([t, b], i) => {
    const x = M + i * (gw + 0.25);
    card(s, x, 2.45, gw, 2.2, { noShadow: true });
    s.addShape(pres.shapes.OVAL, { x: x + 0.2, y: 2.62, w: 0.42, h: 0.42, fill: { color: C.lav2 }, line: { type: 'none' } });
    text(s, String(i + 1), { x: x + 0.2, y: 2.62, w: 0.42, h: 0.42, fontSize: 13, bold: true, color: C.purple, align: 'center', valign: 'middle' });
    text(s, t, { x: x + 0.2, y: 3.18, w: gw - 0.4, h: 0.3, fontSize: 14, bold: true });
    text(s, b, { x: x + 0.2, y: 3.52, w: gw - 0.4, h: 1.05, fontSize: 11.5, color: '3B3452', lineSpacingMultiple: 1.1 });
  });
  card(s, M, 4.95, W - 2 * M, 1.8, { fill: C.lav, noLine: true, noShadow: true, title: 'The five core modules' });
  pills(s, M + 0.2, 5.5, W - 2 * M - 0.4, ['1 · Home / Member Dashboard', '2 · Ministry Groups', '3 · Member Profile', '4 · Sermons & Media', '5 · Prayer Wall'], { size: 11 });
  text(s, 'Each one has a mobile composition and a desktop counterpart.', { x: M + 0.2, y: 6.1, w: 8, h: 0.3, fontSize: 11.5, color: C.muted });
}

// ---------- 3. Home mobile ----------
{
  const s = base({ soft: true, kicker: '02 · Home / Member Dashboard', title: 'A daily starting point', num: 3 });
  const pw = phone(s, 'home', R.home, M, 1.6, 5.05);
  const x = M + pw + 0.5, w = W - M - x;
  const rows = [
    ['Header', 'City4Christ logo · Search · Notifications · Member avatar'],
    ['Hero / Daily Scripture', 'Scripture of the day, Bible reference, a Listen button and a Daily Devotional button'],
    ['Quick Actions', null],
    ['Upcoming Events', [{ text: 'Date · Title · Time · Location or Online · ' }, { text: 'RSVP / Remind Me', options: { bold: true } }]],
    ['Fellowship Feed', 'Member posts with reactions, comments, share and a more menu'],
  ];
  const rh = 0.9, gap = 0.12;
  rows.forEach(([t, b], i) => {
    const y = 1.6 + i * (rh + gap);
    card(s, x, y, w, rh, { title: t, body: b || undefined });
    if (!b) pills(s, x + 0.2, y + 0.48, w - 0.4, ['🙏 Prayer Wall', '🎙 Sermons', '👥 Groups', '📖 Bible', '📅 Events']);
  });
}

// ---------- 4. Home desktop ----------
{
  const s = base({ kicker: '02 · Home / Member Dashboard, Desktop', title: 'Three-column dashboard', num: 4 });
  const ih = 3.55, iw = ih * R.dHome;
  s.addImage({ path: img('dHome'), x: (W - iw) / 2, y: 1.6, w: iw, h: ih, shadow: shadow(), altText: 'Desktop dashboard' });
  const cw = (W - 2 * M - 2 * 0.3) / 3;
  [['Left · Sidebar', 'Home · Bible / Word · Sermons · Ministry Groups · Events · Prayer Wall · Chat · Members · Notifications'],
   ['Center · Content', 'Scripture hero · Events · Fellowship feed'],
   ['Right · Context', 'Upcoming events · Prayer activity · Suggested groups · Online members']]
    .forEach(([t, b], i) => card(s, M + i * (cw + 0.3), 5.45, cw, 1.35, { title: t, body: b }));
}

// ---------- 5. Groups ----------
{
  const s = base({ soft: true, kicker: '03 · Ministry Groups', title: 'Search, filter, compact cards', num: 5 });
  const pw = phone(s, 'groups', R.groups, M, 1.6, 5.05);
  const x = M + pw + 0.5, w = W - M - x, hw = (w - 0.25) / 2;
  text(s, 'Replace the original large cards with a cleaner layout built on search, filters and compact cards.', { x, y: 1.6, w, h: 0.35, fontSize: 13, color: C.muted });
  card(s, x, 2.05, hw, 1.3, { title: 'Tabs & search' });
  mono(s, 'All Groups | My Groups | Nearby\n\n🔍 Search groups...', x + 0.2, 2.45, hw - 0.4, 0.8);
  card(s, x + hw + 0.25, 2.05, hw, 1.3, { title: 'Filters' });
  pills(s, x + hw + 0.45, 2.45, hw - 0.4, ['Ministry', 'Age group', 'Gender', 'Location', 'Meeting day', 'Online / physical']);
  card(s, x, 3.5, w, 1.55, { title: 'Group card, for example Youth Explosion' });
  const L = ['Group image', 'Leader', 'Phone / contact', 'Meeting day & time'], Rr = ['Member count', 'Short description', 'View Group · Join Group'];
  const bl = (arr) => arr.map((t, i) => ({ text: t, options: { bullet: { indent: 14 }, breakLine: i < arr.length - 1, bold: t.startsWith('View') } }));
  text(s, bl(L), { x: x + 0.2, y: 3.85, w: hw - 0.3, h: 1.1, fontSize: 11.5, color: '3B3452', paraSpaceAfter: 2 });
  text(s, bl(Rr), { x: x + hw + 0.25, y: 3.85, w: hw - 0.3, h: 1.1, fontSize: 11.5, color: '3B3452', paraSpaceAfter: 2 });
  card(s, x, 5.2, w, 1.45, { title: 'Desktop', body: 'A two-column card grid. A right panel shows group information: leader, meeting schedule, location, members and upcoming activities.' });
}

// ---------- 6. Group detail ----------
{
  const s = base({ kicker: '03 · Ministry Groups, Detail & Desktop', title: 'Every group gets a home', num: 6 });
  card(s, M, 1.6, 4.0, 5.2, { fill: C.lav, noLine: true, noShadow: true, title: 'Group detail page (mobile)' });
  mono(s, '[ Cover Image ]\n\nYouth Explosion\nYouth Ministry\n\nLeader: Youth Minister\nFriday • 7:00 PM\n156 Members\n\n[ Join Group ]\n\nAbout · Group Feed · Members\nEvents · Discussion · Media',
    M + 0.25, 2.05, 3.55, 4.6, { fontSize: 11.5 });
  const iw = 6.9, ih = iw / R.dGroups, x = M + 4.0 + 0.5 + (W - M - (M + 4.5) - iw) / 2;
  s.addImage({ path: img('dGroups'), x, y: 1.6, w: iw, h: ih, shadow: shadow(), altText: 'Desktop ministry groups grid' });
  text(s, 'DESKTOP · TWO-COLUMN GROUP GRID', { x, y: 1.6 + ih + 0.1, w: iw, h: 0.22, fontSize: 9, bold: true, charSpacing: 2, color: C.muted, align: 'center' });
}

// ---------- 7. Profile ----------
{
  const s = base({ soft: true, kicker: '04 · Member Profile', title: 'A professional community profile', num: 7 });
  const pw = phone(s, 'profile', R.profile, M, 1.6, 5.05);
  const x = M + pw + 0.5, w = W - M - x, hw = (w - 0.25) / 2;
  card(s, x, 1.6, hw, 1.25, { title: 'Identity', body: [{ text: 'Cover photo, profile photo, name, ministry and a personal verse. Counts for posts, followers and following. ' }, { text: 'Edit Profile', options: { bold: true } }], bodySize: 11 });
  card(s, x + hw + 0.25, 1.6, hw, 1.25, { title: 'Ministry badges' });
  pills(s, x + hw + 0.45, 2.0, hw - 0.4, [{ t: '🏅 Leader', gold: true }, '🎵 Worship Team', '🌍 Outreach']);
  card(s, x, 2.98, hw, 1.05, { title: 'Interests' });
  pills(s, x + 0.2, 3.35, hw - 0.4, ['Bible Study', 'New Marrieds', 'Discipleship', 'Music', 'Youth']);
  card(s, x + hw + 0.25, 2.98, hw, 1.05, { title: 'Profile tabs' });
  mono(s, 'Posts | Media | Groups | Events', x + hw + 0.45, 3.4, hw - 0.4, 0.3, { fontSize: 11 });
  card(s, x, 4.16, w, 2.5, { title: 'Desktop layout' });
  mono(s, '┌──────────────────────────────────────────────┐\n│ Cover Image                                  │\n├───────┬───────────────────┬──────────────────┤\n│ Photo │ Name · Ministry   │   Edit Profile   │\n├───────┴───────────────────┴──────────────────┤\n│ Posts  ·  Followers  ·  Following            │\n├──────────────┬───────────────────────────────┤\n│ Badges       │ About                         │\n│ Interests    │ Recent Posts                  │\n│ Groups       │ Media                         │\n└──────────────┴───────────────────────────────┘',
    x + 0.2, 4.5, w - 0.4, 2.1, { fontSize: 9.5, lineSpacingMultiple: 0.95 });
}

// ---------- 8. Sermons ----------
{
  const s = base({ soft: true, kicker: '05 · Sermons & Media / Word Hub', title: 'A complete Christian media library', num: 8 });
  const pw = phone(s, 'sermons', R.sermons, M, 1.6, 5.05);
  const x = M + pw + 0.5, w = W - M - x, hw = (w - 0.25) / 2;
  card(s, x, 1.6, hw, 0.9, { title: 'Navigation' });
  mono(s, 'Featured | Series | Topics | Pastors', x + 0.2, 2.0, hw - 0.4, 0.3, { fontSize: 11 });
  card(s, x + hw + 0.25, 1.6, hw, 0.9, { title: 'Library filters' });
  pills(s, x + hw + 0.45, 1.98, hw - 0.4, ['Topic', 'Pastor', 'Date', 'Series']);
  card(s, x, 2.62, hw, 1.15, { title: 'Featured series', bodySize: 11, body: [{ text: 'A large promotional card, for example ' }, { text: 'The Book of Acts', options: { bold: true } }, { text: ' with Pastor Dave and Pastor Tim, and a Play Series button.' }] });
  card(s, x + hw + 0.25, 2.62, hw, 1.15, { title: 'Continue listening' });
  mono(s, '▶ Finding Peace · Pastor Dave\n████████░░░░  12:35 / 25:00', x + hw + 0.45, 3.0, hw - 0.4, 0.6, { fontSize: 11 });
  card(s, x, 3.89, w, 1.2, { title: 'Recommended features' });
  pills(s, x + 0.2, 4.25, w - 0.4, ['Audio player', 'Video player', 'Download', 'Share', 'Save', 'Personal notes', 'Bible references', 'Transcript', 'Related sermons']);
  card(s, x, 5.21, w, 1.45, { title: 'Desktop: full media dashboard with a fixed player' });
  mono(s, 'Featured Series → Continue Listening → Latest → Popular → Series → Topics\n\n▶ Finding Peace · Pastor Dave\n00:12:35 ━━━━━━━━━━━━━━ 00:25:00      ↶ 10s   ▶   10s ↷',
    x + 0.2, 5.55, w - 0.4, 1.05, { fontSize: 10 });
}

// ---------- 9. Prayer wall ----------
{
  const s = base({ soft: true, kicker: '06 · Prayer Wall', title: 'A major feature, not just another feed', num: 9,
    notes: 'The key improvement is "I Prayed For This": members record that they actually prayed, rather than simply liking a request.' });
  const pw = phone(s, 'prayer', R.prayer, M, 1.6, 5.05);
  const x = M + pw + 0.5, w = W - M - x, hw = (w - 0.25) / 2;
  card(s, x, 1.6, hw, 1.4, { title: 'Prayer composer', bodySize: 11, body: [{ text: '“Share a Prayer Request. We believe in the power of prayer.” A text field (500 characters), a privacy selector and a ' }, { text: 'Post Prayer Request', options: { bold: true } }, { text: ' button.' }] });
  card(s, x + hw + 0.25, 1.6, hw, 1.4, { title: 'Privacy options' });
  pills(s, x + hw + 0.45, 2.0, hw - 0.4, ['Public', 'Church Community', 'My Ministry Group', 'Pastor Only', 'Anonymous']);
  card(s, x, 3.12, w, 1.05, { fill: 'FFFAF0', border: C.gold, title: 'The key interaction: 🙏 I PRAYED FOR THIS', bodySize: 11.5,
    body: 'Members don’t just like a prayer. They record that they actually prayed. The count shows the requester how many people are praying for them.' });
  card(s, x, 4.3, hw, 2.36, { title: 'Prayer card' });
  mono(s, 'Linda Mensah · 2 hours ago\nPray for my family as we travel\nthis weekend. 🙏\n\n🙏 I PRAYED FOR THIS (24)\n❤️ 12        💬 3', x + 0.2, 4.68, hw - 0.4, 1.9, { fontSize: 10.5 });
  card(s, x + hw + 0.25, 4.3, hw, 2.36, { title: 'Tabs' });
  mono(s, 'Prayer Feed | Answered Prayers', x + hw + 0.45, 4.68, hw - 0.4, 0.3, { fontSize: 10.5 });
  text(s, 'Answered prayer', { x: x + hw + 0.45, y: 5.1, w: hw - 0.4, h: 0.3, fontSize: 13, bold: true });
  mono(s, '🙏 Prayer Answered\n“God answered our prayer...”\n❤️ 24 people prayed · 💬 8', x + hw + 0.45, 5.45, hw - 0.4, 1.1, { fontSize: 10.5 });
}

// ---------- 10. Navigation ----------
{
  const s = base({ kicker: '07 · Navigation & Interaction Model', title: 'One creation button, two navigation patterns', num: 10 });
  const cw = (W - 2 * M - 0.35) / 2;
  card(s, M, 1.6, cw, 5.2, { fill: C.lav, noLine: true, noShadow: true, title: 'Mobile · 5-item bottom navigation', titleSize: 15 });
  // bottom nav mock
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M + 0.25, y: 2.15, w: cw - 0.5, h: 0.75, rectRadius: 0.18, fill: { color: C.white }, line: { color: C.line, width: 0.75 } });
  const nav = ['🏠 Home', '📖 Word', '+', '🙏 Prayer', '💬 Chat'], nw = (cw - 0.5) / 5;
  nav.forEach((t, i) => {
    const cx = M + 0.25 + i * nw;
    if (t === '+') {
      s.addShape(pres.shapes.OVAL, { x: cx + nw / 2 - 0.3, y: 2.22, w: 0.6, h: 0.6, fill: { color: C.purple }, line: { type: 'none' } });
      text(s, '+', { x: cx + nw / 2 - 0.3, y: 2.22, w: 0.6, h: 0.6, fontSize: 24, bold: true, color: C.white, align: 'center', valign: 'middle' });
    } else text(s, t, { x: cx, y: 2.15, w: nw, h: 0.75, fontSize: 11.5, bold: true, align: 'center', valign: 'middle', color: i === 0 ? C.purple : C.ink });
  });
  text(s, [{ text: 'The center ' }, { text: '+', options: { bold: true } }, { text: ' is the main creation button. It opens a bottom sheet:' }],
    { x: M + 0.25, y: 3.1, w: cw - 0.5, h: 0.3, fontSize: 12, color: C.muted });
  // bottom sheet mock
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M + 0.25, y: 3.5, w: cw - 0.5, h: 2.55, rectRadius: 0.18, fill: { color: C.white }, line: { color: C.line, width: 0.75 } });
  text(s, 'Create', { x: M + 0.5, y: 3.62, w: 3, h: 0.3, fontSize: 13, bold: true });
  const opts = ['📝 Post', '🙏 Prayer Request', '📸 Photo', '🎥 Video', '📅 Event', '💬 Testimony'];
  opts.forEach((t, i) => {
    const col = i % 2, row = Math.floor(i / 2), bw = (cw - 1.0 - 0.2) / 2;
    const bx = M + 0.5 + col * (bw + 0.2), by = 4.02 + row * 0.62;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: bx, y: by, w: bw, h: 0.5, rectRadius: 0.12, fill: { color: C.lav }, line: { type: 'none' } });
    text(s, t, { x: bx + 0.15, y: by, w: bw - 0.3, h: 0.5, fontSize: 12, bold: true, valign: 'middle', color: C.pillInk });
  });
  text(s, 'Creation stays one tap away, so the rest of the interface stays clean.', { x: M + 0.25, y: 6.2, w: cw - 0.5, h: 0.3, fontSize: 11.5, color: C.muted });

  const dx = M + cw + 0.35;
  card(s, dx, 1.6, cw, 5.2, { fill: C.navy, noLine: true, noShadow: true, dark: true, title: 'Desktop · persistent left sidebar', titleSize: 15,
    body: 'Desktop does not use the mobile bottom navigation.' });
  const side = ['🏠 Home', '📖 Bible / Word', '🎙 Sermons', '👥 Ministry Groups', '📅 Events', '🙏 Prayer Wall', '💬 Chat', '👤 Members', '🔔 Notifications'];
  text(s, 'CITY4CHRIST', { x: dx + 0.25, y: 2.5, w: 3, h: 0.3, fontSize: 12, bold: true, charSpacing: 2, color: C.gold });
  side.forEach((t, i) => {
    const y = 2.88 + i * 0.33;
    if (i === 0) s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: dx + 0.2, y: y - 0.02, w: 2.6, h: 0.3, rectRadius: 0.08, fill: { color: C.purple }, line: { type: 'none' } });
    text(s, t, { x: dx + 0.32, y, w: 2.5, h: 0.26, fontSize: 11.5, color: C.white, valign: 'middle' });
  });
  text(s, '⚙ Settings', { x: dx + 0.32, y: 5.95, w: 2.5, h: 0.26, fontSize: 11.5, color: C.softInk });
  // top bar mock
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: dx + 3.1, y: 2.5, w: cw - 3.35, h: 0.5, rectRadius: 0.12, fill: { color: '2A1E4E' }, line: { color: '3C2F66', width: 0.75 } });
  text(s, '🔍 Search anything…', { x: dx + 3.25, y: 2.5, w: cw - 3.6, h: 0.5, fontSize: 11, color: C.softInk, valign: 'middle' });
  text(s, 'Top bar: search, notifications 🔔 and the member avatar 👤 with name.', { x: dx + 3.1, y: 3.15, w: cw - 3.35, h: 1.0, fontSize: 11.5, color: C.softInk, lineSpacingMultiple: 1.1 });
}

// ---------- 11. Design system ----------
{
  const s = base({ kicker: '08 · Design System', title: 'One system for every screen', num: 11 });
  text(s, 'Color', { x: M, y: 1.6, w: 3, h: 0.3, fontSize: 14, bold: true });
  const sw = [
    ['Deep Navy', C.navy, '#160D2E · primary'], ['Royal Purple', C.purple, '#6B3FE0 · actions'], ['Gold', C.gold, '#F4B73B · highlights'],
    ['Soft Lavender', C.lav2, '#E6DEFB · pills'], ['Light Lavender', C.lav, '#F3EFFD · desktop bg'], ['Purple 2', C.purple2, '#8A5CF6 · gradients'],
  ];
  const colW = (5.8 - 2 * 0.2) / 3;
  sw.forEach(([n, c, d], i) => {
    const x = M + (i % 3) * (colW + 0.2), y = 2.0 + Math.floor(i / 3) * 1.6;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: colW, h: 0.85, rectRadius: 0.12, fill: { color: c }, line: c === C.lav ? { color: C.line, width: 0.75 } : { type: 'none' } });
    text(s, n, { x, y: y + 0.92, w: colW, h: 0.24, fontSize: 11.5, bold: true });
    text(s, d, { x, y: y + 1.15, w: colW, h: 0.22, fontSize: 9.5, color: C.muted, fontFace: MONO });
  });
  text(s, 'Use very light lavender or white for desktop content areas, and deep navy or purple for selected dark sections.',
    { x: M, y: 5.3, w: 5.8, h: 0.6, fontSize: 11.5, color: C.muted });

  const x = M + 6.3, w = W - M - x;
  text(s, 'Components', { x, y: 1.6, w: 3, h: 0.3, fontSize: 14, bold: true });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 2.0, w: 1.9, h: 0.48, rectRadius: 0.12, fill: { color: C.purple }, line: { type: 'none' } });
  text(s, 'RSVP / Remind Me', { x, y: 2.0, w: 1.9, h: 0.48, fontSize: 11.5, bold: true, color: C.white, align: 'center', valign: 'middle' });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + 2.05, y: 2.0, w: 1.0, h: 0.48, rectRadius: 0.12, fill: { color: C.white }, line: { color: C.line, width: 1 } });
  text(s, 'Details', { x: x + 2.05, y: 2.0, w: 1.0, h: 0.48, fontSize: 11.5, bold: true, align: 'center', valign: 'middle' });
  pills(s, x + 3.2, 2.1, w - 3.2, [{ t: '🙏 I PRAYED FOR THIS (24)', gold: true }, 'Member'], { size: 9.5 });
  const g = [['Shape', '16–24px border radius · soft shadows · rounded avatars'], ['Touch', 'Large touch targets (44px minimum) · pill badges'],
    ['Feedback', 'Skeleton loading states · toast notifications'], ['Overlays', 'Modal dialogs on desktop · bottom sheets on mobile']];
  const gw = (w - 0.2) / 2;
  g.forEach(([t, b], i) => card(s, x + (i % 2) * (gw + 0.2), 2.85 + Math.floor(i / 2) * 1.3, gw, 1.15, { title: t, body: b, bodySize: 11 }));
  text(s, 'Use one icon set with a consistent stroke weight everywhere.', { x, y: 5.5, w, h: 0.3, fontSize: 11.5, color: C.muted });
}

// ---------- 12. Responsive ----------
{
  const s = base({ soft: true, kicker: '09 · Responsive Strategy', title: 'Mobile vs. tablet vs. desktop', num: 12 });
  text(s, 'Mobile and desktop should not be scaled versions of each other. Each breakpoint gets its own composition.',
    { x: M, y: 1.5, w: 11, h: 0.35, fontSize: 14, color: C.muted });
  const cols = [
    ['Mobile', '390–430px', ['Bottom navigation', 'Single-column cards', 'Swipeable sections', 'Bottom sheets', 'Center + create button']],
    ['Tablet', '768–1024px', ['Two-column layouts', 'Collapsible sidebar', 'Group grid with two cards per row', 'Media player docked at the bottom']],
    ['Desktop', '1280px+', ['Persistent sidebar', 'Two- to three-column dashboard', 'Large content areas', 'Fixed media player', 'Right-hand context panel']],
  ];
  const cw = (W - 2 * M - 2 * 0.3) / 3;
  cols.forEach(([k, bp, list], i) => {
    const x = M + i * (cw + 0.3);
    card(s, x, 2.0, cw, 2.75, { kicker: k, title: bp, titleSize: 22 });
    text(s, list.map((t, j) => ({ text: t, options: { bullet: { indent: 14 }, breakLine: j < list.length - 1 } })),
      { x: x + 0.2, y: 2.95, w: cw - 0.4, h: 1.7, fontSize: 11.5, color: '3B3452', paraSpaceAfter: 3 });
  });
  const shots = [['dHome', R.dHome], ['dGroups', R.dGroups], ['dProfile', R.dProfile], ['dSermons', R.dSermons]];
  const ih = 1.75, gap = 0.25;
  const total = shots.reduce((a, [, r]) => a + ih * r, 0) + gap * 3;
  let cx = (W - total) / 2;
  shots.forEach(([n, r]) => { s.addImage({ path: img(n), x: cx, y: 5.0, w: ih * r, h: ih, shadow: shadow(), altText: `Desktop ${n}` }); cx += ih * r + gap; });
}

// ---------- 13. App structure ----------
{
  const s = base({ kicker: '10 · Application Structure', title: 'Recommended information architecture', num: 13 });
  const trees = [
    'CITY4CHRIST\n├── Dashboard\n│   ├── Daily Scripture\n│   ├── Devotional\n│   ├── Quick Actions\n│   ├── Events\n│   └── Fellowship Feed\n├── Bible / Word\n│   ├── Bible\n│   ├── Devotionals\n│   ├── Reading Plans\n│   └── Bookmarks\n└── Sermons & Media\n    ├── Featured · Sermons\n    ├── Series · Topics\n    ├── Pastors\n    └── Audio Player',
    '├── Ministry Groups\n│   ├── All Groups\n│   ├── My Groups\n│   ├── Group Details\n│   ├── Group Feed\n│   ├── Group Events\n│   └── Members\n├── Prayer Wall\n│   ├── Prayer Feed\n│   ├── Submit Prayer\n│   ├── My Prayers\n│   └── Answered Prayers\n└── Events\n    ├── Upcoming · Calendar\n    └── RSVP · Reminders',
    '├── Community\n│   ├── Posts\n│   ├── Testimonies\n│   ├── Members\n│   └── Chat\n└── Profile\n    ├── Profile\n    ├── Badges\n    ├── Interests\n    ├── Posts\n    ├── Groups\n    └── Settings',
  ];
  const cw = (W - 2 * M - 2 * 0.3) / 3;
  trees.forEach((t, i) => {
    const x = M + i * (cw + 0.3);
    card(s, x, 1.6, cw, 5.2);
    mono(s, t, x + 0.25, 1.8, cw - 0.5, 4.9, { fontSize: 11.5 });
  });
}

// ---------- 14. Build approach ----------
{
  const s = base({ dark: true, kicker: '11 · Implementation Approach', title: 'Build the system first, then the screens', num: 14 });
  const steps = [
    ['Step 1', 'Design tokens', 'Color, type scale, spacing, radius, shadow and motion, defined once and shared by every platform.'],
    ['Step 2', 'Component library', 'Buttons, pills, cards, avatars, feed items, prayer cards, media player, sheets, modals, toasts and skeletons.'],
    ['Step 3', 'Mobile compositions', 'Dashboard, Groups, Profile, Sermons and Prayer Wall with bottom navigation and the Create sheet.'],
    ['Step 4', 'Desktop compositions', 'Sidebar shell, multi-column dashboards, a fixed media player and context panels, as separate layouts.'],
  ];
  const cw = (W - 2 * M - 3 * 0.3) / 4;
  steps.forEach(([k, t, b], i) => card(s, M + i * (cw + 0.3), 1.9, cw, 2.35, { kicker: k, title: t, titleSize: 15, body: b }));
  card(s, M, 4.7, W - 2 * M, 1.75, { border: C.gold, title: 'The key redesign', titleColor: C.gold, titleSize: 15, bodySize: 15, bodyColor: C.white,
    body: 'Turn separate feature mockups into one church community platform. It should be as easy to use as a modern social app, and centered on the Bible, fellowship, prayer, ministry groups, sermons, events and member relationships.' });
}

pres.writeFile({ fileName: path.join(__dirname, 'City4Christ-UI-UX-Redesign.pptx') }).then((f) => console.log('wrote', f));
