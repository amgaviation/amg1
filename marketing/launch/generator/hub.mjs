import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, '..');
const fonts = readFileSync(resolve(__dir, 'fonts.css'), 'utf8');
const thumb = (id) => `data:image/jpeg;base64,${readFileSync(resolve(__dir, 'thumbs', id + '.jpg')).toString('base64')}`;

const pillars = [
  { k: 'Owner-controlled', v: 'AMG coordinates around your aircraft — you keep operating authority and final acceptance on every request.' },
  { k: '$295 flat · zero markup', v: 'One flat coordination fee. Every pass-through cost billed at cost, receipts included. Most requests quoted in ~12 hours.' },
  { k: 'Credential-reviewed crew', v: 'Coverage matched by region, aircraft experience, and credential readiness — reviewed before assignment.' },
  { k: 'One portal — AMG Connect', v: 'Requests, documents, quotes, and status in one role-based view for owners, crew, partners, and admins.' },
];

const phases = [
  { eyebrow: 'Phase 0 · Jul 24 – 27', title: 'Tease', blurb: 'A short, quiet build — no reveal.', cards: [
    { id: '01-tease', date: 'Fri Jul 24', ch: ['LinkedIn', 'Instagram'], t: 'Something is being coordinated', b: 'Intrigue teaser. Crew. Movement. Maintenance — next week it gets a name.' },
    { id: '30-tease-story', date: 'Sun Jul 27', ch: ['IG Story'], t: 'Tuesday. 8:00 AM ET', b: 'Launch-eve countdown with a reminder sticker. A launch-eve email sends the same evening.' },
  ]},
  { eyebrow: 'Phase 1 · Tuesday Jul 28', title: 'Launch Day', blurb: 'The reveal, across every channel.', cards: [
    { id: '40-li-hero', date: 'Jul 28 · 8:30a', ch: ['LinkedIn'], t: 'AMG Aviation Group is live', b: 'Flagship announcement post — what AMG is, and why it is different.' },
    { id: '10-launch-cover', date: 'Jul 28 · 11a', ch: ['IG Carousel 1'], t: 'Private aircraft support, coordinated.', b: 'Cover of the 5-slide launch carousel.' },
    { id: '11-launch-what', date: 'Carousel 2', ch: ['Instagram'], t: 'What we coordinate', b: 'The four capabilities, one line each.' },
    { id: '12-pricing', date: 'Carousel 3 · reused Jul 29', ch: ['Instagram'], t: '$295 flat. Zero markup.', b: 'A real SR22 maintenance-ferry breakdown. Also runs as the Jul 29 single post.' },
    { id: '13-how', date: 'Carousel 4', ch: ['Instagram'], t: 'Request to coordinated.', b: 'How a request moves, in three steps.' },
    { id: '14-launch-cta', date: 'Carousel 5', ch: ['Instagram'], t: 'Start a support request', b: 'You keep operating authority. Always.' },
    { id: '31-reel-cover', date: 'Jul 28 · 5–7p', ch: ['IG Reel'], t: 'Coordinated.', b: 'Reel cover / end card — $295 flat, zero markup.' },
    { id: '41-email-banner', date: 'Jul 28 · 7:30a', ch: ['Email'], t: 'AMG Aviation Group is live', b: 'Header banner for the launch-day announcement email.' },
  ]},
  { eyebrow: 'Phase 2 · Jul 29 – Aug 4', title: 'Week 1 — Proof & Pillars', blurb: 'One pillar at a time, led by the sharpest differentiators.', cards: [
    { id: '20-crew', date: 'Fri Jul 31', ch: ['LinkedIn', 'Instagram'], t: 'Credential-reviewed crew', b: 'The crew network — plus a recruiting CTA for pilots.' },
    { id: '21-ferry', date: 'Sun Aug 2', ch: ['Instagram'], t: 'Where it needs to be', b: 'Ferry & repositioning — an aspirational brand moment.' },
    { id: '22-connect', date: 'Tue Aug 4', ch: ['LinkedIn', 'Instagram'], t: 'One portal. Every role.', b: 'AMG Connect walkthrough. Email #3 (how it works) sends the same morning.' },
  ]},
  { eyebrow: 'Phase 3 · Aug 5 – Aug 11', title: 'Week 2 — Conversion & Community', blurb: 'Turn two weeks of attention into requests.', cards: [
    { id: '23-maintenance', date: 'Wed Aug 5', ch: ['LinkedIn', 'Instagram'], t: 'To the shop and back', b: 'Maintenance flight support — a top request type.' },
    { id: '24-partners', date: 'Fri Aug 7', ch: ['LinkedIn', 'Instagram'], t: 'Partner with AMG', b: 'Recruiting vendors, shops, and brokers.' },
    { id: '25-owner', date: 'Sun Aug 9', ch: ['Instagram'], t: 'You keep the authority', b: 'The owner-controlled promise, stated plainly.' },
    { id: '26-closing', date: 'Tue Aug 11', ch: ['LinkedIn', 'Instagram'], t: 'Ready when you are', b: 'Closing recap + CTA. Email #4 (two-weeks-in) sends the same morning.' },
  ]},
];

