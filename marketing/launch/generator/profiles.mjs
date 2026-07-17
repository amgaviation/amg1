import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, '..');
const OUT = resolve(ROOT, 'brand');
mkdirSync(OUT, { recursive: true });
const fonts = readFileSync(resolve(__dir, 'fonts.css'), 'utf8');
const b64 = (p) => readFileSync(p).toString('base64');
const LOGO = `data:image/png;base64,${b64(resolve(ROOT, '../../public/images/logo-white.png'))}`;
const HERO = `file://${resolve(ROOT, 'src-photos/hero-ops.png')}`;

const head = `<meta charset="utf8"><style>${fonts}
*{margin:0;padding:0;box-sizing:border-box}
html,body{overflow:hidden;background:#05090F}
.mark{background-repeat:no-repeat;background-position:center;background-size:contain;background-image:url('${LOGO}')}
</style>`;

// ---- Profile picture (square, circle-safe for IG + FB) ----
const profile = `<!doctype html><html><head>${head}</head><body>
<div style="width:1080px;height:1080px;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;
  background:radial-gradient(125% 125% at 50% 34%, #16324F 0%, #0B1729 46%, #05090F 100%)">
  <div style="position:absolute;width:820px;height:820px;left:50%;top:50%;transform:translate(-50%,-50%);border-radius:50%;
    background:radial-gradient(closest-side, rgba(220,182,90,.12), rgba(220,182,90,0) 72%)"></div>
  <div style="position:absolute;inset:70px;border-radius:50%;border:3px solid rgba(220,182,90,.40)"></div>
  <div style="position:absolute;inset:70px;border-radius:50%;box-shadow:inset 0 0 60px rgba(5,9,15,.55)"></div>
  <div class="mark" style="width:560px;height:150px;position:relative"></div>
</div></body></html>`;

// ---- Facebook cover (mobile-safe centered; authored 820x312, rendered 2x) ----
const cover = `<!doctype html><html><head>${head}</head><body>
<div style="width:820px;height:312px;position:relative;overflow:hidden;background:#05090F">
  <div style="position:absolute;inset:0;background-image:url('${HERO}');background-size:cover;background-position:center 42%"></div>
  <div style="position:absolute;inset:0;background:
     radial-gradient(90% 140% at 50% 50%, rgba(5,9,15,.35), rgba(5,9,15,.82) 78%),
     linear-gradient(180deg, rgba(5,9,15,.42), rgba(5,9,15,.66))"></div>
  <div style="position:absolute;inset:0;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 70px">
    <div class="mark" style="width:150px;height:32px"></div>
    <div style="font-family:'Space Grotesk';font-weight:600;letter-spacing:-.02em;color:#F4F8FE;font-size:31px;line-height:1.05;margin-top:16px">Private aircraft support, coordinated.</div>
    <div style="font-family:'Space Grotesk';font-weight:600;text-transform:uppercase;letter-spacing:.26em;color:#ECD488;font-size:12.5px;margin-top:14px">Crew &nbsp;·&nbsp; Movement &nbsp;·&nbsp; Maintenance</div>
  </div>
</div></body></html>`;

writeFileSync(resolve(__dir, 'profile.html'), profile);
writeFileSync(resolve(__dir, 'cover.html'), cover);
console.log('wrote profile.html and cover.html');
