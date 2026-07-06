import type { NetworkApplicationStatus } from "@/lib/portal/network-application-constants";

/**
 * Decision-email copy for the Crew Network review workflow.
 *
 * PURE module — no server imports — so the admin review UI can render the
 * exact email in a confirmation modal before sending, and the server wraps
 * the same copy in amgEmailLayout() for the HTML send. One source of truth;
 * keep the two consumers in lib/portal/network-applications.ts and
 * app/portal/admin/network-applications/[id]/status-review-form.tsx.
 */

export const NETWORK_EMAIL_DISCLAIMER =
  "Submission, review, or approval does not guarantee assignment, compensation, contractor status, employment status, or future engagement.";

export type DecisionEmailSection = { title?: string; body: string };

export type DecisionEmailCopy = {
  subject: string;
  intro: string;
  sections: DecisionEmailSection[];
  cta?: { label: string; note?: string } | null;
};

export function firstNameOf(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || fullName;
}

/** Template key for a status's globally editable override (Settings → Email
 * Templates), or null when the status has no decision email of its own. */
export function networkDecisionTemplateKey(status: NetworkApplicationStatus): string | null {
  if (status === "approved") return "network_app_approved";
  if (status === "denied") return "network_app_denied";
  if (status === "waitlist") return "network_app_waitlist";
  if (status === "awaiting_review" || status === "in_review") return "network_app_in_review";
  if (status === "other") return "network_app_other";
  return null;
}

/** Fill {{token}} placeholders; unknown tokens are left untouched. */
export function mergeTemplateTokens(
  template: string,
  variables: Record<string, string | null | undefined>
): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (token, key: string) => {
    const value = variables[key];
    return value === null || value === undefined || value === "" ? token : String(value);
  });
}

/** The reason text a decision template's {{reason}} resolves to. */
export function decisionReasonFor(input: {
  status: NetworkApplicationStatus;
  denialReason?: string | null;
  otherStatusReason?: string | null;
}): string {
  if (input.status === "denied") {
    return input.denialReason?.trim() || "Your experience profile does not align with the positions we are currently staffing.";
  }
  return input.otherStatusReason?.trim() || "AMG Operations has updated your crew-network application status.";
}

/**
 * Build the copy for a status email. Returns null for statuses that keep
 * their existing template (additional_information_needed) or send nothing.
 */
export function buildNetworkDecisionEmailCopy(input: {
  status: NetworkApplicationStatus;
  fullName: string;
  denialReason?: string | null;
  otherStatusReason?: string | null;
}): DecisionEmailCopy | null {
  const name = firstNameOf(input.fullName);

  if (input.status === "approved") {
    return {
      subject: "You're Approved — Next Steps with AMG Aviation Group",
      intro: `Hello ${name}, congratulations — your AMG Crew Network application has been approved. Welcome aboard. Here is what happens next:`,
      sections: [
        {
          title: "1. Set Up Your Account",
          body: "Use the button below to set your password and open your crew profile in the AMG portal.",
        },
        {
          title: "2. Complete Your Profile",
          body: "Add your certificates, ratings, flight time breakdown, availability, and required documents (logbook, medical, certificates). Complete profiles are what our crew team works from.",
        },
        {
          title: "3. Crew Team Review",
          body: "Our crew team reviews completed profiles and will reach out regarding assignments and onboarding.",
        },
      ],
      cta: { label: "Set Up Your Crew Profile" },
    };
  }

  if (input.status === "denied") {
    const reason = input.denialReason?.trim() || "Your experience profile does not align with the positions we are currently staffing.";
    return {
      subject: "AMG Crew Network Application Decision",
      intro: `Hello ${name}, thank you for your interest in the AMG Crew Network and for the time you put into your application.`,
      sections: [
        {
          body: "After careful review, we are unable to move forward with your application at this time.",
        },
        { title: "Reason", body: reason },
        {
          body: "You are welcome to reapply if your circumstances change — we regularly revisit our network needs, and an updated application is always considered fresh.",
        },
      ],
    };
  }

  if (input.status === "waitlist") {
    return {
      subject: "AMG Crew Network — You're on Our Waitlist",
      intro: `Hello ${name}, thank you for applying to the AMG Crew Network.`,
      sections: [
        {
          body: "Our current crew needs are met for your position, so we have placed your application on our waitlist. This is not a denial — your qualifications remain on file with our crew team.",
        },
        {
          body: "We will reach out if our operational needs change. In the meantime, keep an eye on your application status and keep your contact information current so we can reach you quickly.",
        },
      ],
    };
  }

  if (input.status === "awaiting_review" || input.status === "in_review") {
    return {
      subject: "AMG Crew Network — Application Under Review",
      intro: `Hello ${name}, AMG has received your crew profile and application.`,
      sections: [
        {
          body: "Your application is under review by our crew team. We evaluate qualifications, documents, airport coverage, aircraft experience, and operational fit.",
        },
        {
          body: "We will contact you with a decision, or sooner if we need further information. No action is needed from you right now.",
        },
      ],
    };
  }

  if (input.status === "other") {
    const reason = input.otherStatusReason?.trim() || "AMG Operations has updated your crew-network application status.";
    return {
      subject: "AMG Crew Network Application Status Update",
      intro: `Hello ${name}, AMG Operations has updated your crew-network application status.`,
      sections: [{ title: "Status Detail", body: reason }],
    };
  }

  // additional_information_needed keeps its dedicated template.
  return null;
}

/** Plain-text rendering — used for the email text part AND the admin preview modal. */
export function renderDecisionEmailText(copy: DecisionEmailCopy, opts?: { ctaHref?: string | null }): string {
  const parts = [copy.intro];
  for (const section of copy.sections) {
    parts.push(section.title ? `${section.title}\n${section.body}` : section.body);
  }
  if (copy.cta) {
    parts.push(`${copy.cta.label}: ${opts?.ctaHref ?? "(secure setup link included in the email)"}`);
  }
  parts.push(NETWORK_EMAIL_DISCLAIMER);
  return parts.join("\n\n");
}
