import { readFileSync } from "node:fs";

const files = {
  home: "app/(public)/page.tsx",
  about: "app/(public)/about/page.tsx",
  capabilities: "app/(public)/capabilities/page.tsx",
  crew: "app/(public)/crew-network/page.tsx",
  plans: "components/site/subscription-programs.tsx",
  contact: "app/(public)/contact/page.tsx",
};

function read(path) {
  return readFileSync(path, "utf8");
}

const source = Object.fromEntries(Object.entries(files).map(([key, path]) => [key, read(path)]));

const checks = [
  {
    name: "home hero uses the approved looping aviation video",
    pass: source.home.includes("IMG.generatedHeroVideo") && source.home.includes("<video"),
  },
  {
    name: "home core support cards include contextual image metadata",
    pass:
      source.home.includes("image: IMG.serviceContractPilot") &&
      source.home.includes("alt: \"Pilots reviewing flight details before aircraft support\""),
  },
  {
    name: "home process and audience sections include visual treatments",
    pass: source.home.includes("StepIcon") && source.home.includes("audienceVisuals"),
  },
  {
    name: "about principles and support desk use custom icons",
    pass: source.about.includes("principleIcons") && source.about.includes("supportDeskIcons"),
  },
  {
    name: "capabilities flow and support paths include contextual visuals",
    pass: source.capabilities.includes("modelStepIcons") && source.capabilities.includes("visual: IMG.serviceAircraftManagement"),
  },
  {
    name: "crew network steps and crew expectations include icon-led visuals",
    pass: source.crew.includes("requirementIcons") && source.crew.includes("benefitIcons"),
  },
  {
    name: "plans hero renders the configured aircraft-support image",
    pass: source.plans.includes("content?.image") && source.plans.includes("Aircraft support plan review visual"),
  },
  {
    name: "contact hero uses the contact operations background image",
    pass: source.contact.includes("hero.image") && source.contact.includes("Aircraft support request coordination desk"),
  },
];

const failed = checks.filter((check) => !check.pass);

for (const check of checks) {
  console.log(`${check.pass ? "PASS" : "FAIL"} ${check.name}`);
}

if (failed.length > 0) {
  console.error(`\n${failed.length} visual enrichment check(s) failed.`);
  process.exit(1);
}
