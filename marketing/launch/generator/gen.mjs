import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, '..');            // marketing/launch
const PHOTOS = resolve(ROOT, 'src-photos');
const OUT = resolve(__dir, 'html');
mkdirSync(OUT, { recursive: true });

const fonts = readFileSync(resolve(__dir, 'fonts.css'), 'utf8');
const kit = readFileSync(resolve(__dir, 'kit.css'), 'utf8');
const logo = readFileSync(resolve(ROOT, '../../public/images/logo-white.png')).toString('base64');
const LOGO = `data:image/png;base64,${logo}`;
const photo = (name) => `file://${resolve(PHOTOS, name + '.png')}`;

const mark = (w, h) => `<span class="mark" role="img" aria-label="AMG Aviation Group" style="width:${w}px;height:${h}px;background-image:url('${LOGO}')"></span>`;
const brandTop = () => `<div class="brandrow" style="position:relative;z-index:3">${mark(158, 34)}</div>`;
const footer = (url, style) => `<div class="foot" style="${style || ''}">${mark(150, 32)}<div class="url">${url}</div></div>`;

function blocks(s){
  let h = '';
  if (s.eyebrow) h += `<div class="eyebrow" style="margin-bottom:30px">${s.eyebrow}</div>`;
  if (s.h1) h += `<h1 class="h1" style="font-size:${s.h1size||84}px">${s.h1}</h1>`;
  if (s.sub) h += `<div class="sub" style="font-size:${s.subsize||38}px;margin-top:26px">${s.sub}</div>`;
  if (s.lead) h += `<p class="lead" style="font-size:${s.leadsize||31}px;margin-top:26px;max-width:${s.leadw||880}px">${s.lead}</p>`;
  if (s.ledger){
    h += `<div class="ledger">` + s.ledger.map(r =>
      `<div class="lrow${r.hl?' hl':''}"><div class="lbl">${r.lbl}</div><div class="amt">${r.amt}</div></div>`).join('') + `</div>`;
  }
  if (s.steps){
    h += `<div style="margin-top:14px">` + s.steps.map(r =>
      `<div class="step"><div class="n">${r.n}</div><div class="st"><div class="t">${r.t}</div><div class="d">${r.d}</div></div></div>`).join('') + `</div>`;
  }
  if (s.list){
    h += `<div class="list" style="margin-top:14px">` + s.list.map(r =>
      `<div class="li"><div class="k">${r.k}</div><div class="v">${r.v}</div></div>`).join('') + `</div>`;
  }
  if (s.bullets){
    h += `<div class="bul" style="margin-top:22px">` + s.bullets.map(b => `<div class="b">${b}</div>`).join('') + `</div>`;
  }
  if (s.footnote) h += `<p class="tiny" style="margin-top:30px;max-width:900px">${s.footnote}</p>`;
  if (s.cta) h += `<div style="margin-top:40px"><span class="cta">${s.cta} <span class="arw">→</span></span></div>`;
  if (s.urlline) h += `<div class="brandrow" style="margin-top:28px;gap:22px">${mark(150, 32)}<span class="url">${s.urlline}</span></div>`;
  return h;
}

function html(s){
  const w = s.w, hgt = s.h, pad = s.pad || 96;
  const hasPhoto = !!s.photo;
  const veilCls = s.veil || 'veil';
  const align = s.align || 'bottom';
  const hasFoot = !!s.url;

  // Placement via margin-auto / space-between (robust padded flex column).
  let mainStyle = '', footStyle = '', cardJustify = 'flex-start';
  if (align === 'bottom') mainStyle = 'margin-top:auto';
  else if (align === 'top') footStyle = 'margin-top:auto';
  else if (align === 'center') { if (hasFoot) cardJustify = 'space-between'; else mainStyle = 'margin:auto 0'; }

  const top = s.brandTop ? brandTop() : '';
  const main = `<div class="main" style="${mainStyle}">${blocks(s)}</div>`;
  const foot = hasFoot ? footer(s.url, footStyle) : '';

  const plate = (hasPhoto && align === 'bottom') ? '<div class="plate"></div>' : '';
  const photoLayer = hasPhoto ? `<div class="ph" style="background-image:url('${photo(s.photo)}')${s.phpos?';background-position:'+s.phpos:''}"></div><div class="${veilCls}"></div>${plate}<div class="grain"></div>` : '';

  const iw = w - 2 * pad, ih = hgt - 2 * pad;
  return `<!doctype html><html><head><meta charset="utf8"><style>${fonts}\n${kit}</style></head>
<body><div class="card" style="width:${w}px;height:${hgt}px">
${photoLayer}<div class="stage" style="width:${iw}px;height:${ih}px;margin:${pad}px;justify-content:${cardJustify}">${top}${main}${foot}</div></div></body></html>`;
}

