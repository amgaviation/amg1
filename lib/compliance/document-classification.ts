import {
  DOCUMENT_ACCESS_LEVELS,
  DOCUMENT_CATEGORIES,
  SENSITIVE_DOCUMENT_CATEGORIES,
  type DocumentAccessLevel,
  type DocumentCategory,
} from "@/lib/compliance/config";

const categoryMap: Record<string, DocumentCategory> = {
  "aircraft registration": "aircraft_document",
  "insurance certificate": "insurance",
  "maintenance record": "maintenance_record",
  "logbook excerpt": "maintenance_record",
  "pilot certificate": "pilot_certificate",
  "medical certificate": "pilot_medical",
  "passport": "passenger_requester_document",
  "driver license": "passenger_requester_document",
  "w-9": "w9",
  "w9": "w9",
  "contract": "contract",
  "quote": "quote",
  "invoice": "invoice",
  "receipt": "receipt",
  "other": "other",
};

export function normalizeDocumentCategory(value: string | null | undefined): DocumentCategory {
  const raw = String(value ?? "").trim().toLowerCase();
  if ((DOCUMENT_CATEGORIES as readonly string[]).includes(raw)) return raw as DocumentCategory;
  return categoryMap[raw] ?? "other";
}

export function normalizeDocumentAccessLevel(value: string | null | undefined, fallback: DocumentAccessLevel): DocumentAccessLevel {
  const raw = String(value ?? "").trim().toLowerCase();
  if ((DOCUMENT_ACCESS_LEVELS as readonly string[]).includes(raw)) return raw as DocumentAccessLevel;
  return fallback;
}

export function isSensitiveDocumentCategory(category: string | null | undefined) {
  return SENSITIVE_DOCUMENT_CATEGORIES.has(normalizeDocumentCategory(category));
}
