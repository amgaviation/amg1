import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";

/**
 * Guard for the launch-kit documents.
 *
 * An adversarial review (docs/launch-kit/00-REVIEW.md) found 27 issues, five at
 * STOP severity. Those five are fixed. This asserts they stay fixed — every one
 * of them was a phrase that read naturally and was wrong, which is exactly the
 * kind of thing that comes back during an edit.
 *
 * Scanned: the numbered operating documents (01-09) — the ones a customer, a
 * pilot, or a broker actually sees.
 *
 * Not scanned: `00-REVIEW.md` and `README.md`. Both quote the banned phrasing
 * verbatim in order to explain why it was removed, and an assertion that fires
 * on its own documentation is a false positive, not a finding. This is the same
 * trap that made the first version of verify-revenue-sprint.mjs fail on the
 * pricing page's "no subscription".
 *
 * Run: npm run launch-kit:verify
 */

const KIT = new URL("../docs/launch-kit/", import.meta.url);
const read = (name) => readFile(new URL(name, KIT), "utf8");

const META = new Set(["00-REVIEW.md", "README.md"]);
const names = (await readdir(KIT)).filter((f) => f.endsWith(".md") && !META.has(f));
const docs = Object.fromEntries(
  await Promise.all(names.map(async (n) => [n, await read(n)])),
);

/** Every doc except the review, as one string, for kit-wide bans. */
const all = Object.entries(docs);

function banEverywhere(pattern, message) {
  for (const [name, text] of all) {
    assert.doesNotMatch(text, pattern, `${name}: ${message}`);
  }
}

/**
 * Ban a phrase only where it is ASSERTED, not where a document forbids it.
 *
 * Several rules in this kit are written as "Never say X" — the ban and its own
 * statement look identical to a plain regex. Fires only when the phrase is not
 * preceded, within the same sentence, by a negation.
 */
