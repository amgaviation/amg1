/**
 * Smart lead import — shared by the admin import UI (client) and the bulk
 * insert server action. Maps arbitrary spreadsheet/CSV columns onto crm_leads
 * fields via header synonyms and content sniffing, and normalizes cell values
 * (stages, sources, money, dates). Columns that match nothing are folded into
 * the lead's notes so no data from the uploaded file is lost.
 *
 * Keep this module client-safe: no "server-only", no supabase imports.
 */

export const MAX_IMPORT_ROWS = 2000;

export const LEAD_IMPORT_TARGETS = [
  { value: "full_name", label: "Full Name" },
  { value: "first_name", label: "First Name" },
  { value: "last_name", label: "Last Name" },
  { value: "company", label: "Company" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "source", label: "Source" },
  { value: "stage", label: "Stage" },
  { value: "estimated_value", label: "Estimated Value" },
  { value: "next_action_at", label: "Next Action Date" },
  { value: "notes", label: "Add to Notes" },
  { value: "skip", label: "Ignore Column" },
] as const;

export type LeadImportTarget = (typeof LEAD_IMPORT_TARGETS)[number]["value"];

export type LeadImportColumn = {
  index: number;
  header: string;
  target: LeadImportTarget;
  sample: string;
};

export type LeadImportRow = {
  full_name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  source: string;
  stage: string;
  estimated_value: number | null;
  next_action_at: string | null;
  notes: string | null;
};

const LEAD_IMPORT_STAGES = ["new", "contacted", "qualified", "proposal", "won", "lost"];
const LEAD_IMPORT_SOURCES = ["manual", "website_form", "referral", "broker", "event", "other"];

function normalizeKey(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/** Exact header-synonym matches, checked before any fuzzy heuristics. */
const HEADER_SYNONYMS: Record<string, LeadImportTarget> = {
  // full name
  name: "full_name",
  fullname: "full_name",
  contactname: "full_name",
  contact: "full_name",
  leadname: "full_name",
  lead: "full_name",
  person: "full_name",
  customer: "full_name",
  customername: "full_name",
  clientname: "full_name",
  poc: "full_name",
  pointofcontact: "full_name",
  attn: "full_name",
  attention: "full_name",
  // split names
  firstname: "first_name",
  first: "first_name",
  givenname: "first_name",
  fname: "first_name",
  lastname: "last_name",
  last: "last_name",
  surname: "last_name",
  familyname: "last_name",
  lname: "last_name",
  // company
  company: "company",
  companyname: "company",
  organization: "company",
  organisation: "company",
  business: "company",
  businessname: "company",
  account: "company",
  accountname: "company",
  operator: "company",
  employer: "company",
  firm: "company",
  shop: "company",
  vendor: "company",
  mro: "company",
  fbo: "company",
  // email
  email: "email",
  emailaddress: "email",
  mail: "email",
  workemail: "email",
  contactemail: "email",
  // phone
  phone: "phone",
  phonenumber: "phone",
  mobile: "phone",
  mobilenumber: "phone",
  cell: "phone",
  cellphone: "phone",
  telephone: "phone",
  tel: "phone",
  workphone: "phone",
  directline: "phone",
  // source
  source: "source",
  leadsource: "source",
  channel: "source",
  origin: "source",
  referralsource: "source",
  campaign: "source",
  // stage
  stage: "stage",
  status: "stage",
  leadstatus: "stage",
  leadstage: "stage",
  pipelinestage: "stage",
  dealstage: "stage",
  // estimated value
  value: "estimated_value",
  estimatedvalue: "estimated_value",
  estvalue: "estimated_value",
  dealvalue: "estimated_value",
  dealsize: "estimated_value",
  amount: "estimated_value",
  revenue: "estimated_value",
  budget: "estimated_value",
  opportunityvalue: "estimated_value",
  contractvalue: "estimated_value",
  pipelinevalue: "estimated_value",
  estimatedvalueusd: "estimated_value",
  valueusd: "estimated_value",
  // next action
  nextaction: "next_action_at",
  nextactionat: "next_action_at",
  nextactiondate: "next_action_at",
  followup: "next_action_at",
  followupdate: "next_action_at",
  nextstep: "next_action_at",
  nextstepdate: "next_action_at",
  nextcontact: "next_action_at",
  nextcontactdate: "next_action_at",
  reminderdate: "next_action_at",
  // notes
  notes: "notes",
  note: "notes",
  comments: "notes",
  comment: "notes",
  description: "notes",
  remarks: "notes",
  message: "notes",
  details: "notes",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[\d\s().-]{7,20}$/;

function cellText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).trim();
}

