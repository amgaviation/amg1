import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const screenshotDir = path.join(root, "public/images/portal-screenshots");
const backgroundDir = path.join(root, "public/images/amg-generated/portal");

const clientPreview = {
  eyebrow: "AMG Connect",
  title: "Client Dashboard",
  roleLabel: "Owner Services",
  accent: "#3b82f6",
  nav: ["Overview", "Support Requests", "Aircraft", "Documents", "Quotes", "Messages"],
  metrics: [
    ["4", "Open requests", "2 under review"],
    ["3", "Aircraft", "Demo fleet"],
    ["18", "Documents", "Shared files"],
    ["2", "Quotes", "Awaiting review"],
  ],
  activityTitle: "Current Support Activity",
  activity: [
    ["AMG-7042", "Demo Jet 01", "Plan review", "Under review"],
    ["AMG-7088", "Demo Turboprop", "Maintenance movement", "Crew check"],
    ["AMG-7114", "Demo Light Jet", "Document packet", "Ready"],
    ["AMG-7126", "Demo Cabin Aircraft", "Support inquiry", "New"],
  ],
  rightRailTitle: "Next Actions",
  rightRail: [
    ["Review support plan", "Updated today"],
    ["Approve document packet", "Due tomorrow"],
    ["Confirm aircraft context", "Pending"],
  ],
  footerTitle: "Recent Messages",
  footer: [
    ["Operations", "Route assumptions added to AMG-7088."],
    ["Commercial", "Quote draft is ready for client review."],
  ],
};

const crewPreview = {
  eyebrow: "AMG Connect",
  title: "Crew Dashboard",
  roleLabel: "Flight Crew",
  accent: "#22c55e",
  nav: ["Overview", "Assignments", "Availability", "Credentials", "Expenses", "Messages"],
  metrics: [
    ["2", "Open assignments", "Demo schedule"],
    ["6", "Availability windows", "Next 30 days"],
    ["5", "Credentials", "All current"],
    ["1", "Expense draft", "Needs receipt"],
  ],
  activityTitle: "Assignment Review",
  activity: [
    ["AMG-C216", "Demo Crew Pairing", "KSDL / KAPA", "Offer sent"],
    ["AMG-C233", "Demo Reposition", "KPBI / KTEB", "Brief ready"],
    ["AMG-C241", "Demo Standby", "KDAL / KASE", "Availability"],
    ["AMG-C255", "Demo Training Check", "KFTY / KPMP", "Credential review"],
  ],
  rightRailTitle: "Credential Status",
  rightRail: [
    ["Pilot certificate", "Verified sample"],
    ["Medical certificate", "Current sample"],
    ["Insurance approval", "Review sample"],
  ],
  footerTitle: "Crew Notes",
  footer: [
    ["Availability", "Sample blackout window added for next week."],
    ["Operations", "Demo mission brief updated with handling notes."],
  ],
};

const escapeXml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

function text(value, x, y, options = {}) {
  const {
    size = 24,
    weight = 500,
    fill = "#0f172a",
    opacity = 1,
    anchor = "start",
    family = "Inter, Arial, sans-serif",
    letterSpacing = "0",
  } = options;

  return `<text x="${x}" y="${y}" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${fill}" opacity="${opacity}" text-anchor="${anchor}" letter-spacing="${letterSpacing}">${escapeXml(value)}</text>`;
}

function pill(x, y, w, h, fill, stroke, content, options = {}) {
  const radius = h / 2;
  const label = text(content, x + w / 2, y + h / 2 + 5, {
    size: options.size ?? 17,
    weight: 700,
    fill: options.fill ?? "#1e293b",
    anchor: "middle",
    letterSpacing: options.letterSpacing ?? "0.7",
  });

  return `<g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
    ${label}
  </g>`;
}

function navItems(items, active, accent) {
  return items
    .map((item, index) => {
      const y = 292 + index * 56;
      const isActive = item === active;
      return `<g>
        <rect x="42" y="${y - 27}" width="176" height="34" rx="8" fill="${isActive ? "rgba(255,255,255,0.12)" : "transparent"}"/>
        <circle cx="62" cy="${y - 10}" r="4" fill="${isActive ? accent : "rgba(226,232,240,0.42)"}"/>
        ${text(item, 82, y - 5, { size: 15, weight: isActive ? 800 : 650, fill: isActive ? "#f8fafc" : "#94a3b8" })}
      </g>`;
    })
    .join("");
}

