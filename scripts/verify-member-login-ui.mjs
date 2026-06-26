import { readFileSync } from "node:fs";

const source = readFileSync("components/site/portal-login.tsx", "utf8");

const checks = [
  {
    name: "login uses the branded portal background image through Next Image",
    pass: source.includes("import Image from \"next/image\"") && source.includes("IMG.generatedConnectDashboard"),
  },
  {
    name: "login includes role-based access rail content",
    pass: source.includes("accessStats") && source.includes("Role-based visibility"),
  },
  {
    name: "form controls use the shared secure input treatment",
    pass: source.includes("secureInputClass") && source.includes("focus-visible:ring-2"),
  },
  {
    name: "mode switch is styled as the primary access decision control",
    pass: source.includes("portal-login-mode-switch") && source.includes("aria-pressed={isSignIn}"),
  },
  {
    name: "trust and limitation copy remains visible",
    pass: source.includes("Portal access is limited to approved users") && source.includes("support acceptance"),
  },
];

const failed = checks.filter((check) => !check.pass);

for (const check of checks) {
  console.log(`${check.pass ? "PASS" : "FAIL"} ${check.name}`);
}

if (failed.length > 0) {
  console.error(`\n${failed.length} member login UI check(s) failed.`);
  process.exit(1);
}