function guessTargetFromHeader(header: string): LeadImportTarget | null {
  const key = normalizeKey(header);
  if (!key) return null;
  if (HEADER_SYNONYMS[key]) return HEADER_SYNONYMS[key];

  // Fuzzy contains-checks, most specific first.
  if (key.includes("email")) return "email";
  if (key.includes("phone") || key.includes("mobile") || key.includes("cell")) return "phone";
  if (key.includes("firstname")) return "first_name";
  if (key.includes("lastname") || key.includes("surname")) return "last_name";
  if (key.includes("company") || key.includes("organi") || key.includes("business")) return "company";
  if (key.includes("value") || key.includes("amount") || key.includes("budget") || key.includes("revenue")) {
    return "estimated_value";
  }
  if ((key.includes("next") || key.includes("follow")) && key.includes("date")) return "next_action_at";
  if (key.includes("source") || key.includes("channel")) return "source";
  if (key.includes("stage") || key.includes("status")) return "stage";
  if (
    key.includes("note") ||
    key.includes("comment") ||
    key.includes("remark") ||
    key.includes("desc") ||
    key.includes("message") ||
    key.includes("angle") ||
    key.includes("why")
  ) {
    return "notes";
  }
  if (key.endsWith("name") || key === "who") return "full_name";
  return null;
}

function guessTargetFromValues(values: string[]): LeadImportTarget | null {
  const sample = values.filter(Boolean).slice(0, 20);
  if (sample.length < 2) return null;
  const emailHits = sample.filter((v) => EMAIL_RE.test(v)).length;
  if (emailHits / sample.length >= 0.6) return "email";
  const phoneHits = sample.filter((v) => PHONE_RE.test(v) && /\d{7,}/.test(v.replace(/\D/g, ""))).length;
  if (phoneHits / sample.length >= 0.6) return "phone";
  return null;
}

/**
 * Find the header row inside the first rows of a sheet. Handles files that
 * open with a title/banner row before the real column headers.
 */
export function detectHeaderRowIndex(rows: unknown[][]): number {
  let bestIndex = 0;
  let bestScore = -1;
  const limit = Math.min(rows.length, 10);
  for (let i = 0; i < limit; i++) {
    const row = rows[i] ?? [];
    let score = 0;
    let filled = 0;
    for (const cell of row) {
      const text = cellText(cell);
      if (!text) continue;
      filled += 1;
      if (typeof cell === "string" && text.length <= 48) score += 1;
      if (HEADER_SYNONYMS[normalizeKey(text)]) score += 3;
    }
    if (filled >= 2 && score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }
  return bestIndex;
}

/** Map every file column to a crm_leads target, defaulting unknowns to notes. */
export function autoMapColumns(headerRow: unknown[], dataRows: unknown[][]): LeadImportColumn[] {
  const claimed = new Set<LeadImportTarget>();
  const singleUse: LeadImportTarget[] = [
    "full_name",
    "first_name",
    "last_name",
    "company",
    "email",
    "phone",
    "source",
    "stage",
    "estimated_value",
    "next_action_at",
  ];

  return headerRow.map((rawHeader, index) => {
    const header = cellText(rawHeader) || `Column ${index + 1}`;
    const values = dataRows.map((row) => cellText(row?.[index]));
    let target = guessTargetFromHeader(header) ?? guessTargetFromValues(values) ?? "notes";
    // First column wins a contested single-value field; later ones keep the
    // data by falling back to notes instead of silently overwriting.
    if (singleUse.includes(target)) {
      if (claimed.has(target)) target = "notes";
      else claimed.add(target);
    }
    const sample = values.find(Boolean) ?? "";
    return { index, header, target, sample };
  });
}

export function normalizeStageValue(value: unknown): string {
  const key = normalizeKey(value);
  if (!key) return "new";
  if (LEAD_IMPORT_STAGES.includes(key)) return key;
  // Negations first — "not contacted" must not match the "contacted" check.
  if (/(notcontacted|uncontacted|nocontact|notyet|untouched|cold)/.test(key)) return "new";
  if (/(closedwon|customer|converted|signed|active)/.test(key)) return "won";
  if (/(notinterested|closedlost|dead|disqualified|unqualified|churn|lost)/.test(key)) return "lost";
  if (/(proposal|quote|negotiat|pending|contract)/.test(key)) return "proposal";
  if (/(qualified|sql|mql|interested|opportunity|discovery|hot)/.test(key)) return "qualified";
  if (/(contacted|attempted|reached|outreach|emailed|called|working|inprogress|followup|warm)/.test(key)) {
    return "contacted";
  }
  return "new";
}

export function normalizeSourceValue(value: unknown): string {
  const key = normalizeKey(value);
  if (!key) return "other";
  if (LEAD_IMPORT_SOURCES.includes(key)) return key;
  if (/(website|webform|web|form|online|site)/.test(key)) return "website_form";
  if (/(referral|referred|wordofmouth|introduction)/.test(key)) return "referral";
  if (/broker/.test(key)) return "broker";
  if (/(event|tradeshow|conference|airshow|expo)/.test(key)) return "event";
  if (/(manual|direct)/.test(key)) return "manual";
  return "other";
}

export function parseMoneyValue(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) && value >= 0 ? Math.round(value * 100) / 100 : null;
  const text = cellText(value).toLowerCase().replace(/usd|\$|,|\s/g, "");
  if (!text) return null;
  const multiplier = text.endsWith("m") ? 1_000_000 : text.endsWith("k") ? 1_000 : 1;
  const numeric = Number.parseFloat(multiplier === 1 ? text : text.slice(0, -1));
  if (!Number.isFinite(numeric) || numeric < 0) return null;
  return Math.round(numeric * multiplier * 100) / 100;
}