function metricCards(metrics, accent) {
  return metrics
    .map(([value, label, detail], index) => {
      const x = 312 + index * 252;
      return `<g filter="url(#cardShadow)">
        <rect x="${x}" y="206" width="222" height="128" rx="14" fill="#ffffff" stroke="#dfe7f1"/>
        ${text(value, x + 28, 255, { size: 42, weight: 850, fill: "#0f172a" })}
        ${text(label.toUpperCase(), x + 28, 292, { size: 13, weight: 850, fill: accent, letterSpacing: "1.3" })}
        ${text(detail, x + 28, 316, { size: 15, weight: 650, fill: "#64748b" })}
      </g>`;
    })
    .join("");
}

function activityRows(rows, accent) {
  return rows
    .map(([id, aircraft, service, status], index) => {
      const y = 466 + index * 70;
      return `<g>
        <rect x="312" y="${y - 42}" width="742" height="58" rx="11" fill="${index % 2 === 0 ? "#ffffff" : "#f8fafc"}" stroke="#e2e8f0"/>
        ${text(id, 338, y - 13, { size: 17, weight: 850, fill: "#0f172a" })}
        ${text(aircraft, 338, y + 10, { size: 14, weight: 650, fill: "#64748b" })}
        ${text(service, 592, y - 2, { size: 16, weight: 750, fill: "#334155" })}
        ${pill(888, y - 28, 130, 30, `${accent}18`, `${accent}55`, status, { size: 12, fill: "#1e293b" })}
      </g>`;
    })
    .join("");
}

function railItems(items, accent) {
  return items
    .map(([title, detail], index) => {
      const y = 480 + index * 84;
      return `<g>
        <rect x="1100" y="${y - 48}" width="254" height="72" rx="14" fill="#ffffff" stroke="#dfe7f1"/>
        <circle cx="1132" cy="${y - 12}" r="10" fill="${accent}1f" stroke="${accent}" stroke-width="2"/>
        ${text(title, 1154, y - 15, { size: 16, weight: 800, fill: "#0f172a" })}
        ${text(detail, 1154, y + 9, { size: 13, weight: 650, fill: "#64748b" })}
      </g>`;
    })
    .join("");
}

function messageRows(items) {
  return items
    .map(([label, detail], index) => {
      const x = 312 + index * 384;
      return `<g>
        <rect x="${x}" y="792" width="352" height="92" rx="15" fill="#ffffff" stroke="#dfe7f1"/>
        ${text(label, x + 24, 833, { size: 16, weight: 850, fill: "#0f172a" })}
        ${text(detail, x + 24, 862, { size: 14, weight: 650, fill: "#64748b" })}
      </g>`;
    })
    .join("");
}