const FEED = { w:1080, h:1350 };
const STORY = { w:1080, h:1920 };
const LI = { w:1200, h:627 };
const EM = { w:1200, h:600 };

const cards = [
  { id:'01-tease', ...FEED, photo:'lone-jet-silhouette', brandTop:true, align:'bottom', veil:'veil',
    eyebrow:'Something is being coordinated',
    h1:'Crew. Movement.<br>Maintenance.', h1size:96,
    sub:'The reveal — 07.28.26', subsize:30 },

  { id:'10-launch-cover', ...FEED, photo:'jet-ramp-cover', brandTop:true, align:'bottom',
    eyebrow:'AMG Aviation Group — Now live',
    h1:'Private aircraft support, coordinated.', h1size:76,
    sub:'Crew. Movement. Maintenance.', subsize:34, url:'amgaviationgroup.com' },

  { id:'11-launch-what', ...FEED, align:'center', brandTop:true,
    eyebrow:'What we coordinate', h1:'Four things, handled.', h1size:70,
    list:[
      { k:'Contract pilot support', v:'Coverage matched to your aircraft, role, and mission — reviewed before assignment.' },
      { k:'Ferry &amp; repositioning', v:'Movement handled, responsibilities kept clearly defined.' },
      { k:'Maintenance flight support', v:'Positioning to and from facilities, with status in view.' },
      { k:'AMG Connect', v:'Requests, documents, quotes, and status in one portal.' },
    ], url:'amgaviationgroup.com' },

  { id:'12-pricing', ...FEED, align:'top', brandTop:true,
    eyebrow:'What it costs', h1:'$295 flat.<br>Zero markup.', h1size:76,
    lead:'A real coordination breakdown — SR22 maintenance ferry, Tampa → Atlanta.', leadsize:29,
    ledger:[
      { lbl:'Contract pilot (1 day)', amt:'$600' },
      { lbl:'Airline return', amt:'$240' },
      { lbl:'Per diem', amt:'$75' },
      { lbl:'AMG coordination', amt:'$295', hl:true },
    ],
    footnote:'Every pass-through cost is billed at cost, with receipts. The $295 is flat — the same whether your pilot costs $500 or $700.',
    url:'amgaviationgroup.com/pricing' },

  { id:'13-how', ...FEED, align:'center', brandTop:true,
    eyebrow:'How a request moves', h1:'Request to coordinated.', h1size:66,
    steps:[
      { n:'01', t:'Request', d:'Tell us the aircraft, route, and timing.' },
      { n:'02', t:'Reviewed for fit', d:'We review status, documents, and owner/operator approval.' },
      { n:'03', t:'Coordinated', d:'Crew, movement, and maintenance handled. Most requests quoted in ~12 hours.' },
    ], url:'amgaviationgroup.com/request-support' },

  { id:'14-launch-cta', ...FEED, photo:'jet-firstlight', align:'bottom', veil:'veil',
    eyebrow:'Now live', h1:'Start a support request.', h1size:72,
    sub:'You keep operating authority. Always.', subsize:34,
    cta:'amgaviationgroup.com/request-support', url:' ' },

  { id:'20-crew', ...FEED, photo:'two-pilots-walking', align:'bottom', veil:'veil',
    eyebrow:'The AMG crew network', h1:'Credential-reviewed crew.', h1size:66,
    bullets:[
      'Matched by region and aircraft experience',
      'Credential readiness reviewed',
      'Reviewed before assignment — not a promise of instant placement',
    ],
    sub:'Owners: request crew  ·  Pilots: join the network', subsize:28, url:'amgaviationgroup.com/pilots' },

  { id:'21-ferry', ...FEED, photo:'aerial-clouds', align:'bottom', veil:'veil',
    eyebrow:'Ferry &amp; repositioning',
    h1:'Where it needs to be.<br>When it needs to be there.', h1size:60,
    sub:'Movement coordinated — responsibilities kept clear.', subsize:32, url:'amgaviationgroup.com' },

  { id:'22-connect', ...FEED, align:'center', brandTop:true,
    eyebrow:'AMG Connect', h1:'One portal. Every role.', h1size:70,
    list:[
      { k:'Owners', v:'Requests, aircraft, documents, and status.' },
      { k:'Crew', v:'Assignments and credential readiness.' },
      { k:'Partners', v:'Service requests, cleanly shared.' },
      { k:'Admin', v:'The full operations board.' },
    ],
    footnote:'Approved stakeholders only. Each role sees the context it requires — without replacing operational approval or final acceptance.',
    url:'amgaviationgroup.com/login' },

  { id:'23-maintenance', ...FEED, photo:'mro-hangar-day', align:'bottom', veil:'veil', phpos:'center top',
    eyebrow:'Maintenance flight support', h1:'To the shop and back — coordinated.', h1size:60,
    bullets:[
      'Positioning to and from facilities',
      'Requirement, status, and next action in view',
      'Owner keeps authority and final acceptance',
    ], url:'amgaviationgroup.com/how-it-works' },

  { id:'24-partners', ...FEED, photo:'partners-handshake', align:'bottom', veil:'veil',
    eyebrow:'Vendors · Shops · Brokers', h1:'Partner with AMG.', h1size:76,
    lead:'Qualified, coordinated demand — shared cleanly through AMG Connect. If you do good work and communicate clearly, let’s coordinate.', leadsize:31,
    url:'amgaviationgroup.com/for-shops' },

  { id:'25-owner', ...FEED, photo:'owner-boarding', align:'bottom', veil:'veil',
    eyebrow:'Owner-controlled', h1:'You keep the authority.<br>We keep it coordinated.', h1size:58,
    lead:'AMG coordinates crew, movement, and maintenance around your aircraft. You keep operating authority and final acceptance on every request.', leadsize:29,
    url:'amgaviationgroup.com' },

  { id:'26-closing', ...FEED, align:'center', brandTop:true,
    eyebrow:'Crew · Movement · Maintenance', h1:'Ready when you are.', h1size:74,
    bullets:[
      'We coordinate crew, movement, and maintenance flights.',
      'You keep operating authority and final acceptance.',
      '$295 flat coordination fee. Pass-through costs at cost, receipts included.',
      'Crew matched to your aircraft, reviewed before assignment.',
      'One portal — AMG Connect — for everything.',
    ], url:'amgaviationgroup.com/request-support' },

  { id:'30-tease-story', ...STORY, photo:'cockpit-night', brandTop:true, align:'center', veil:'soft',
    eyebrow:'The reveal', h1:'Tuesday.', h1size:150,
    sub:'8:00 AM ET', subsize:44,
    lead:'AMG Aviation Group goes live. Owner-controlled aviation support, coordinated.', leadsize:32, leadw:820 },

  { id:'31-reel-cover', ...STORY, photo:'ramp-vertical', brandTop:true, align:'bottom', veil:'veil',
    eyebrow:'AMG Aviation Group — Now live', h1:'Coordinated.', h1size:132,
    sub:'$295 flat · zero markup · receipts included', subsize:32, url:'amgaviationgroup.com' },

  { id:'40-li-hero', ...LI, photo:'hero-ops', align:'center', veil:'veil', pad:64,
    eyebrow:'AMG Aviation Group — Now live', h1:'Private aircraft support, coordinated.', h1size:52,
    sub:'Crew. Movement. Maintenance.', subsize:26, urlline:'amgaviationgroup.com' },

  { id:'41-email-banner', ...EM, photo:'atmo-wide', align:'center', veil:'veil', pad:64,
    eyebrow:'Now live', h1:'AMG Aviation Group is live.', h1size:52,
    sub:'Crew. Movement. Maintenance.', subsize:26, urlline:'amgaviationgroup.com' },
];

const sizes = [];
for (const c of cards){
  writeFileSync(resolve(OUT, c.id + '.html'), html(c));
  sizes.push(`${c.id} ${c.w} ${c.h}`);
}
writeFileSync(resolve(__dir, 'sizes.txt'), sizes.join('\n') + '\n');
console.log('generated', cards.length, 'creatives');
