import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, '..');
const fonts = readFileSync(resolve(__dir, 'fonts.css'), 'utf8');
const thumb = (id) => `data:image/jpeg;base64,${readFileSync(resolve(__dir, 'thumbs', id + '.jpg')).toString('base64')}`;

// friendly export name for each creative id (used in captions + creative index)
const FILE = {
  '01-tease': '01_tease_jul24.png',
  '30-tease-story': '02_teaser-story_jul27.png',
  '40-li-hero': '03_launch_linkedin-hero_jul28.png',
  '10-launch-cover': '04_launch_carousel-1-cover.png',
  '11-launch-what': '05_launch_carousel-2-capabilities.png',
  '12-pricing': '06_launch_carousel-3-pricing.png',
  '13-how': '07_launch_carousel-4-how-it-works.png',
  '14-launch-cta': '08_launch_carousel-5-cta.png',
  '31-reel-cover': '09_launch_reel-cover.png',
  '41-email-banner': '10_launch_email-banner.png',
  '20-crew': '11_week1_crew-network_jul31.png',
  '21-ferry': '12_week1_ferry_aug2.png',
  '22-connect': '13_week1_amg-connect_aug4.png',
  '23-maintenance': '14_week2_maintenance_aug5.png',
  '24-partners': '15_week2_partners_aug7.png',
  '25-owner': '16_week2_owner-controlled_aug9.png',
  '26-closing': '17_week2_closing-cta_aug11.png',
};

