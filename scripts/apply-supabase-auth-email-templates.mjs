const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || "vsynqnqlouvphiniqaiy";
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

const BRAND = {
  navy: "#050B14",
  deep: "#07111F",
  blue: "#3B82F6",
  slate: "#9CA3AF",
  light: "#C0C7D1",
  white: "#FFFFFF",
  siteUrl: "https://www.amgaviationgroup.com",
  company: "AMG Aviation Group",
};

function confirmUrl(type) {
  return `${BRAND.siteUrl}/auth/confirm?token_hash={{ .TokenHash }}&type=${type}&redirect_to={{ .RedirectTo }}`;
}

function shell({ eyebrow, title, body, code, ctaLabel, ctaHref, smallText }) {
  const codeBlock = code
    ? `
      <div style="margin:28px 0;padding:24px 22px;border-radius:16px;background:${BRAND.navy};border:1px solid rgba(59,130,246,0.48);text-align:center;">
        <div style="color:${BRAND.slate};font-size:11px;letter-spacing:0.16em;text-transform:uppercase;margin-bottom:10px;font-weight:700;">Verification code</div>
        <div style="color:${BRAND.white};font-family:'SFMono-Regular','Roboto Mono','Courier New',monospace;font-size:38px;line-height:1.1;letter-spacing:0.24em;font-weight:800;">${code}</div>
      </div>`
    : "";

  const cta = ctaLabel && ctaHref
    ? `
      <a href="${ctaHref}" style="display:inline-block;background:${BRAND.blue};color:${BRAND.white};text-decoration:none;border-radius:999px;padding:14px 22px;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">${ctaLabel}</a>`
    : "";

  return `<div style="margin:0;padding:0;background:${BRAND.navy};color:${BRAND.white};font-family:Inter,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="border:1px solid rgba(192,199,209,0.18);background:${BRAND.deep};border-radius:20px;padding:32px;box-shadow:0 24px 70px rgba(0,0,0,0.34);">
      <p style="margin:0 0 12px;color:${BRAND.blue};font-size:12px;letter-spacing:0.16em;text-transform:uppercase;font-weight:700;">${eyebrow}</p>
      <h1 style="margin:0 0 16px;color:${BRAND.white};font-size:30px;line-height:1.18;font-weight:700;">${title}</h1>
      <p style="margin:0 0 20px;color:${BRAND.light};font-size:15px;line-height:1.6;">${body}</p>
      ${codeBlock}
      ${smallText ? `<p style="margin:0 0 22px;color:${BRAND.light};font-size:14px;line-height:1.6;">${smallText}</p>` : ""}
      ${cta}
      <p style="margin:28px 0 0;color:${BRAND.slate};font-size:12px;line-height:1.6;">If you did not request this AMG Connect email, you can ignore this message or contact AMG Operations.</p>
    </div>
    <p style="margin:18px 0 0;color:${BRAND.slate};font-size:11px;text-align:center;">${BRAND.company}</p>
  </div>
</div>`;
}

const payload = {
  mailer_subjects_confirmation: "Verify your AMG Connect email",
  mailer_templates_confirmation_content: shell({
    eyebrow: "AMG Connect Verification",
    title: "Verify your AMG Connect email",
    body: "Use the verification code below to verify your AMG Connect account.",
    code: "{{ .Token }}",
    ctaLabel: "Open verification page",
    ctaHref: "{{ .RedirectTo }}",
    smallText: "Enter this code on the AMG verification page.",
  }),

  mailer_subjects_invite: "Set up AMG Connect access",
  mailer_templates_invite_content: shell({
    eyebrow: "AMG Connect Invitation",
    title: "Set up your AMG Connect access",
    body: "AMG Aviation Group has created a secure portal access invitation for your account.",
    ctaLabel: "Set up access",
    ctaHref: confirmUrl("invite"),
    smallText: "This secure link opens the AMG portal setup page.",
  }),

  mailer_subjects_magic_link: "Your AMG Connect sign-in code",
  mailer_templates_magic_link_content: shell({
    eyebrow: "AMG Connect Sign In",
    title: "Your AMG Connect sign-in code",
    body: "Use the one-time code below to continue to AMG Connect, or open the secure AMG sign-in page.",
    code: "{{ .Token }}",
    ctaLabel: "Open AMG Connect",
    ctaHref: confirmUrl("magiclink"),
    smallText: "This code and secure link expire shortly.",
  }),

  mailer_subjects_email_change: "Confirm your AMG Connect email change",
  mailer_templates_email_change_content: shell({
    eyebrow: "AMG Connect Email Change",
    title: "Confirm your new AMG Connect email",
    body: "Confirm that {{ .NewEmail }} should be used for your AMG Connect account.",
    ctaLabel: "Confirm email change",
    ctaHref: confirmUrl("email_change"),
    smallText: "If you did not request this change, do not open the confirmation button.",
  }),

  mailer_subjects_recovery: "Reset your AMG Connect password",
  mailer_templates_recovery_content: shell({
    eyebrow: "AMG Connect Password Reset",
    title: "Reset your AMG Connect password",
    body: "Use the secure AMG password reset page to create a new password for your account.",
    ctaLabel: "Reset password",
    ctaHref: confirmUrl("recovery"),
    smallText: "This password reset link expires shortly and can only be used once.",
  }),

  mailer_subjects_reauthentication: "{{ .Token }} is your AMG Connect verification code",
  mailer_templates_reauthentication_content: shell({
    eyebrow: "AMG Connect Security Check",
    title: "Verify your identity",
    body: "Use the verification code below to continue with this sensitive AMG Connect action.",
    code: "{{ .Token }}",
    smallText: "Enter this code in the AMG Connect security prompt.",
  }),
};

if (process.argv.includes("--print")) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(0);
}

if (!ACCESS_TOKEN) {
  console.error("SUPABASE_ACCESS_TOKEN is required to update hosted Supabase Auth templates.");
  console.error("Set SUPABASE_ACCESS_TOKEN and rerun: node scripts/apply-supabase-auth-email-templates.mjs");
  process.exit(1);
}

const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});

const text = await response.text();
if (!response.ok) {
  console.error(`Template update failed: ${response.status} ${response.statusText}`);
  console.error(text);
  process.exit(1);
}

console.log(`Updated AMG Auth email templates for project ${PROJECT_REF}.`);
