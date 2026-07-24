import type { Metadata } from "next";
import Link from "next/link";
import { HeadlineReveal } from "@/components/site/headline-reveal";

export const metadata: Metadata = {
  title: "How Support Requests Work — AMG Aviation Group",
  description: "A manual review process for Part 91 pilot coverage, maintenance ferry and repositioning coordination, insurance-related pilot needs, and flight-department overflow.",
};

const STEPS = [
  ["Submit the facts", "Share the aircraft, timing, requested support, and any insurance or operating context you have."],
  ["AMG reviews the scope", "AMG assesses the request before discussing availability, pricing, or a possible support path."],
  ["Clarify and document", "If the request can proceed, AMG identifies the information, approvals, and written terms needed for the next step."],
  ["Confirm separately", "Any accepted scope, crew arrangement, invoice, or aircraft movement is confirmed separately. Owners and operators retain operational control."],
] as const;

export default function HowItWorksPage() {
  return <>
    <section className="pub-hero oc-shell pb-12 pt-[calc(var(--public-header-height)+4rem)]"><div className="max-w-3xl" data-stagger-container><p className="oc-eyebrow" data-stagger-item>Manual support review</p><HeadlineReveal className="oc-display mt-4 text-5xl text-[var(--oc-paper)] sm:text-6xl" lines={["A clear path from request", "to reviewed next step."]} /><p className="mt-6 text-lg leading-relaxed text-[var(--oc-aluminum)]" data-stagger-item>AMG handles current support requests directly. This page explains the review process; it does not promise availability, acceptance, or a response time.</p></div></section>
    <section className="oc-section pt-8"><div className="oc-shell max-w-5xl"><div className="border-t border-[rgba(169,180,198,0.14)]">{STEPS.map(([title, body], index) => <article key={title} className="grid gap-4 border-b border-[rgba(169,180,198,0.14)] py-8 md:grid-cols-[4rem_1fr] md:gap-8"><span className="font-mono text-sm tracking-[0.16em] text-[var(--amber)]">{String(index + 1).padStart(2, "0")}</span><div><h2 className="oc-display text-2xl text-[var(--oc-paper)]">{title}</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--oc-aluminum)]">{body}</p></div></article>)}</div><div className="oc-card-dark mt-10 p-6"><p className="text-sm leading-6 text-[var(--oc-aluminum)]">AMG does not operate aircraft or provide air transportation. A support request does not create an accepted assignment, confirmed service, or operational commitment.</p><Link href="/request" className="oc-btn oc-btn-light mt-6">Request Support</Link></div></div></section>
  </>;
}