function dashboardSvg(model) {
  const active = model.nav[0];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="1000" viewBox="0 0 1440 1000">
    <defs>
      <linearGradient id="page" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stop-color="#f8fbff"/>
        <stop offset="54%" stop-color="#eef4fa"/>
        <stop offset="100%" stop-color="#dfe8f1"/>
      </linearGradient>
      <linearGradient id="sidebar" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="#07111f"/>
        <stop offset="100%" stop-color="#020814"/>
      </linearGradient>
      <filter id="cardShadow" x="-25%" y="-35%" width="150%" height="170%">
        <feDropShadow dx="0" dy="18" stdDeviation="20" flood-color="#102033" flood-opacity="0.10"/>
      </filter>
      <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="30" stdDeviation="34" flood-color="#102033" flood-opacity="0.14"/>
      </filter>
    </defs>
    <rect width="1440" height="1000" fill="url(#page)"/>
    <rect width="260" height="1000" fill="url(#sidebar)"/>
    <rect x="0" y="0" width="1440" height="1000" fill="none" stroke="#cbd5e1" stroke-width="2"/>

    <g>
      <rect x="42" y="72" width="128" height="35" rx="5" fill="#ffffff" opacity="0.10"/>
      ${text("AMG", 58, 98, { size: 27, weight: 850, fill: "#ffffff", letterSpacing: "0" })}
      ${text("CONNECT OPERATIONS", 42, 140, { size: 12, weight: 750, fill: "#64748b", letterSpacing: "2.1" })}
      ${text(model.roleLabel.toUpperCase(), 42, 168, { size: 12, weight: 800, fill: model.accent, letterSpacing: "1.8" })}
      ${navItems(model.nav, active, model.accent)}
    </g>

    <rect x="260" y="0" width="1180" height="112" fill="#ffffff" opacity="0.98"/>
    <rect x="260" y="111" width="1180" height="1" fill="#dbe5ef"/>
    ${text(model.eyebrow.toUpperCase(), 312, 58, { size: 13, weight: 850, fill: model.accent, letterSpacing: "1.7" })}
    ${text(model.title, 312, 88, { size: 33, weight: 850, fill: "#0f172a" })}
    ${pill(1120, 42, 128, 36, "#f8fafc", "#dbe5ef", "DEMO DATA", { size: 12, fill: "#475569", letterSpacing: "1.1" })}
    <circle cx="1304" cy="60" r="22" fill="${model.accent}18" stroke="${model.accent}44"/>
    ${text("AMG", 1304, 66, { size: 12, weight: 850, fill: model.accent, anchor: "middle" })}

    ${metricCards(model.metrics, model.accent)}

    <g filter="url(#softShadow)">
      <rect x="292" y="382" width="784" height="318" rx="18" fill="#ffffffcc" stroke="#dfe7f1"/>
      ${text(model.activityTitle, 312, 408, { size: 21, weight: 850, fill: "#0f172a" })}
      ${activityRows(model.activity, model.accent)}
    </g>

    <g filter="url(#softShadow)">
      <rect x="1080" y="382" width="294" height="318" rx="18" fill="#f8fafccc" stroke="#dfe7f1"/>
      ${text(model.rightRailTitle, 1100, 408, { size: 20, weight: 850, fill: "#0f172a" })}
      ${railItems(model.rightRail, model.accent)}
    </g>

    <g filter="url(#softShadow)">
      <rect x="292" y="746" width="1082" height="174" rx="18" fill="#f8fafccc" stroke="#dfe7f1"/>
      ${text(model.footerTitle, 312, 776, { size: 20, weight: 850, fill: "#0f172a" })}
      ${messageRows(model.footer)}
    </g>
  </svg>`;
}

function backgroundBaseSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="2688" height="1520" viewBox="0 0 2688 1520">
    <defs>
      <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stop-color="#020814"/>
        <stop offset="48%" stop-color="#071321"/>
        <stop offset="100%" stop-color="#020814"/>
      </linearGradient>
      <radialGradient id="glow" cx="70%" cy="30%" r="52%">
        <stop offset="0%" stop-color="#2563eb" stop-opacity="0.28"/>
        <stop offset="100%" stop-color="#2563eb" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="2688" height="1520" fill="url(#bg)"/>
    <rect width="2688" height="1520" fill="url(#glow)"/>
    <g opacity="0.14" stroke="#e2e8f0" stroke-width="1">
      ${Array.from({ length: 15 }, (_, index) => `<line x1="0" y1="${160 + index * 86}" x2="2688" y2="${160 + index * 86}"/>`).join("")}
      ${Array.from({ length: 16 }, (_, index) => `<line x1="${170 + index * 150}" y1="0" x2="${170 + index * 150}" y2="1520"/>`).join("")}
    </g>
  </svg>`;
}

async function renderDashboard(model, outputPath) {
  const svg = dashboardSvg(model);
  await sharp(Buffer.from(svg)).webp({ quality: 86 }).toFile(outputPath);
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function renderBackground(clientPng, crewPng) {
  const clientLayer = await sharp(clientPng).resize({ width: 1510 }).modulate({ brightness: 0.9, saturation: 0.88 }).png().toBuffer();
  const crewLayer = await sharp(crewPng).resize({ width: 1340 }).modulate({ brightness: 0.82, saturation: 0.9 }).png().toBuffer();
  const overlay = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="2688" height="1520">
    <rect width="2688" height="1520" fill="#020814" opacity="0.36"/>
    <linearGradient id="fade" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0%" stop-color="#020814" stop-opacity="0.92"/>
      <stop offset="48%" stop-color="#020814" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="#020814" stop-opacity="0.78"/>
    </linearGradient>
    <rect width="2688" height="1520" fill="url(#fade)"/>
  </svg>`);

  await sharp(Buffer.from(backgroundBaseSvg()))
    .composite([
      { input: crewLayer, left: 210, top: 170 },
      { input: clientLayer, left: 1040, top: 420 },
      { input: overlay, left: 0, top: 0 },
    ])
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(path.join(backgroundDir, "amg-connect-dashboard-bg.jpg"));
}

async function main() {
  await mkdir(screenshotDir, { recursive: true });
  await mkdir(backgroundDir, { recursive: true });

  const clientPng = await renderDashboard(
    clientPreview,
    path.join(screenshotDir, "portal-client-dashboard-enhanced.webp"),
  );
  const crewPng = await renderDashboard(
    crewPreview,
    path.join(screenshotDir, "portal-crew-dashboard-enhanced.webp"),
  );

  await renderBackground(clientPng, crewPng);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
