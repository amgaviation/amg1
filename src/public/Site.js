/**
 * Site.js — AMG Aviation Group
 * Shared public utilities imported by page-level Velo files.
 * NOT a page file — import with: import { ... } from 'public/Site.js';
 */

// ─── Role / status constants ─────────────────────────────────
export const ROLES = {
  ADMIN:       'amg_admin',
  CREW:        'crew_pilot',
  CLIENT:      'client_owner',
  MAINTENANCE: 'maintenance_partner',
  BROKER:      'broker_partner',
};

export const STATUS = {
  PENDING:   'pending',
  APPROVED:  'approved',
  DENIED:    'denied',
  SUSPENDED: 'suspended',
};

// ─── Formatters ──────────────────────────────────────────────

/** Format a JS Date or ISO string to "Jun 10, 2026" */
export function formatDate(d) {
  if (!d) return '—';
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

/** Format a number as currency: "$12,500.00" */
export function formatCurrency(n, currency = 'USD') {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);
}

/** Format flight hours with 1 decimal: "1,234.5 hrs" */
export function formatHours(n) {
  if (n == null) return '—';
  return `${Number(n).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} hrs`;
}

/** Return true if the value looks like a valid email */
export function isValidEmail(val) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val || '').trim());
}

/** Return true if value is a non-empty string */
export function isRequired(val) {
  return typeof val === 'string' ? val.trim().length > 0 : val != null;
}

// ─── UI helpers ──────────────────────────────────────────────

/** Escape HTML special characters to prevent XSS in dynamic content */
export function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Return a CSS class string for an approval status pill */
export function statusPillClass(status) {
  const map = {
    pending:   'amg-status--pending',
    approved:  'amg-status--approved',
    denied:    'amg-status--denied',
    suspended: 'amg-status--suspended',
    active:    'amg-status--active',
    inactive:  'amg-status--inactive',
  };
  return `amg-status ${map[status] || 'amg-status--muted'}`;
}

/** Return display label for a role key */
export function roleLabel(role) {
  const map = {
    amg_admin:           'Admin',
    crew_pilot:          'Crew / Pilot',
    client_owner:        'Client / Operator',
    maintenance_partner: 'Maintenance Partner',
    broker_partner:      'Broker Partner',
  };
  return map[role] || role || '—';
}

// ─── HTML generators (for Wix HTML embeds) ───────────────────

/**
 * Build HTML for a data table inside an HTML embed component.
 * @param {Array<string>} headers
 * @param {Array<Array<string>>} rows
 * @param {Object} opts — { actions: Array<{label, class, dataKey}> }
 */