function banAssertedUse(phrase, message) {
  const NEGATED = /\b(never|not|no|don't|do not|avoid|rather than|instead of)\b[^.!?\n]{0,80}$/i;
  for (const [name, text] of all) {
    const re = new RegExp(phrase.source, phrase.flags.includes("g") ? phrase.flags : phrase.flags + "g");
    for (const m of text.matchAll(re)) {
      const before = text.slice(Math.max(0, m.index - 120), m.index);
      assert.ok(NEGATED.test(before), `${name}: ${message} — at ${JSON.stringify(m[0])}`);
    }
  }
}

// --- STOP 1: the take-rate arithmetic ------------------------------------
// The 25-30% cap applies to the day-scaled portion, never to the base. A cap
// stated as unconditional is unreachable on any one- or two-day job at
// published rates, and a King Air owner with a calculator finds that in about
// ninety seconds.
banEverywhere(
  /35% take on a one-day ferry/i,
  "reinstated the 35% one-day take rate, which no published band produces",
);
banEverywhere(
  /65[–-]80% of pilot spend/i,
  "reinstated the 65-80% figure; the honest number against pilot spend is 75-90%",
);
banEverywhere(
  /I'm never taking more than about a quarter/i,
  "states the cap to the customer as unconditional; it applies past day two only",
);
assert.match(
  docs["03-capability-one-pager-and-proposal.md"],
  /Days 1[–-]2 are a flat minimum/,
  "03: the flat-minimum explanation for days 1-2 was removed",
);

// --- STOP 2: AMG does not clear, launch, fly, or move anything ------------
// A signed, dated "cleared to launch" line is the best operational-control
// exhibit a plaintiff could ask for. Withholding AMG's own service is fine
// ("no email, no flight"); releasing a flight is not.
banEverywhere(/CLEARED TO LAUNCH/i, "AMG cannot clear a flight to launch");
banEverywhere(/launch authorized/i, "AMG cannot authorize a launch");
banEverywhere(/I don't fly anybody/i, "AMG does not fly anyone; the PIC does");
banEverywhere(/I don't launch anybody/i, "AMG does not launch anyone; the PIC does");
banEverywhere(
  /going to move your airplane without it/i,
  "AMG does not move aircraft; it puts a pilot in front of one",
);
assert.match(
  docs["02-insurance-gate-and-trip-file.md"],
  /AMG COORDINATION COMPLETE/,
  "02: the gate must close on coordination complete, not on a launch release",
);

// --- STOP 3: the fee vs the gate that can kill the job --------------------
// Taking the whole fee before the underwriter step means holding money on a job
// about to die, with no term covering it.
assert.match(
  docs["01-coordination-services-agreement.md"],
  /Fifty percent \(50%\) of the fee is due on execution/,
  "01: the 50/50 fee split was removed",
);
assert.match(
  docs["01-coordination-services-agreement.md"],
  /declines to approve any pilot AMG presents/,
  "01: the underwriter-decline term was removed — the most likely job-killing event",
);
banEverywhere(
  /due \[net 15 \/ on completion\]/i,
  "reinstated payment terms that contradict the agreement",
);
banEverywhere(
  /Terms are fine on my coordination fee/i,
  "offers to negotiate terms the agreement fixes",
);

// --- STOP 4: the prepaid block --------------------------------------------
assert.match(
  docs["08-first-90-days.md"],
  /Blocked until counsel delivers a block agreement/,
  "08: the block gate was removed — do not sell a prepayment against a document that does not exist",
);
assert.match(
  docs["01-coordination-services-agreement.md"],
  /Prepaid coordination credit agreement/,
  "01: the block agreement was dropped from the counsel engagement",
);

// --- STOP 5: never sell what the bench cannot staff -----------------------
banEverywhere(
  /insurance-approved pilot exists before the phone call/i,
  "claims pre-approval; broker approval is always trip-specific and always after the call",
);
banEverywhere(
  /\$895 flat for turboprop and light jet/i,
  "quotes light jet pricing in a day-one email before the bench can staff it",
);
assert.match(
  docs["06-pilot-bench-recruiting.md"],
  /This rule binds documents 03 and 05 as well as this one/,
  "06: the three-deep rule no longer binds the customer-facing documents",
);
assert.match(
  docs["03-capability-one-pager-and-proposal.md"],
  /accepted only where AMG can staff it/,
  "03: the staffing caveat was removed from the price table",
);

// --- Kit-wide invariants, same as the public site -------------------------
banAssertedUse(
  /\bpassed[- ]through at cost with receipts\b/i,
  "asserts the pass-through billing model; the owner pays the pilot directly",
);
banAssertedUse(
  /\bwe verify the pilot\b/i,
  "claims verification as a product, which creates an uninsured duty of care",
);

// --- HIGH/MEDIUM findings 6-23 -------------------------------------------
// Each was a sentence that read naturally and was wrong. They come back during
// an edit unless something is watching.
banEverywhere(
  /is a claim that gets paid/i,
  "promises a coverage outcome; only the carrier can say how a claim is handled",
);
banEverywhere(
  /I don't have pilots|I don't keep a bench/i,
  "false to a customer and contradicted by documents 06 and 07",
);
banEverywhere(/58% of replies/i, "cites a reply rate AMG has never measured");
banEverywhere(
  /about half the departments I talk to/i,
  "claims a survey of flight departments that did not happen",
);
banEverywhere(/\bPre-dispatch\b/i, "uses 'dispatch', which the kit bans");
banEverywhere(
  /AMG supplies coordination and, on request, a pilot's labor/i,
  "reads as furnishing crew; AMG furnishes neither aircraft nor crew",
);
banEverywhere(
  /I can have a qualified pilot committed today/i,
  "promises a third party's availability",
);
banEverywhere(
  /discount toward \$350/i,
  "improvises a piston price below the published one; see the README open decision",
);
banEverywhere(
  /Do not sign it or send it to a customer until counsel has cleared it/i,
  "forbids what document 08 instructs; the header becomes the exhibit, not the shield",
);
banEverywhere(
  /Then Gate 5 applies/i,
  "wrong gate cross-reference — the SIC gate is Gate 4",
);
banEverywhere(
  /COUNTIF\(\$R:\$R,"Yes"\)\/COUNTA\(\$A:\$A\)-1/,
  "operator-precedence bug: divides then subtracts, negative forever",
);
assert.match(
  docs["01-coordination-services-agreement.md"],
  /may be sent to a prospective customer and signed only if all of the following are true/,
  "01: the conditional send rule was removed",
);

console.log(
  `Launch kit: ${names.length} documents checked. All five STOP findings from 00-REVIEW.md remain fixed.`,
);