const posts = [
  { phase: 'Tease', date: 'Fri Jul 24', ch: 'LinkedIn + Instagram', creatives: ['01-tease'],
    title: 'Teaser — "Something is being coordinated"', cta: 'follow along (link in bio → home)',
    li: `For years, we've done this quietly — behind the aircraft, behind the schedule, behind the people who keep private aircraft moving.\n\nNext week, it gets a name.\n\nCrew. Movement. Maintenance. Coordinated.`,
    liTags: '#AMGAviation #PrivateAviation #BusinessAviation',
    ig: `Crew. Movement. Maintenance.\nSomething is being coordinated. 🛩️\nNext week, it gets a name. → follow along.`,
    igTags: '#AMGAviation #Coordinated #PrivateAviation #BusinessAviation #Part91 #BizAv' },

  { phase: 'Tease', date: 'Sun Jul 27', ch: 'Instagram Story', creatives: ['30-tease-story'],
    title: 'Launch-eve countdown story', cta: 'Add a "remind me" countdown to Jul 28, 8:00 AM ET + a link sticker to the homepage',
    note: `The creative reads "Tuesday. / 8:00 AM ET / AMG Aviation Group goes live." Add the countdown and a poll sticker ("What slows your aircraft down most?"). The launch-eve email also sends this evening (see Emails).` },

  { phase: 'Launch Day — Tuesday Jul 28', date: 'Jul 28 · 8:30 AM', ch: 'LinkedIn (flagship post)', creatives: ['40-li-hero'],
    title: 'AMG Aviation Group is live', cta: 'Start a support request → amgaviationgroup.com/request-support',
    li: `AMG Aviation Group is live.\n\nOwning or running a private aircraft means a hundred moving parts — a crew gap on Thursday, a ferry to a maintenance facility, a repositioning before the next trip, the paperwork behind all of it. Handling it shouldn't mean handing over control.\n\nAMG coordinates the people, planning, and operational support around your aircraft — while you keep operating authority and final say. That's the whole idea.\n\nWhat we coordinate:\n• Contract pilot support — coverage matched to your aircraft, the role, and the mission, reviewed before assignment.\n• Ferry & repositioning — movement handled, responsibilities kept clearly defined.\n• Maintenance flight support — positioning to and from facilities with the requirement and next action always in view.\n• AMG Connect — one role-based portal for requests, documents, quotes, and status.\n\nAnd the part owners tell us they've been waiting for: a $295 flat coordination fee, every pass-through cost billed at cost, receipts included. No markup on your pilot, your fuel, or your per diem. Most requests quoted within ~12 hours.\n\nUS-based. Worldwide coordination. Reviewed for operational fit before anything is accepted.\n\nStart a support request → amgaviationgroup.com/request-support`,
    liTags: '#AMGAviation #BusinessAviation #PrivateAviation' },

  { phase: 'Launch Day — Tuesday Jul 28', date: 'Jul 28 · 11:00 AM', ch: 'Instagram (5-slide carousel)',
    creatives: ['10-launch-cover', '11-launch-what', '12-pricing', '13-how', '14-launch-cta'],
    title: 'Launch carousel', cta: 'Start a support request — set link in bio to /request-support',
    ig: `It's live. AMG Aviation Group — owner-controlled aviation support, coordinated. 🛩️\n\nWe handle the crew, the movement, and the maintenance flights around your aircraft — while you keep operating authority and final say. Swipe for the whole thing:\n\n→ What we coordinate\n→ What it actually costs ($295 flat, zero markup, receipts included)\n→ How a request moves — most quoted in ~12 hours\n\nStart a support request — link in bio.`,
    igTags: '#AMGAviation #Coordinated #PrivateAviation #BusinessAviation #Part91 #FlightDepartment #BizAv #AircraftManagement' },

  { phase: 'Launch Day — Tuesday Jul 28', date: 'Jul 28 · 5–7 PM', ch: 'Instagram Reel', creatives: ['31-reel-cover'],
    title: 'Launch Reel', cta: 'Start a support request — link in bio',
    note: `12–18s cut. Text-on-screen: (1) "A hundred moving parts." (2) "A crew gap. A ferry. A maintenance flight." (3) "Coordinated — without giving up control." (4) "AMG Aviation Group. Now live." (5) end card: "$295 flat. Zero markup. Link in bio." Calm, cinematic audio, no lyrics. The reel-cover image is the end card.`,
    ig: `Crew. Movement. Maintenance. Coordinated. 🛩️\nAMG Aviation Group is live — owner-controlled aviation support. $295 flat, zero markup, receipts included.\nStart a request — link in bio.`,
    igTags: '#AMGAviation #Coordinated #PrivateAviation #BusinessAviation #BizAv' },

  { phase: 'Week 1 — Proof & Pillars', date: 'Wed Jul 29', ch: 'LinkedIn + Instagram', creatives: ['12-pricing'],
    title: 'Zero markup / $295 flat', cta: 'See how plans work → amgaviationgroup.com/pricing',
    li: `Here's a real coordination breakdown. SR22 maintenance ferry, Tampa → Atlanta, Standard plan:\n\nContract pilot (1 day) — $600\nAirline return — $240\nPer diem — $75\nAMG coordination — $295\n\nEvery pass-through line is billed at cost, with receipts. Our $295 is flat — the same whether your pilot costs $500 or $700. We don't make more when your flight costs more.\n\nThat's the difference between a coordinator and a markup. See how plans work → amgaviationgroup.com/pricing`,
    liTags: '#AMGAviation #BusinessAviation #Part91',
    ig: `No markup. Just coordination. 🧾\nA real ferry breakdown — every pass-through cost billed at cost, receipts included. Our fee is a flat $295, whether your pilot costs $500 or $700.\nSee how it works — link in bio.`,
    igTags: '#AMGAviation #Coordinated #PrivateAviation #BusinessAviation #Part91 #BizAv #AircraftManagement' },

  { phase: 'Week 1 — Proof & Pillars', date: 'Fri Jul 31', ch: 'LinkedIn + Instagram', creatives: ['20-crew'],
    title: 'Crew network (+ pilot recruiting)', cta: 'Owners → /request-support · Pilots → /pilots',
    li: `A crew gap shouldn't ground a schedule — or force a scramble.\n\nAMG organizes crew coverage by region, aircraft experience, credential readiness, and the scope of the request. Coverage is matched to your aircraft and mission and reviewed before assignment — coverage indicators aren't a promise of instant placement, and we'd rather say that plainly.\n\nOwners & flight departments: need crew coordinated? → amgaviationgroup.com/request-support\nProfessional crew: want assignments matched to your qualifications? Join the network → amgaviationgroup.com/pilots`,
    liTags: '#AMGAviation #ContractPilot #CorporatePilot #BusinessAviation',
    ig: `Crew, matched and reviewed. 🎯\nAMG coordinates coverage by region, aircraft experience, and credential readiness — reviewed before assignment.\n\n✈️ Owners: get crew coordinated.\n🧑‍✈️ Pilots: join the network — assignments matched to your qualifications.\nLinks in bio.`,
    igTags: '#AMGAviation #ContractPilot #CorporatePilot #PilotJobs #AviationCareers #BusinessAviation #Coordinated' },

  { phase: 'Week 1 — Proof & Pillars', date: 'Sun Aug 2', ch: 'Instagram', creatives: ['21-ferry'],
    title: 'Ferry & repositioning (brand feature)', cta: 'link in bio',
    ig: `Repositioning done right is invisible — the aircraft is simply where it needs to be, when it needs to be there.\n\nAMG coordinates ferry and repositioning flights so movement happens on schedule, with responsibilities kept clearly defined between owner, operator, and crew.\n\nCoordinated. → link in bio`,
    igTags: '#AMGAviation #Coordinated #PrivateAviation #BusinessAviation #BizAv #AvGeek' },

  { phase: 'Week 1 — Proof & Pillars', date: 'Tue Aug 4', ch: 'LinkedIn + Instagram', creatives: ['22-connect'],
    title: 'AMG Connect (the portal)', cta: 'Request access → amgaviationgroup.com/login?mode=request',
    li: `The worst part of aircraft support is usually the not-knowing — where a request stands, which document is missing, whether the quote was seen.\n\nAMG Connect puts it in one place. Approved owners, crews, partners, and administrators each see the requests, documents, messages, quotes, invoices, and status their role requires — without replacing operational approval or final support acceptance.\n\nOne support view. Request access → amgaviationgroup.com/login?mode=request`,
    liTags: '#AMGAviation #AircraftManagement #BusinessAviation',
    ig: `One view. Every stakeholder. 📋\nAMG Connect keeps requests, documents, quotes, and status in one role-based portal — for owners, crew, partners, and admins.\nRequest access — link in bio.`,
    igTags: '#AMGAviation #Coordinated #AircraftManagement #BusinessAviation #Part91 #BizAv',
    note: 'Email 3 (how AMG works in 3 steps) sends this morning — see Emails.' },

  { phase: 'Week 2 — Conversion & Community', date: 'Wed Aug 5', ch: 'LinkedIn + Instagram', creatives: ['23-maintenance'],
    title: 'Maintenance flight support', cta: 'See how a request moves → amgaviationgroup.com/how-it-works',
    li: `A maintenance flight has a way of spawning a dozen small questions: who's flying it, is the aircraft's status clear, what's the next action, who signed off.\n\nAMG coordinates positioning to and from facilities with the requirement, status, and next action kept visible the whole way — so nothing stalls waiting on an answer nobody has. The owner/operator keeps authority and final acceptance throughout.\n\nSee how a request moves → amgaviationgroup.com/how-it-works`,
    liTags: '#AMGAviation #AircraftMaintenance #BusinessAviation #Part91',
    ig: `To the shop and back — coordinated. 🔧\nAMG handles maintenance flight positioning with the requirement, status, and next action always in view. You keep authority and final say.\nSee how it works — link in bio.`,
    igTags: '#AMGAviation #Coordinated #AircraftMaintenance #MRO #BusinessAviation #Part91' },

  { phase: 'Week 2 — Conversion & Community', date: 'Fri Aug 7', ch: 'LinkedIn + Instagram', creatives: ['24-partners'],
    title: 'Partners & shops (recruiting)', cta: 'Partner with AMG → amgaviationgroup.com/for-shops',
    li: `AMG is only as strong as the people we coordinate with — the shops, vendors, and partners who do the work well and communicate clearly.\n\nIf you run a maintenance facility or an aviation service business and want qualified, coordinated demand — with requests, documents, and status shared cleanly through AMG Connect — we'd like to talk.\n\nPartner with AMG → amgaviationgroup.com/for-shops`,
    liTags: '#AMGAviation #MRO #AircraftMaintenance #AviationPartners #BusinessAviation',
    ig: `Do good work? Let's coordinate. 🤝\nShops, vendors, and partners: AMG brings qualified, coordinated demand — with everything shared cleanly through AMG Connect.\nPartner with us — link in bio.`,
    igTags: '#AMGAviation #Coordinated #MRO #AircraftMaintenance #AviationPartners #BizAv' },

  { phase: 'Week 2 — Conversion & Community', date: 'Sun Aug 9', ch: 'Instagram', creatives: ['25-owner'],
    title: 'Owner-controlled (trust)', cta: 'link in bio',
    ig: `"Owner-controlled" isn't a tagline — it's the operating rule.\n\nAMG coordinates the crew, the movement, and the maintenance around your aircraft. You keep operating authority and final acceptance on every request. Support that works around you, not over you.\n\nCoordinated. → link in bio`,
    igTags: '#AMGAviation #Coordinated #PrivateAviation #BusinessAviation #Part91 #AircraftManagement' },

  { phase: 'Week 2 — Conversion & Community', date: 'Tue Aug 11', ch: 'LinkedIn + Instagram', creatives: ['26-closing'],
    title: 'Closing CTA + recap', cta: 'Start here → amgaviationgroup.com/request-support',
    li: `Two weeks ago we introduced AMG Aviation Group. Here's the whole thing in five lines:\n\n• We coordinate crew, movement, and maintenance flights around your aircraft.\n• You keep operating authority and final acceptance.\n• $295 flat coordination fee. Pass-through costs at cost, receipts included.\n• Crew matched to your aircraft and reviewed before assignment.\n• One portal — AMG Connect — for requests, documents, quotes, and status.\n\nIf any of that would make your next month easier, start here → amgaviationgroup.com/request-support`,
    liTags: '#AMGAviation #BusinessAviation #PrivateAviation',
    ig: `Crew. Movement. Maintenance. Coordinated. 🛩️\nOwner-controlled support. $295 flat, zero markup, receipts included. One portal for everything.\nReady when you are — start a request in bio.`,
    igTags: '#AMGAviation #Coordinated #PrivateAviation #BusinessAviation #Part91 #FlightDepartment #BizAv',
    note: 'Email 4 (two-weeks-in recap) sends this morning — see Emails.' },
];