const chip = (c) => `<span class="chip">${c}</span>`;
const card = (c) => `
  <figure class="card">
    <div class="shot"><img loading="lazy" src="${thumb(c.id)}" alt="${c.t}"></div>
    <figcaption>
      <div class="meta"><span class="date">${c.date}</span>${c.ch.map(chip).join('')}</div>
      <h4>${c.t}</h4>
      <p>${c.b}</p>
    </figcaption>
  </figure>`;

const phaseBlock = (p) => `
  <section class="phase">
    <header class="phead">
      <span class="eyebrow">${p.eyebrow}</span>
      <h3>${p.title}</h3>
      <p class="pblurb">${p.blurb}</p>
    </header>
    <div class="gallery">${p.cards.map(card).join('')}</div>
  </section>`;

const html = `<style>
${fonts}
:root{
  --bg:#0A121F; --bg2:#0C1626; --panel:#0F1B2E; --panel2:#12203444;
  --line:rgba(184,199,224,.14); --line2:rgba(184,199,224,.24);
  --ink:#EEF3FA; --ink2:#AFBCD2; --ink3:#7A8AA4;
  --gold:#DCB65A; --gold2:#ECD488; --goldline:rgba(220,182,90,.42);
  --disp:'Space Grotesk',system-ui,sans-serif; --sans:'InterV',system-ui,sans-serif;
  --maxw:1160px;
}
@media (prefers-color-scheme: light){
  :root{
    --bg:#F5F6F9; --bg2:#FFFFFF; --panel:#FFFFFF; --panel2:#F1F3F7;
    --line:rgba(20,40,70,.12); --line2:rgba(20,40,70,.2);
    --ink:#101A2A; --ink2:#43536E; --ink3:#6E7C94;
    --gold:#9A7517; --gold2:#B08C24; --goldline:rgba(154,117,23,.4);
  }
}
:root[data-theme="dark"]{
  --bg:#0A121F; --bg2:#0C1626; --panel:#0F1B2E; --panel2:#12203444;
  --line:rgba(184,199,224,.14); --line2:rgba(184,199,224,.24);
  --ink:#EEF3FA; --ink2:#AFBCD2; --ink3:#7A8AA4;
  --gold:#DCB65A; --gold2:#ECD488; --goldline:rgba(220,182,90,.42);
}
:root[data-theme="light"]{
  --bg:#F5F6F9; --bg2:#FFFFFF; --panel:#FFFFFF; --panel2:#F1F3F7;
  --line:rgba(20,40,70,.12); --line2:rgba(20,40,70,.2);
  --ink:#101A2A; --ink2:#43536E; --ink3:#6E7C94;
  --gold:#9A7517; --gold2:#B08C24; --goldline:rgba(154,117,23,.4);
}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--sans);
  -webkit-font-smoothing:antialiased;line-height:1.6}
.wrap{max-width:var(--maxw);margin:0 auto;padding:0 clamp(20px,4vw,40px)}
.eyebrow{font-family:var(--disp);font-weight:600;text-transform:uppercase;letter-spacing:.22em;
  font-size:12.5px;color:var(--gold);display:inline-flex;align-items:center;gap:14px}
.eyebrow::before{content:"";width:34px;height:2px;background:var(--gold)}
h1,h2,h3,h4{font-family:var(--disp);font-weight:600;letter-spacing:-.02em;text-wrap:balance;margin:0}

/* HERO — always night */
.hero{position:relative;background:
   radial-gradient(120% 130% at 82% -10%, #16324F 0%, transparent 55%),
   radial-gradient(130% 120% at 12% 8%, #122A47 0%, transparent 52%),
   linear-gradient(180deg,#0C1728 0%, #070D18 60%, #05090F 100%);
  background-color:#070D18;color:#EEF3FA;border-bottom:1px solid rgba(220,182,90,.28);overflow:hidden}
.hero::after{content:"";position:absolute;inset:0;opacity:.05;mix-blend-mode:overlay;pointer-events:none;
  background-image:radial-gradient(circle at 50% 50%,#fff .5px,transparent .6px);background-size:3px 3px}
.hero .wrap{position:relative;padding-top:clamp(56px,9vw,104px);padding-bottom:clamp(48px,7vw,84px)}
.hero .eyebrow{color:#DCB65A}.hero .eyebrow::before{background:#DCB65A}
.htitle{font-size:clamp(64px,15vw,168px);line-height:.9;margin:22px 0 0;color:#F4F8FE}
.hsub{font-family:var(--disp);font-weight:500;color:#ECD488;font-size:clamp(18px,2.6vw,30px);
  letter-spacing:.01em;margin-top:14px}
.hlede{color:#AEBBD1;max-width:60ch;font-size:clamp(15px,1.5vw,17.5px);margin:22px 0 0}
.stats{display:flex;flex-wrap:wrap;gap:0;margin-top:38px;border-top:1px solid rgba(184,199,224,.16)}
.stat{padding:18px 30px 0 0;margin-right:30px;border-right:1px solid rgba(184,199,224,.14)}
.stat:last-child{border-right:0}
.stat .n{font-family:var(--disp);font-weight:600;font-size:clamp(20px,2.4vw,26px);color:#F4F8FE}
.stat .l{font-size:12px;text-transform:uppercase;letter-spacing:.16em;color:#7A8AA4;margin-top:4px}

/* SECTIONS */
section.block{padding:clamp(52px,7vw,88px) 0}
.shead{margin-bottom:34px}
.shead h2{font-size:clamp(28px,4vw,44px);margin-top:16px;color:var(--ink)}
.shead p{color:var(--ink2);max-width:64ch;margin:12px 0 0;font-size:16px}

/* PILLARS */
.pillars{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}
@media(max-width:680px){.pillars{grid-template-columns:1fr}}
.pillar{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:26px 26px 28px;
  position:relative;overflow:hidden}
.pillar::before{content:"";position:absolute;left:0;top:22px;bottom:22px;width:3px;background:var(--gold);border-radius:3px}
.pillar h4{font-size:20px;color:var(--ink);padding-left:16px}
.pillar p{color:var(--ink2);font-size:15px;margin:12px 0 0;padding-left:16px}

/* PHASES + GALLERY (masonry via columns) */
.phase{padding:38px 0;border-top:1px solid var(--line)}
.phase:first-of-type{border-top:0}
.phead{margin-bottom:26px}
.phead h3{font-size:clamp(24px,3.2vw,34px);color:var(--ink);margin-top:12px}
.pblurb{color:var(--ink2);margin:8px 0 0;font-size:15.5px}
.gallery{columns:3 300px;column-gap:18px}
.card{break-inside:avoid;margin:0 0 18px;background:var(--panel);border:1px solid var(--line);
  border-radius:14px;overflow:hidden;transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease}
.card:hover{transform:translateY(-3px);border-color:var(--goldline);box-shadow:0 14px 34px rgba(0,0,0,.28)}
.shot{background:#05090F;line-height:0}
.shot img{width:100%;height:auto;display:block}
figcaption{padding:16px 18px 20px}
.meta{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:10px}
.date{font-family:var(--disp);font-weight:600;font-size:11.5px;letter-spacing:.03em;color:var(--gold);
  text-transform:uppercase;margin-right:2px}
.chip{font-family:var(--disp);font-weight:500;font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;
  color:var(--ink3);border:1px solid var(--line2);border-radius:999px;padding:4px 9px}
figcaption h4{font-size:17px;color:var(--ink);line-height:1.2}
figcaption p{color:var(--ink2);font-size:13.5px;margin:8px 0 0;line-height:1.5}

/* FOOTER */
footer{border-top:1px solid var(--line);background:var(--bg2)}
footer .wrap{padding:40px 0 56px}
footer .fl{font-family:var(--disp);font-weight:600;letter-spacing:.16em;text-transform:uppercase;
  font-size:12px;color:var(--gold)}
footer p{color:var(--ink2);font-size:14px;max-width:70ch;margin:12px 0 0}
footer code{font-family:ui-monospace,monospace;background:var(--panel2);border:1px solid var(--line);
  border-radius:6px;padding:1px 7px;font-size:12.5px;color:var(--ink)}
.guard{color:var(--ink3);font-size:12.5px;margin-top:18px}
@media(prefers-reduced-motion:reduce){.card{transition:none}}
</style>

<header class="hero">
  <div class="wrap">
    <span class="eyebrow">AMG Aviation Group · Launch Campaign</span>
    <h1 class="htitle">Coordinated.</h1>
    <div class="hsub">Crew. Movement. Maintenance.</div>
    <p class="hlede">The public launch of AMG Aviation Group and AMG Connect — owner-controlled aviation support coordination. A short tease, a Tuesday launch, and two weeks of momentum across LinkedIn, Instagram, and email.</p>
    <div class="stats">
      <div class="stat"><div class="n">Tue Jul 28</div><div class="l">Launch day · 2026</div></div>
      <div class="stat"><div class="n">Jul 24 – Aug 11</div><div class="l">Campaign window</div></div>
      <div class="stat"><div class="n">3 channels</div><div class="l">LinkedIn · IG · Email</div></div>
      <div class="stat"><div class="n">17 creatives</div><div class="l">+ 4 emails</div></div>
    </div>
  </div>
</header>

<section class="block">
  <div class="wrap">
    <div class="shead">
      <span class="eyebrow">The idea</span>
      <h2>One word carries the whole promise.</h2>
      <p>Everything — the jet, the crew, the maintenance ferry, the paperwork, the visibility — handled, in sequence, by people who do this for a living, without taking the controls out of the owner's hands. Four proof points do the persuading.</p>
    </div>
    <div class="pillars">
      ${pillars.map(p => `<div class="pillar"><h4>${p.k}</h4><p>${p.v}</p></div>`).join('')}
    </div>
  </div>
</section>

<section class="block" style="padding-top:0">
  <div class="wrap">
    <div class="shead">
      <span class="eyebrow">The arc</span>
      <h2>Every post, every creative — in sequence.</h2>
      <p>Seventeen finished, print-ready creatives carry real copy and data in the AMG brand system. Tap through the phases below; full captions, emails, and editable source live in the repo.</p>
    </div>
    ${phases.map(phaseBlock).join('')}
  </div>
</section>

<footer>
  <div class="wrap">
    <div class="fl">Crew · Movement · Maintenance</div>
    <p>This is a preview board. The complete campaign — strategy, the dated calendar with every caption, the four-email sequence, all 17 retina creatives, and the generator that produced them — lives in <code>marketing/launch/</code>.</p>
    <p class="guard">Guardrails baked into every asset: AMG coordinates, it does not operate the aircraft; the owner/operator keeps operating authority and final acceptance; no absolute guarantees; pricing mirrors the site's worked example. Aviation photography is AI-generated.</p>
  </div>
</footer>`;

writeFileSync(resolve(ROOT, 'campaign-hub.html'), html);
console.log('wrote campaign-hub.html', html.length, 'bytes');