export function buildTableHTML(headers, rows, opts = {}) {
  const thHtml = headers.map(h => `<th>${escapeHtml(h)}</th>`).join('');
  const tdRows = rows.map((row, ri) => {
    const cells = row.map(cell => `<td>${cell}</td>`).join('');
    const actionBtns = (opts.actions || []).map(a =>
      `<button class="amg-btn amg-btn--sm ${a.class || 'amg-btn--ghost'}" data-row="${ri}" data-action="${a.dataKey}">${escapeHtml(a.label)}</button>`
    ).join('');
    const actionCell = actionBtns ? `<td class="amg-table-actions">${actionBtns}</td>` : '';
    return `<tr>${cells}${actionCell}</tr>`;
  }).join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700&family=Inter:wght@400;500&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{background:transparent;font-family:'Inter',sans-serif;font-size:14px;color:#EDF3F8}
.wrap{overflow-x:auto;border-radius:12px;border:1px solid rgba(159,178,197,0.15)}
table{width:100%;border-collapse:collapse}
th{background:#102B46;padding:12px 16px;text-align:left;font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#9FB2C5;border-bottom:1px solid rgba(159,178,197,0.15);white-space:nowrap}
tr{border-bottom:1px solid rgba(159,178,197,0.10);transition:background 0.15s}
tr:last-child{border-bottom:none}
tr:hover{background:rgba(30,107,255,0.04)}
td{padding:14px 16px;vertical-align:middle}
.amg-table-actions{display:flex;gap:8px}
.amg-btn{display:inline-flex;align-items:center;padding:6px 14px;border-radius:6px;border:none;cursor:pointer;font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.10em;text-transform:uppercase;transition:all 0.15s}
.amg-btn--ghost{background:transparent;color:#6FA5FF;border:1px solid #1E6BFF}
.amg-btn--ghost:hover{background:rgba(30,107,255,0.12);color:#F7FAFC}
.amg-btn--danger{background:rgba(238,98,98,0.12);color:#EE6262;border:1px solid #EE6262}
.amg-btn--success{background:rgba(45,212,122,0.12);color:#2DD47A;border:1px solid #2DD47A}
.amg-status{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:9999px;font-size:11px;font-weight:600}
.amg-status::before{content:'';width:5px;height:5px;border-radius:50%;background:currentColor}
.amg-status--pending{color:#F3B74C;background:rgba(243,183,76,0.12)}
.amg-status--approved{color:#2DD47A;background:rgba(45,212,122,0.12)}
.amg-status--denied{color:#EE6262;background:rgba(238,98,98,0.12)}
.amg-status--suspended{color:#9FB2C5;background:rgba(159,178,197,0.10)}
.empty{padding:48px;text-align:center;color:#9FB2C5}
</style>
</head><body>
<div class="wrap">
${rows.length === 0
  ? '<div class="empty">No records found.</div>'
  : `<table><thead><tr>${thHtml}${opts.actions?.length ? '<th>Actions</th>' : ''}</tr></thead><tbody>${tdRows}</tbody></table>`
}
</div>
<script>
document.querySelectorAll('[data-action]').forEach(btn=>{
  btn.addEventListener('click',()=>{
    window.parent.postMessage({type:'tableAction',action:btn.dataset.action,row:parseInt(btn.dataset.row,10)},'*');
  });
});
</script>
</body></html>`;
}

/**
 * Build the footer HTML for injection via an HTML embed.
 */
export function buildFooterHTML() {
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=Inter:wght@400;500&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{background:#0A1B2E;color:#9FB2C5;font-family:'Inter',sans-serif;font-size:14px}
.footer{padding:64px 40px 32px;max-width:1280px;margin:0 auto}
.footer__grid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:40px;margin-bottom:48px}
.footer__brand h3{font-family:'Barlow Condensed',sans-serif;font-size:24px;font-weight:800;text-transform:uppercase;letter-spacing:0.06em;color:#F7FAFC;margin-bottom:12px}
.footer__brand h3 span{color:#D4AF37}
.footer__brand p{line-height:1.65;max-width:300px}
.footer__col h4{font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.20em;text-transform:uppercase;color:#D4AF37;margin-bottom:16px}
.footer__col a{display:block;color:#9FB2C5;text-decoration:none;margin-bottom:10px;transition:color 0.15s}
.footer__col a:hover{color:#F7FAFC}
.footer__bottom{border-top:1px solid rgba(159,178,197,0.12);padding-top:24px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;font-size:12px}
.footer__disclaimer{margin-top:24px;padding:16px;border:1px solid rgba(159,178,197,0.12);border-radius:8px;font-size:12px;line-height:1.6;color:rgba(159,178,197,0.65)}
@media(max-width:768px){.footer__grid{grid-template-columns:1fr 1fr}.footer{padding:40px 20px 24px}}
@media(max-width:480px){.footer__grid{grid-template-columns:1fr}}
</style></head><body>
<footer>
  <div class="footer">
    <div class="footer__grid">
      <div class="footer__brand">
        <h3>AMG <span>Aviation</span></h3>
        <p>Personalized aviation management and mission coordination. Operating under Part 91 for private flight operations.</p>
      </div>
      <div class="footer__col">
        <h4>Company</h4>
        <a href="/about">About AMG</a>
        <a href="/our-team">Our Team</a>
        <a href="/contact">Contact</a>
      </div>
      <div class="footer__col">
        <h4>Capabilities</h4>
        <a href="/services">Services</a>
        <a href="/aircraft">Aircraft</a>
        <a href="/pilot-network">Pilot Network</a>
        <a href="/booking-request">Request Support</a>
      </div>
      <div class="footer__col">
        <h4>Administrative</h4>
        <a href="/plans-pricing">Plans &amp; Pricing</a>
        <a href="/portal-router">Member Portal</a>
        <a href="/contact">Support</a>
      </div>
    </div>
    <div class="footer__disclaimer">
      AMG Aviation Group operates exclusively under FAR Part 91 for private flight operations. AMG is not an air carrier, does not hold an Air Carrier Certificate, and does not provide certificated air transportation services. Nothing on this website constitutes a charter offering.
    </div>
    <div class="footer__bottom">
      <span>&copy; ${new Date().getFullYear()} AMG Aviation Group. All rights reserved.</span>
      <span>information@amgaviationgroup.com</span>
    </div>
  </div>
</footer>
</body></html>`;
}

/**
 * Validate a booking/mission request form payload.
 * Returns { valid: boolean, errors: Object }
 */
export function validateBookingForm(data) {
  const errors = {};
  if (!isRequired(data.name))      errors.name      = 'Name is required';
  if (!isValidEmail(data.email))   errors.email     = 'Valid email required';
  if (!isRequired(data.phone))     errors.phone     = 'Phone is required';
  if (!isRequired(data.departure)) errors.departure = 'Departure is required';
  if (!isRequired(data.arrival))   errors.arrival   = 'Destination is required';
  if (!isRequired(data.date))      errors.date      = 'Date is required';
  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * Validate a contact form payload.
 */
export function validateContactForm(data) {
  const errors = {};
  if (!isRequired(data.name))    errors.name    = 'Name is required';
  if (!isValidEmail(data.email)) errors.email   = 'Valid email required';
  if (!isRequired(data.message)) errors.message = 'Message is required';
  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * Wix HTML embed resize helper — listens for height messages from embeds.
 * Call this from any page that uses an HTML embed that needs auto-height.
 * @param {Object} $el — the $w('#embedId') element
 */
export function autoResizeEmbed($el) {
  if (!$el) return;
  $el.onMessage(e => {
    if (e.data && e.data.type === 'wix-amg-resize' && typeof e.data.height === 'number') {
      $el.height = e.data.height + 16;
    }
  });
}