const emails = [
  { n: 1, when: 'Mon Jul 27, ~5:00 PM ET', to: 'waitlist + existing contacts', subj: 'It goes live tomorrow. (A/B: "Tomorrow, 8:00 AM.")',
    preview: 'Owner-controlled aviation support — crew, movement, maintenance, coordinated.',
    body: `Tomorrow morning, AMG Aviation Group goes live.\n\nFor owners and flight departments, it's a simpler way to handle the work around your aircraft — crew coverage, ferry and repositioning, maintenance flights — coordinated by people who do this for a living, while you keep operating authority and final say.\n\nNo markup. A flat coordination fee. One portal for everything.\n\nWe'll send the details at 8:00 AM ET tomorrow. If you've been waiting to get an aircraft moved, positioned, or crewed — hold that thought until you read it.\n\n— The AMG Aviation Group team` },
  { n: 2, when: 'Tue Jul 28, 7:30 AM ET', to: 'full list', subj: 'AMG Aviation Group is live. (A/B: "Private aircraft support, coordinated.")',
    preview: 'Crew, movement, and maintenance — handled, while you keep control. $295 flat, zero markup.',
    banner: 'Header banner: 10_launch_email-banner.png',
    body: `AMG Aviation Group is live.\n\nRunning a private aircraft means a hundred moving parts — a crew gap on Thursday, a ferry to a maintenance facility, a repositioning before the next trip, and the paperwork behind all of it. Handling it shouldn't mean handing over control.\n\nAMG coordinates the people, planning, and operational support around your aircraft — while you keep operating authority and final acceptance.\n\nWhat we coordinate:\n- Contract pilot support — coverage matched to your aircraft, role, and mission, reviewed before assignment.\n- Ferry & repositioning — movement handled, responsibilities kept clearly defined.\n- Maintenance flight support — positioning to and from facilities, with the requirement, status, and next action in view.\n- AMG Connect — one role-based portal for requests, documents, quotes, and status.\n\nAnd the part owners tell us they've been waiting for:\n$295 flat coordination fee. Every pass-through cost billed at cost — receipts included. No markup on your pilot, your fuel, or your per diem. Most requests quoted within ~12 hours.\n\nUS-based. Worldwide coordination. Reviewed for operational fit before anything is accepted.\n\n[ Start a support request → ] (/request-support)\n\nPrefer to talk first? Reply to this email or reach us at /contact.\n\n— The AMG Aviation Group team` },
  { n: 3, when: 'Tue Aug 4, 7:30 AM ET', to: 'full list (or openers of Email 2)', subj: 'From request to coordinated, in three steps. (A/B: "How an AMG request actually works.")',
    preview: 'Tell us the aircraft, route, and timing. We review for fit. We coordinate. Most quoted in ~12 hours.',
    body: `A week in, the most common question we're getting is a good one: what actually happens when I send a request? Here's the whole thing.\n\n1. Request. Tell us the aircraft, the route, and the timing. A few lines is enough to start.\n\n2. Reviewed for fit. We review aircraft status, documents, and owner/operator approval, and confirm the request is something we can coordinate well. Coverage indicators aren't a promise of instant placement — we review before we commit.\n\n3. Coordinated. Crew, movement, and maintenance handled, with the requirement and next action kept visible in AMG Connect the whole way. Most requests are quoted within ~12 hours — pass-through costs at cost, plus the flat $295 coordination fee.\n\nThrough all of it, you keep operating authority and final acceptance. AMG coordinates around you, not over you.\n\n[ See how it works → ] (/how-it-works)   [ Start a request → ] (/request-support)\n\n— The AMG Aviation Group team` },
  { n: 4, when: 'Tue Aug 11, 7:30 AM ET', to: 'full list (suppress anyone who already submitted a request)', subj: 'The whole thing, in five lines. (A/B: "Ready when you are.")',
    preview: 'Owner-controlled coordination. $295 flat, zero markup. One portal for everything.',
    body: `Two weeks ago, AMG Aviation Group went live. If you've been meaning to take a closer look, here's the entire idea in five lines:\n\n- We coordinate crew, movement, and maintenance flights around your aircraft.\n- You keep operating authority and final acceptance.\n- $295 flat coordination fee — pass-through costs at cost, receipts included.\n- Crew matched to your aircraft and reviewed before assignment.\n- One portal — AMG Connect — for requests, documents, quotes, and status.\n\nIf any of that would make your next month easier, the first step is one short request.\n\n[ Start a support request → ] (/request-support)\n\nQuestions first? Just reply — a person reads every one.\n\n— The AMG Aviation Group team` },
];

