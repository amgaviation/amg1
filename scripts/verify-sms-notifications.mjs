import fs from "node:fs";

const requiredFiles = [
  "lib/portal/phone-verification.ts",
  "app/portal/actions/phone-verification.ts",
  "components/portal/sms-settings-card.tsx",
  "supabase/migrations/20260705230000_sms_phone_verification.sql",
];

function assert(condition, message) {
  if (!condition) {
    console.error(`sms verification failed: ${message}`);
    process.exit(1);
  }
}

for (const file of requiredFiles) {
  assert(fs.existsSync(file), `missing ${file}`);
}

const migration = fs.readFileSync(
  "supabase/migrations/20260705230000_sms_phone_verification.sql",
  "utf8",
);
for (const column of [
  "phone_verified_at",
  "phone_verification_sent_at",
  "phone_verification_code_hash",
  "phone_verification_expires_at",
  "phone_verification_attempts",
  "sms_notifications_enabled",
]) {
  assert(migration.includes(column), `migration missing ${column}`);
}
assert(
  migration.includes("profiles_reset_phone_verification"),
  "migration missing phone-change reset trigger",
);

const verification = fs.readFileSync("lib/portal/phone-verification.ts", "utf8");
assert(verification.includes("TWILIO_VERIFY_SERVICE_SID"), "verification lib missing Twilio Verify support");
assert(verification.includes("timingSafeEqual"), "fallback code check must be constant-time");
assert(!/`\$\{code\}`.*console/.test(verification), "verification code must never be logged");
assert(verification.includes("normalizePhoneE164"), "verification lib missing E.164 normalization");

const delivery = fs.readFileSync("lib/portal/notification-delivery.ts", "utf8");
assert(delivery.includes("phone_verified_at"), "SMS delivery must require a verified phone");
assert(delivery.includes("sms_notifications_enabled"), "SMS delivery must honor the opt-out preference");

const card = fs.readFileSync("components/portal/sms-settings-card.tsx", "utf8");
assert(card.includes("one-time-code"), "code field missing one-time-code autocomplete");

const settingsPages = [
  "app/portal/client/settings/page.tsx",
  "app/portal/crew/settings/page.tsx",
  "app/portal/partner/profile/page.tsx",
  "app/portal/admin/settings/page.tsx",
];
for (const page of settingsPages) {
  const source = fs.readFileSync(page, "utf8");
  assert(source.includes("SmsSettingsCard"), `${page} missing SMS settings card`);
  assert(source.includes("SmsSettingsNotices"), `${page} missing SMS notices`);
}

for (const envFile of [".env.example", ".env.local.example"]) {
  const env = fs.readFileSync(envFile, "utf8");
  assert(env.includes("TWILIO_VERIFY_SERVICE_SID"), `${envFile} missing TWILIO_VERIFY_SERVICE_SID`);
}

console.log("sms verification + notification contract checks passed");