export function parseDateValue(value: unknown): string | null {
  let date: Date | null = null;
  if (value instanceof Date) {
    date = value;
  } else if (typeof value === "number" && value > 25569 && value < 73050) {
    // Excel serial date (1970–2100 window); epoch offset of 25569 days.
    date = new Date(Math.round((value - 25569) * 86400 * 1000));
  } else {
    const text = cellText(value);
    if (text) {
      const parsed = new Date(text);
      if (!Number.isNaN(parsed.getTime())) date = parsed;
    }
  }
  if (!date || Number.isNaN(date.getTime())) return null;
  const year = date.getUTCFullYear();
  if (year < 1990 || year > 2100) return null;
  return date.toISOString();
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

export type LeadImportBuildResult = {
  rows: LeadImportRow[];
  skipped: number;
};

/** Turn raw sheet rows + a confirmed column mapping into normalized leads. */
export function buildLeadImportRows(
  dataRows: unknown[][],
  columns: LeadImportColumn[]
): LeadImportBuildResult {
  const rows: LeadImportRow[] = [];
  let skipped = 0;

  for (const raw of dataRows) {
    if (!raw || raw.every((cell) => !cellText(cell))) continue;

    const fields: Partial<Record<LeadImportTarget, string>> = {};
    const noteLines: string[] = [];
    let rawValue: unknown = null;
    let rawDate: unknown = null;

    for (const column of columns) {
      const value = raw[column.index];
      const text = cellText(value);
      if (!text) continue;
      switch (column.target) {
        case "skip":
          break;
        case "notes":
          noteLines.push(
            HEADER_SYNONYMS[normalizeKey(column.header)] === "notes"
              ? text
              : `${column.header}: ${text}`
          );
          break;
        case "estimated_value":
          rawValue = value;
          break;
        case "next_action_at":
          rawDate = value;
          break;
        default:
          if (!fields[column.target]) fields[column.target] = text;
      }
    }

    const fullName =
      fields.full_name ??
      [fields.first_name, fields.last_name].filter(Boolean).join(" ").trim() ??
      "";
    const email = (fields.email ?? "").toLowerCase();
    const resolvedName = fullName || fields.company || email;
    if (!resolvedName) {
      skipped += 1;
      continue;
    }

    rows.push({
      full_name: truncate(resolvedName, 200),
      company: fields.company ? truncate(fields.company, 200) : null,
      email: EMAIL_RE.test(email) ? truncate(email, 320) : null,
      phone: fields.phone ? truncate(fields.phone, 50) : null,
      source: normalizeSourceValue(fields.source),
      stage: normalizeStageValue(fields.stage),
      estimated_value: parseMoneyValue(rawValue),
      next_action_at: parseDateValue(rawDate),
      notes: noteLines.length ? truncate(noteLines.join("\n"), 4000) : null,
    });
  }

  return { rows, skipped };
}

/**
 * Server-side re-validation of a client-supplied row. Returns null when the
 * row cannot be salvaged (no name), otherwise a fully normalized lead.
 */
export function sanitizeLeadImportRow(input: unknown): LeadImportRow | null {
  if (!input || typeof input !== "object") return null;
  const row = input as Record<string, unknown>;
  const fullName = cellText(row.full_name);
  if (!fullName) return null;
  const email = cellText(row.email).toLowerCase();
  const company = cellText(row.company);
  const phone = cellText(row.phone);
  const notes = cellText(row.notes);
  const stage = normalizeStageValue(row.stage);

  return {
    full_name: truncate(fullName, 200),
    company: company ? truncate(company, 200) : null,
    email: EMAIL_RE.test(email) ? truncate(email, 320) : null,
    phone: phone ? truncate(phone, 50) : null,
    source: normalizeSourceValue(row.source),
    stage: LEAD_IMPORT_STAGES.includes(stage) ? stage : "new",
    estimated_value: parseMoneyValue(row.estimated_value),
    next_action_at: parseDateValue(row.next_action_at),
    notes: notes ? truncate(notes, 4000) : null,
  };
}