// ---------- HTML (print) ----------
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const para = (s) => esc(s).split('\n').map(l => l.trim() === '' ? '<br>' : `<span class="ln">${l}</span>`).join('');

const postBlock = (p) => `
<div class="post">
  <div class="thumbs">${p.creatives.map(c => `<img src="${thumb(c)}" alt="">`).join('')}</div>
  <div class="pbody">
    <div class="pmeta"><span class="pdate">${p.date}</span><span class="pch">${p.ch}</span></div>
    <h4>${esc(p.title)}</h4>
    ${p.note ? `<p class="pnote">${esc(p.note)}</p>` : ''}
    ${p.li ? `<div class="cap"><span class="clab">LinkedIn</span><p>${para(p.li)}</p><p class="tags">${esc(p.liTags || '')}</p></div>` : ''}
    ${p.ig ? `<div class="cap"><span class="clab">Instagram</span><p>${para(p.ig)}</p><p class="tags">${esc(p.igTags || '')}</p></div>` : ''}
    <p class="cta"><b>CTA:</b> ${esc(p.cta)}</p>
    <p class="files">Creative file(s): ${p.creatives.map(c => esc(FILE[c])).join(', ')}</p>
  </div>
</div>`;

// group posts by phase
const phases = [];
for (const p of posts) { let g = phases.find(x => x.name === p.phase); if (!g) { g = { name: p.phase, items: [] }; phases.push(g); } g.items.push(p); }

