import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CSV_HEADERS,
  normalizeCrewCsvRow,
  parseBoolean,
  parseCsv,
  parseFlightTime,
} from "./import-crew-profiles-from-csv";

test("parseCsv reads quoted commas and preserves all required headers", () => {
  const csv = `${CSV_HEADERS.join(",")}\nTimothy,Buck,"ATP, CFI",1200,"Citation, Phenom",tim@example.com,555-1000,,,,,,,,,,,,,,,,,,,,`;
  const rows = parseCsv(csv);

  assert.equal(rows.length, 1);
  assert.equal(rows[0]["First Name"], "Timothy");
  assert.equal(rows[0]["Certificates/Ratings"], "ATP, CFI");
  assert.equal(rows[0]["Aircraft/Type Experience"], "Citation, Phenom");
});

test("normalizeCrewCsvRow maps CSV fields, booleans, numbers, and import metadata", () => {
  const row = Object.fromEntries(CSV_HEADERS.map((header) => [header, ""]));
  row["First Name"] = " Stan ";
  row["Last Name"] = " Jones ";
  row["Email 1"] = "STAN@example.COM ";
  row["Total Time"] = "1,250.5";
  row["PIC Time"] = "bad";
  row["Reviewed"] = "Yes";
  row["Approved"] = "No";
  row["Priority Candidate"] = "checked";
  row["Needs Manual Review"] = "";
  row["Aircraft/Type Experience"] = "Gulfstream GIV; Citation XLS";

  const normalized = normalizeCrewCsvRow(row, {
    importBatchId: "batch-123",
    importSource: "Pilot Network (MASTER) - All Pilots.csv",
    rowNumber: 2,
  });

  assert.equal(normalized.valid, true);
  assert.equal(normalized.profile.email, "stan@example.com");
  assert.equal(normalized.profile.full_name, "Stan Jones");
  assert.equal(normalized.profile.status, "pending");
  assert.equal(normalized.crewProfile.total_time, 1250.5);
  assert.equal(normalized.crewProfile.pic_time, null);
  assert.equal(normalized.crewProfile.reviewed, true);
  assert.equal(normalized.crewProfile.approved, false);
  assert.equal(normalized.crewProfile.priority_candidate, true);
  assert.equal(normalized.crewProfile.import_batch_id, "batch-123");
  assert.deepEqual(normalized.crewProfile.preferred_aircraft, ["Gulfstream GIV", "Citation XLS"]);
});

test("normalizeCrewCsvRow skips rows with no name and flags missing contact data", () => {
  const blank = Object.fromEntries(CSV_HEADERS.map((header) => [header, ""]));
  assert.equal(normalizeCrewCsvRow(blank, { importBatchId: "b", importSource: "s", rowNumber: 3 }).valid, false);

  const row = { ...blank, "First Name": "Victor", "Last Name": "Ko" };
  const normalized = normalizeCrewCsvRow(row, { importBatchId: "b", importSource: "s", rowNumber: 4 });
  assert.equal(normalized.valid, true);
  assert.equal(normalized.flagged, true);
  assert.equal(normalized.crewProfile.needs_manual_review, true);
});

test("parseBoolean and parseFlightTime use import-safe coercion", () => {
  assert.equal(parseBoolean("Y"), true);
  assert.equal(parseBoolean("checked"), true);
  assert.equal(parseBoolean("0"), false);
  assert.equal(parseBoolean(""), false);
  assert.equal(parseFlightTime("2,400"), 2400);
  assert.equal(parseFlightTime("n/a"), null);
});
