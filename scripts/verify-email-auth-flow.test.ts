import assert from "node:assert/strict";
import fs from "node:fs";

import { getSiteUrl } from "../lib/site-url";
import { normalizeEmailVerificationToken } from "../lib/auth/email-verification";

function withEnv<T>(
  env: Partial<Pick<NodeJS.ProcessEnv, "NEXT_PUBLIC_APP_URL" | "VERCEL_URL">>,
  callback: () => T
): T {
  const previous = {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    VERCEL_URL: process.env.VERCEL_URL,
  };

  process.env.NEXT_PUBLIC_APP_URL = env.NEXT_PUBLIC_APP_URL;
  process.env.VERCEL_URL = env.VERCEL_URL;

  try {
    return callback();
  } finally {
    process.env.NEXT_PUBLIC_APP_URL = previous.NEXT_PUBLIC_APP_URL;
    process.env.VERCEL_URL = previous.VERCEL_URL;
  }
}

withEnv({ NEXT_PUBLIC_APP_URL: "amgaviationgroup.com/" }, () => {
  assert.equal(getSiteUrl(), "https://amgaviationgroup.com");
});

withEnv({ NEXT_PUBLIC_APP_URL: "", VERCEL_URL: "amg1-preview.vercel.app" }, () => {
  assert.equal(getSiteUrl(), "https://amg1-preview.vercel.app");
});

withEnv({ NEXT_PUBLIC_APP_URL: "", VERCEL_URL: "" }, () => {
  assert.equal(getSiteUrl(), "http://localhost:3000");
});

assert.equal(normalizeEmailVerificationToken(" 123 456 "), "123456");
assert.equal(normalizeEmailVerificationToken("abcDEF123456_-"), "abcDEF123456_-");
assert.equal(normalizeEmailVerificationToken("12345"), null);
assert.equal(normalizeEmailVerificationToken("abc+123"), null);

const authActions = fs.readFileSync("app/portal/actions/auth.ts", "utf8");
assert.match(
  authActions,
  /emailRedirectTo:\s*`\$\{getSiteUrl\(\)\}\/verify-email\?email=\$\{encodeURIComponent\(email\)\}`/,
  "signup confirmation redirect must open the OTP form with the email prefilled"
);
assert.match(authActions, /verifyOtp\(\{[\s\S]*email,[\s\S]*token,[\s\S]*type:\s*"email"/);
assert.match(authActions, /await supabase\.auth\.signOut\(\);[\s\S]*redirect\("\/pending-approval\?verified=1"\);/);
assert.match(authActions, /auth\.resend\(\{[\s\S]*type:\s*"signup"[\s\S]*email,[\s\S]*emailRedirectTo:/);
assert.match(authActions, /temporaryAccessRequestPassword\(\)/);
assert.match(authActions, /isMissingProfileInvitationColumnError/);
assert.doesNotMatch(
  authActions,
  /randomUUID\(\)\}-\$\{randomUUID\(\)/,
  "temporary access-request passwords must stay under Supabase Auth's 72-character limit"
);

const setupDoc = fs.readFileSync("docs/SUPABASE_AUTH_EMAIL_SETUP.md", "utf8");
const templateMatch = setupDoc.match(/HTML template:\n\n```html\n([\s\S]*?)\n```/);
assert.ok(templateMatch, "Supabase setup doc must include the confirm signup HTML template");
const template = templateMatch[1];
assert.match(template, /Verify your AMG Connect email/);
assert.match(template, /Use the verification code below to verify your AMG Connect account\./);
assert.match(template, /Enter this code on the AMG verification page\./);
assert.match(template, /\{\{ \.Token \}\}/);
assert.match(template, /font-size:38px/);
assert.match(template, /href="\{\{ \.RedirectTo \}\}"/);
assert.doesNotMatch(template, /ConfirmationURL|TokenHash|token_hash|access_token/i);

const verifyPage = fs.readFileSync("app/(public)/verify-email/page.tsx", "utf8");
assert.match(verifyPage, /Email Address/);
assert.match(verifyPage, /Verification Code/);
assert.doesNotMatch(verifyPage, /6-digit/);
assert.match(verifyPage, /Verify Email/);
assert.match(verifyPage, /Resend Verification Code/);

console.log("verify-email-auth-flow checks passed");