const emailBlock = (e) => `
<div class="post email">
  <div class="pbody" style="width:100%">
    <div class="pmeta"><span class="pdate">Email ${e.n}</span><span class="pch">${esc(e.when)} · ${esc(e.to)}</span></div>
    <h4>${esc(e.subj)}</h4>
    <p class="pnote"><b>Preview text:</b> ${esc(e.preview)}${e.banner ? ' · ' + esc(e.banner) : ''}</p>
    <div class="cap"><p>${para(e.body)}</p></div>
  </div>
</div>`;

const html = `<!doctype html><html><head><meta charset="utf8"><style>
${fonts}
@page{size:letter;margin:16mm 15mm;}
*{box-sizing:border-box}
body{margin:0;font-family:'InterV',system-ui,sans-serif;color:#182234;font-size:11px;line-height:1.55;-webkit-print-color-adjust:exact;print-color-adjust:exact}
h1,h2,h3,h4{font-family:'Space Grotesk',sans-serif;letter-spacing:-.01em;margin:0}
.gold{color:#9A7517}
/* cover */
.cover{background:linear-gradient(160deg,#0C1728 0%,#070D18 70%,#05090F 100%);color:#EEF3FA;
  height:257mm;margin:-16mm -15mm 0;padding:40mm 22mm;display:flex;flex-direction:column;page-break-after:always}
.cover .ey{font-family:'Space Grotesk';text-transform:uppercase;letter-spacing:.24em;font-size:11px;color:#DCB65A;display:flex;align-items:center;gap:12px}
.cover .ey::before{content:"";width:34px;height:2px;background:#DCB65A}
.cover h1{font-size:88px;line-height:.9;margin:14px 0 0;color:#F4F8FE}
.cover .sub{font-family:'Space Grotesk';font-weight:500;color:#ECD488;font-size:22px;margin-top:10px}
.cover .lede{color:#AEBBD1;max-width:150mm;font-size:13px;margin-top:20px;line-height:1.7}
.cover .spacer{flex:1}
.cover .facts{display:flex;gap:0;border-top:1px solid rgba(184,199,224,.22);padding-top:16px}
.cover .fact{padding-right:22px;margin-right:22px;border-right:1px solid rgba(184,199,224,.16)}
.cover .fact:last-child{border:0}
.cover .fn{font-family:'Space Grotesk';font-weight:600;font-size:17px;color:#F4F8FE}
.cover .fl{font-size:9.5px;text-transform:uppercase;letter-spacing:.14em;color:#8FA0BC;margin-top:3px}
/* section headers */
.sec{page-break-before:always}
.sec > .eyebrow{font-family:'Space Grotesk';text-transform:uppercase;letter-spacing:.22em;font-size:10px;color:#9A7517;display:flex;align-items:center;gap:10px}
.sec > .eyebrow::before{content:"";width:26px;height:2px;background:#9A7517}
.sec > h2{font-size:26px;color:#0E1B2E;margin:8px 0 4px}
.sec > .intro{color:#42536E;max-width:170mm;margin-bottom:14px}
.hr{height:1px;background:#E4E8EF;border:0;margin:14px 0}
/* strategy grid */
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:8px 0}
.box{border:1px solid #E4E8EF;border-radius:8px;padding:12px 14px;break-inside:avoid}
.box h4{font-size:13px;color:#0E1B2E;border-left:3px solid #C9A227;padding-left:9px}
.box p{margin:7px 0 0;color:#42536E;font-size:10.5px}
.kv{margin:2px 0;color:#42536E}
.kv b{color:#182234;font-family:'Space Grotesk';font-weight:600}
.phaseName{font-family:'Space Grotesk';font-weight:600;font-size:13px;color:#9A7517;letter-spacing:.02em;
  margin:16px 0 6px;padding-bottom:5px;border-bottom:1px solid #E4E8EF;break-after:avoid}
/* post */
.post{display:flex;gap:12px;border:1px solid #E7EAF0;border-radius:9px;padding:12px;margin:9px 0;break-inside:avoid;background:#FCFCFD}
.post.email{background:#fff}
.thumbs{flex:0 0 30mm;display:flex;flex-direction:column;gap:5px}
.thumbs img{width:100%;border-radius:5px;border:1px solid #E4E8EF;display:block}
.pbody{flex:1;min-width:0}
.pmeta{display:flex;gap:8px;align-items:center;margin-bottom:3px}
.pdate{font-family:'Space Grotesk';font-weight:600;font-size:10px;color:#9A7517;text-transform:uppercase;letter-spacing:.04em}
.pch{font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:#6E7C94;border:1px solid #E0E4EC;border-radius:99px;padding:2px 7px}
.pbody h4{font-size:13.5px;color:#0E1B2E;margin-bottom:5px}
.pnote{color:#586A86;font-size:10px;margin:4px 0;font-style:italic}
.cap{margin:7px 0;padding:8px 10px;background:#F4F6F9;border-radius:6px;border:1px solid #EAEEF3}
.clab{font-family:'Space Grotesk';font-weight:600;font-size:8.5px;text-transform:uppercase;letter-spacing:.14em;color:#9A7517;display:block;margin-bottom:4px}
.cap p{margin:0}
.ln{display:block}
.tags{color:#6E7C94;font-size:9.5px;margin-top:6px!important;font-family:'Space Grotesk'}
.cta{margin:6px 0 2px;font-size:10.5px;color:#182234}
.files{font-size:9px;color:#8592A6;font-family:'Space Grotesk';margin-top:3px}
/* creative index */
.cgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:9px}
.ccard{border:1px solid #E7EAF0;border-radius:7px;overflow:hidden;break-inside:avoid;background:#fff}
.ccard img{width:100%;display:block;background:#05090F}
.ccard .cn{font-family:'Space Grotesk';font-size:8.5px;color:#42536E;padding:6px 7px;word-break:break-all}
.foot{margin-top:14px;color:#8592A6;font-size:9px}
</style></head><body>

<section class="cover">
  <span class="ey">AMG Aviation Group · Launch Campaign</span>
  <h1>Coordinated.</h1>
  <div class="sub">Crew. Movement. Maintenance.</div>
  <p class="lede">The public launch of AMG Aviation Group and AMG Connect — owner-controlled aviation support coordination. A short tease, a Tuesday launch, and two weeks of momentum across LinkedIn, Instagram, and email. This playbook holds the strategy, every post with its caption, the email sequence, and an index of all 17 creatives.</p>
  <div class="spacer"></div>
  <div class="facts">
    <div class="fact"><div class="fn">Tue Jul 28, 2026</div><div class="fl">Launch day</div></div>
    <div class="fact"><div class="fn">Jul 24 – Aug 11</div><div class="fl">Campaign window</div></div>
    <div class="fact"><div class="fn">LinkedIn · IG · Email</div><div class="fl">Channels</div></div>
    <div class="fact"><div class="fn">17 creatives · 4 emails</div><div class="fl">Assets</div></div>
  </div>
</section>

<section class="sec">
  <span class="eyebrow">01 — Strategy</span>
  <h2>The plan on one spread</h2>
  <p class="intro">AMG Aviation Group is owner-controlled aviation support coordination for Part 91 owners, flight departments, maintenance facilities, and professional crew. The launch leads with calm confidence, not hype.</p>
  <div class="grid2">
    <div class="box"><h4>The big idea</h4><p><b>"Coordinated."</b> — Crew. Movement. Maintenance. One word for the whole promise: the jet, the crew, the maintenance ferry, the paperwork, the visibility — handled, in sequence, without taking the controls out of the owner's hands.</p></div>
    <div class="box"><h4>Primary goal</h4><p>Full brand launch: introduce AMG + AMG Connect, drive qualified support requests, and grow the crew and partner networks. Primary CTA everywhere: <b>Start a support request</b>.</p></div>
  </div>
  <div class="phaseName">Four message pillars</div>
  <div class="grid2">
    <div class="box"><h4>Owner-controlled</h4><p>You keep operating authority and final acceptance on every request.</p></div>
    <div class="box"><h4>$295 flat · zero markup</h4><p>One flat coordination fee. Every pass-through cost billed at cost, receipts included. Most requests quoted in ~12 hours.</p></div>
    <div class="box"><h4>Credential-reviewed crew</h4><p>Coverage matched by region, aircraft experience, and credential readiness — reviewed before assignment.</p></div>
    <div class="box"><h4>One portal — AMG Connect</h4><p>Requests, documents, quotes, and status in one role-based view for owners, crew, partners, and admins.</p></div>
  </div>
  <div class="phaseName">Audiences · Voice · Guardrails</div>
  <p class="kv"><b>Audiences:</b> aircraft owners &amp; flight departments (primary) · professional crew/pilots · partners, vendors &amp; maintenance shops.</p>
  <p class="kv"><b>Voice:</b> measured, precise, premium, discreet. Short sentences, operational nouns, confidence through restraint.</p>
  <p class="kv"><b>Guardrails:</b> AMG coordinates, it does not operate the aircraft; the owner/operator keeps operating authority &amp; final acceptance; no absolute guarantees ("always/instant/guaranteed"); pricing mirrors the site's worked example; examples are illustrative (no real tail numbers, clients, or itineraries).</p>
  <div class="phaseName">Hashtags · Links · Measurement</div>
  <p class="kv"><b>Hashtag bank</b> (3 on LinkedIn, 5–8 on IG): core #AMGAviation #Coordinated · category #PrivateAviation #BusinessAviation #Part91 #FlightDepartment #AircraftManagement #BizAv · crew #ContractPilot #CorporatePilot #PilotJobs #AviationCareers · partner #AircraftMaintenance #MRO #AviationPartners.</p>
  <p class="kv"><b>Links (base amgaviationgroup.com):</b> /request-support · /contact · /pricing · /how-it-works · /pilots · /credential-submission · /for-shops · /login (?mode=request for access).</p>
  <p class="kv"><b>UTM pattern:</b> ?utm_source={linkedin|instagram|email}&amp;utm_medium=social&amp;utm_campaign=launch_2026&amp;utm_content={slug}. Instagram has no clickable in-caption links — route through the link in bio and repoint it per phase.</p>
  <p class="kv"><b>KPIs:</b> support requests started (primary) · portal access requests · crew applications · partner inquiries · engagement rate · email open/click. Review at Day 3, Day 8, Day 15; double down on the best-converting pillar + channel.</p>
</section>

<section class="sec">
  <span class="eyebrow">02 — Content Calendar</span>
  <h2>Every post, dated, with its caption</h2>
  <p class="intro">Copy the captions verbatim — they're written to the AMG voice and compliance rules. Posting times (ET): LinkedIn Tue–Thu 8–10am · Instagram 11am–1pm &amp; 5–7pm · Email Tue/Wed 7–8am.</p>
  ${phases.map(g => `<div class="phaseName">${esc(g.name)}</div>${g.items.map(postBlock).join('')}`).join('')}
</section>

<section class="sec">
  <span class="eyebrow">03 — Email Sequence</span>
  <h2>Four sends across the window</h2>
  <p class="intro">Sender: AMG Aviation Group · information@amgaviationgroup.com. One clear CTA per email. Authenticate the sending domain (SPF/DKIM/DMARC) before the launch send.</p>
  ${emails.map(emailBlock).join('')}
</section>

<section class="sec">
  <span class="eyebrow">04 — Creative Index</span>
  <h2>All 17 creatives</h2>
  <p class="intro">Full-resolution files are in the <b>creatives/</b> folder, named to match the calendar. Feed posts are 1080×1350, stories/reels 1080×1920, banners 1200×627/600 — all 2× retina.</p>
  <div class="cgrid">
    ${Object.keys(FILE).map(id => `<div class="ccard"><img src="${thumb(id)}" alt=""><div class="cn">${esc(FILE[id])}</div></div>`).join('')}
  </div>
  <p class="foot">AMG Aviation Group launch campaign · "Coordinated." · Aviation photography is AI-generated (illustrative).</p>
</section>

</body></html>`;

writeFileSync(resolve(__dir, 'playbook.html'), html);

// ---------- captions.txt ----------
let txt = '';
txt += 'AMG AVIATION GROUP — LAUNCH CAMPAIGN "COORDINATED."\n';
txt += 'Copy-paste captions. Launch day: Tuesday, July 28, 2026.\n';
txt += '='.repeat(70) + '\n\n';
let curPhase = '';
for (const p of posts) {
  if (p.phase !== curPhase) { curPhase = p.phase; txt += '\n' + '#'.repeat(70) + '\n# ' + curPhase.toUpperCase() + '\n' + '#'.repeat(70) + '\n'; }
  txt += '\n' + '-'.repeat(70) + '\n';
  txt += `${p.date}  |  ${p.ch}\n${p.title}\nCreative file(s): ${p.creatives.map(c => FILE[c]).join(', ')}\n`;
  if (p.note) txt += `NOTE: ${p.note}\n`;
  txt += '-'.repeat(70) + '\n';
  if (p.li) txt += `\n[LINKEDIN]\n${p.li}\n\n${p.liTags || ''}\n`;
  if (p.ig) txt += `\n[INSTAGRAM]\n${p.ig}\n\n${p.igTags || ''}\n`;
  txt += `\nCTA: ${p.cta}\n`;
}
txt += '\n\n' + '#'.repeat(70) + '\n# EMAIL SEQUENCE\n' + '#'.repeat(70) + '\n';
txt += 'Sender: AMG Aviation Group <information@amgaviationgroup.com>\n';
for (const e of emails) {
  txt += '\n' + '-'.repeat(70) + `\nEMAIL ${e.n}  |  ${e.when}  |  to: ${e.to}\n` + '-'.repeat(70) + '\n';
  txt += `SUBJECT: ${e.subj}\nPREVIEW: ${e.preview}\n`;
  if (e.banner) txt += `${e.banner}\n`;
  txt += `\n${e.body}\n`;
}
txt += '\n' + '='.repeat(70) + '\nGuardrails: AMG coordinates, it does not operate the aircraft; the owner/operator\nkeeps operating authority and final acceptance; no absolute guarantees; pricing\nmirrors the site\'s worked example. Aviation photography is AI-generated.\n';
writeFileSync(resolve(ROOT, 'captions.txt'), txt);

console.log('wrote playbook.html and captions.txt');
