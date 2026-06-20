export type LegalSection = {
  id: string;
  heading: string;
  body: string[];
  bullets?: string[];
};

export type LegalDocument = {
  slug: string;
  legacyPath?: string;
  title: string;
  description: string;
  effectiveDate: string;
  lastUpdated: string;
  audience: string;
  sections: LegalSection[];
};

export const AMG_LEGAL_CONTACT = "information@amgaviationgroup.com";

export const GLOBAL_OPERATIONAL_REVIEW =
  "AMG support is reviewed before acceptance. No request is considered accepted until applicable operational scope, aircraft status, crew availability, owner/operator approval, and operating conditions have been reviewed.";

const commonDraftNote =
  "This page is an attorney-review draft for AMG Aviation Group operational, website, and portal use. It is not legal advice to any visitor, client, crew member, vendor, or portal user.";

export const legalDocuments: LegalDocument[] = [
  {
    slug: "privacy-policy",
    legacyPath: "/privacy-policy",
    title: "Privacy Policy",
    description: "How AMG Aviation Group collects, uses, shares, retains, and protects personal information.",
    effectiveDate: "June 20, 2026",
    lastUpdated: "June 20, 2026",
    audience: "Website visitors, portal users, public form submitters, clients, crew, and vendors",
    sections: [
      {
        id: "draft-status",
        heading: "Attorney-review draft",
        body: [commonDraftNote],
      },
      {
        id: "information-collected",
        heading: "Information we collect",
        body: [
          "AMG Aviation Group collects information submitted through public forms, portal access, support requests, contact inquiries, document uploads, crew credential submissions, messages, and direct communications.",
          "Examples include name, email, phone, company or operator, role, aircraft context, route or timing details, support category, operational notes, document metadata, uploaded files, portal account details, consent preferences, browser or device information, and audit records.",
        ],
      },
      {
        id: "use",
        heading: "How we use information",
        body: [
          "AMG uses information to review requests, communicate with submitters, manage portal access, coordinate private aviation support, review credentials or documents, maintain security, operate the website and portal, comply with legal obligations, and improve administrative workflows.",
          GLOBAL_OPERATIONAL_REVIEW,
        ],
      },
      {
        id: "sharing",
        heading: "Sharing and service providers",
        body: [
          "Information may be shared with approved AMG personnel, authorized representatives, service providers, technology vendors, aviation support participants, or advisors when needed for review, coordination, security, legal compliance, or business administration.",
          "AMG does not sell personal information through direct payment transactions on this website or portal, and the current website does not process card payments, store full payment card data, CVV codes, bank account numbers, or raw ACH information.",
        ],
      },
      {
        id: "international",
        heading: "International access",
        body: [
          "AMG is based in Florida, United States. The website and portal may be accessed internationally, and information may be processed in the United States or other locations where service providers operate.",
        ],
      },
      {
        id: "minors",
        heading: "Minors",
        body: [
          "The website, portal, and AMG private aviation support workflows are intended for adults and are not directed to minors under 18. AMG does not knowingly request information from minors under 18.",
        ],
      },
      {
        id: "choices",
        heading: "Privacy choices",
        body: [
          `You may request access, correction, deletion, portability, restriction, or marketing opt-out by using the privacy choices page or contacting ${AMG_LEGAL_CONTACT}. AMG may need to verify the request before acting on it.`,
        ],
      },
    ],
  },
  {
    slug: "cookie-policy",
    legacyPath: "/cookie-policy",
    title: "Cookie Policy",
    description: "Cookie categories, consent controls, and script-gating practices for the AMG website and portal.",
    effectiveDate: "June 20, 2026",
    lastUpdated: "June 20, 2026",
    audience: "Website visitors and portal users",
    sections: [
      { id: "draft-status", heading: "Attorney-review draft", body: [commonDraftNote] },
      {
        id: "categories",
        heading: "Cookie and script categories",
        body: ["AMG groups website and portal cookies, local storage, pixels, and embedded tools into these categories."],
        bullets: [
          "Necessary: required for security, forms, authentication, portal routing, session integrity, and consent storage.",
          "Analytics: measurement tools that help AMG understand aggregate website and portal usage.",
          "Marketing and retargeting: advertising, audience, and campaign tools that may recognize a browser across sites.",
          "Session recording and behavior analytics: tools that may record interaction patterns for troubleshooting and UX review.",
          "Embedded tools: third-party maps, forms, media, scheduling, chat, or similar embedded features.",
        ],
      },
      {
        id: "control",
        heading: "Consent control",
        body: [
          "Necessary tools may run without optional consent because the site and portal depend on them. Optional analytics, marketing, session-recording, and embedded-tool scripts must be loaded through the centralized consent loader and only after the relevant category is enabled.",
          "Visitors may update cookie preferences from the footer at any time. Global Privacy Control signals are treated as a request to keep optional tracking categories disabled unless the visitor later makes a more specific choice.",
        ],
      },
      {
        id: "records",
        heading: "Consent records",
        body: [
          "AMG stores consent choices locally in the browser and may record a server-side consent event with category choices, consent version, page path, and limited request metadata for audit purposes.",
        ],
      },
    ],
  },
  {
    slug: "terms",
    legacyPath: "/terms",
    title: "Terms and Conditions",
    description: "Website terms for AMG Aviation Group information, forms, and general public use.",
    effectiveDate: "June 20, 2026",
    lastUpdated: "June 20, 2026",
    audience: "Website visitors and public form submitters",
    sections: [
      { id: "draft-status", heading: "Attorney-review draft", body: [commonDraftNote] },
      {
        id: "informational-site",
        heading: "Informational website",
        body: [
          "This website provides general information about AMG Aviation Group private aviation operational support capabilities. Website content does not create a contract, engagement, aircraft availability commitment, crew assignment, operational approval, or accepted support request.",
          GLOBAL_OPERATIONAL_REVIEW,
        ],
      },
      {
        id: "aviation-limitations",
        heading: "Aviation limitations",
        body: [
          "AMG is not advertising direct charter service through this website, does not present itself as an air carrier through this website, and does not guarantee aircraft, crew, route, airport, weather, maintenance, or owner/operator approvals.",
        ],
      },
      {
        id: "forms",
        heading: "Forms and communications",
        body: [
          "Submitting a contact form, support request, credential, document, message, or portal request authorizes AMG to review and respond to the submission. It does not mean the request has been accepted or scheduled.",
        ],
      },
    ],
  },
  {
    slug: "client-portal-terms",
    title: "Client Portal Terms",
    description: "Terms for client and owner-service portal access.",
    effectiveDate: "June 20, 2026",
    lastUpdated: "June 20, 2026",
    audience: "Client portal users and approved representatives",
    sections: [
      { id: "draft-status", heading: "Attorney-review draft", body: [commonDraftNote] },
      {
        id: "access",
        heading: "Portal access",
        body: [
          "Client portal access is limited to approved users and approved representatives. Account access may be reviewed, limited, suspended, or removed when AMG determines that access is no longer appropriate.",
        ],
      },
      {
        id: "requests",
        heading: "Support requests",
        body: [
          GLOBAL_OPERATIONAL_REVIEW,
          "Portal request status, document status, quotes, messages, or internal review notes are administrative records and do not override separate written agreements or final operational approvals.",
        ],
      },
      {
        id: "documents",
        heading: "Documents",
        body: [
          "Upload only documents you are authorized to provide. Do not upload unnecessary sensitive information. AMG may use uploaded documents to review support scope, aircraft records, insurance, ownership context, mission context, or other operational administration.",
        ],
      },
    ],
  },
  {
    slug: "crew-portal-terms",
    title: "Crew Portal Terms",
    description: "Terms for crew portal access, assignments, credentials, and availability records.",
    effectiveDate: "June 20, 2026",
    lastUpdated: "June 20, 2026",
    audience: "Crew portal users and pilot network participants",
    sections: [
      { id: "draft-status", heading: "Attorney-review draft", body: [commonDraftNote] },
      {
        id: "credential-review",
        heading: "Credential review",
        body: [
          "Submitting credentials does not guarantee approval, placement, assignment, compensation, or acceptance for any aircraft, operator, owner, route, or mission.",
          "AMG may review credential status, aircraft qualifications, availability, insurance requirements, owner/operator requirements, assignment suitability, and operating context before any crew-related support proceeds.",
        ],
      },
      {
        id: "availability",
        heading: "Availability and assignments",
        body: [
          "Availability entries are planning inputs only. An assignment is not accepted until the applicable operational review, owner/operator approvals, aircraft status, insurance context, and other operating conditions have been reviewed.",
        ],
      },
    ],
  },
  {
    slug: "vendor-portal-terms",
    title: "Vendor Portal Terms",
    description: "Terms for partner and vendor portal access.",
    effectiveDate: "June 20, 2026",
    lastUpdated: "June 20, 2026",
    audience: "Approved service partners and vendors",
    sections: [
      { id: "draft-status", heading: "Attorney-review draft", body: [commonDraftNote] },
      {
        id: "partner-access",
        heading: "Partner access",
        body: [
          "Partner portal access supports service request communication, document review, and operational coordination. Access does not guarantee assignment, purchase order, payment, or future work.",
        ],
      },
      {
        id: "documents",
        heading: "Vendor documents",
        body: [
          "Vendors should upload only current documents they are authorized to provide, such as insurance, W-9, airport permits, service agreements, or compliance materials relevant to AMG review.",
        ],
      },
    ],
  },
  {
    slug: "accessibility",
    legacyPath: "/accessibility",
    title: "Accessibility Statement",
    description: "Accessibility commitment, feedback channel, and known review practices.",
    effectiveDate: "June 20, 2026",
    lastUpdated: "June 20, 2026",
    audience: "Website visitors and portal users",
    sections: [
      { id: "draft-status", heading: "Attorney-review draft", body: [commonDraftNote] },
      {
        id: "commitment",
        heading: "Commitment",
        body: [
          "AMG aims to maintain website and portal experiences that are perceivable, operable, understandable, and robust for users with disabilities.",
          "The public site includes a skip link, keyboard focus styles, semantic page structure, form labels, accessible notices, and responsive layouts. AMG reviews new compliance components for keyboard and screen-reader usability.",
        ],
      },
      {
        id: "feedback",
        heading: "Accessibility feedback",
        body: [
          `If you experience an accessibility barrier, contact ${AMG_LEGAL_CONTACT} with the page URL, the assistive technology used if applicable, and a description of the issue.`,
        ],
      },
    ],
  },
  {
    slug: "mission-acceptance",
    legacyPath: "/mission-acceptance",
    title: "Support Request and Mission Acceptance Disclaimer",
    description: "No support request is accepted until AMG completes applicable operational review.",
    effectiveDate: "June 20, 2026",
    lastUpdated: "June 20, 2026",
    audience: "Public form submitters, clients, crew, vendors, and portal users",
    sections: [
      { id: "draft-status", heading: "Attorney-review draft", body: [commonDraftNote] },
      {
        id: "review-required",
        heading: "Review required",
        body: [
          GLOBAL_OPERATIONAL_REVIEW,
          "A confirmation email, portal status, form receipt, message, or quote draft does not by itself mean that a mission, movement, crew assignment, maintenance flight, or support request has been accepted.",
        ],
      },
      {
        id: "conditions",
        heading: "Conditions that may affect acceptance",
        body: ["Acceptance may depend on practical, legal, operational, aircraft, crew, and owner/operator factors."],
        bullets: [
          "Aircraft airworthiness, maintenance status, documentation, insurance, and equipment status.",
          "Crew qualifications, currency, availability, duty limitations, travel, and assignment suitability.",
          "Owner/operator authority, aircraft release, responsible operating authority, and required approvals.",
          "Route, airport, weather, permit, customs, facility, and vendor constraints.",
        ],
      },
    ],
  },
  {
    slug: "credential-submission",
    legacyPath: "/credential-submission",
    title: "Credential Submission Notice",
    description: "Credential submission terms for pilots, crew, and related portal users.",
    effectiveDate: "June 20, 2026",
    lastUpdated: "June 20, 2026",
    audience: "Crew applicants, pilots, and credential submitters",
    sections: [
      { id: "draft-status", heading: "Attorney-review draft", body: [commonDraftNote] },
      {
        id: "purpose",
        heading: "Purpose",
        body: [
          "Credential submissions are used to evaluate profile completeness, aircraft qualifications, medical or training currency, insurance context, assignment suitability, and support-specific review needs.",
        ],
      },
      {
        id: "no-guarantee",
        heading: "No guarantee",
        body: [
          "Submitting credentials does not create employment, contractor status, assignment acceptance, aircraft approval, operator approval, or guaranteed compensation.",
        ],
      },
    ],
  },
  {
    slug: "document-upload-terms",
    title: "Document Upload Terms",
    description: "Rules and notices for portal document uploads and downloads.",
    effectiveDate: "June 20, 2026",
    lastUpdated: "June 20, 2026",
    audience: "Portal users who upload or download documents",
    sections: [
      { id: "draft-status", heading: "Attorney-review draft", body: [commonDraftNote] },
      {
        id: "authorized-files",
        heading: "Authorized files only",
        body: [
          "Upload only documents that you are authorized to provide to AMG and that are relevant to aircraft support review, credential review, vendor review, billing, or operational administration.",
          "Do not upload full payment card numbers, CVV codes, raw bank account numbers, raw ACH data, unrelated medical records, or other unnecessary sensitive information.",
        ],
      },
      {
        id: "access",
        heading: "Access and review",
        body: [
          "Uploaded documents may be reviewed by approved AMG personnel and authorized support participants as needed for portal administration, support coordination, legal review, security, or records management.",
        ],
      },
    ],
  },
  {
    slug: "sms-terms",
    title: "SMS Terms",
    description: "Terms for optional AMG text-message communications.",
    effectiveDate: "June 20, 2026",
    lastUpdated: "June 20, 2026",
    audience: "Users who opt in to SMS communications",
    sections: [
      { id: "draft-status", heading: "Attorney-review draft", body: [commonDraftNote] },
      {
        id: "optional",
        heading: "Optional SMS consent",
        body: [
          "SMS consent is optional and separate from operational review. If you opt in, AMG may send administrative or operational text messages related to inquiries, portal activity, support requests, crew availability, document follow-up, or account coordination.",
        ],
      },
      {
        id: "opt-out",
        heading: "Opt out",
        body: [
          `You may opt out of SMS messages by replying STOP when supported by the message provider or by contacting ${AMG_LEGAL_CONTACT}. Message and data rates may apply.`,
        ],
      },
    ],
  },
  {
    slug: "email-communications",
    title: "Email Communications Notice",
    description: "How AMG uses transactional and optional marketing email communications.",
    effectiveDate: "June 20, 2026",
    lastUpdated: "June 20, 2026",
    audience: "Form submitters, portal users, clients, crew, and vendors",
    sections: [
      { id: "draft-status", heading: "Attorney-review draft", body: [commonDraftNote] },
      {
        id: "transactional",
        heading: "Transactional email",
        body: [
          "AMG may send transactional email related to submitted forms, portal accounts, messages, document review, support requests, billing administration, credential review, and other operational workflows.",
        ],
      },
      {
        id: "marketing",
        heading: "Marketing email",
        body: [
          "AMG sends marketing or promotional email only where AMG has an appropriate legal basis, such as consent or another permitted basis. You may opt out by using available unsubscribe mechanisms or contacting AMG.",
        ],
      },
    ],
  },
  {
    slug: "copyright-dmca",
    title: "Copyright and DMCA Notice",
    description: "Copyright ownership and DMCA contact information for AMG content.",
    effectiveDate: "June 20, 2026",
    lastUpdated: "June 20, 2026",
    audience: "Website visitors, portal users, and rights holders",
    sections: [
      { id: "draft-status", heading: "Attorney-review draft", body: [commonDraftNote] },
      {
        id: "ownership",
        heading: "Ownership",
        body: [
          "Website text, layouts, graphics, images, generated media, product names, and portal materials are owned by AMG Aviation Group or used under license or other permitted basis unless otherwise indicated.",
        ],
      },
      {
        id: "dmca",
        heading: "Copyright notices",
        body: [
          `Copyright concerns may be sent to ${AMG_LEGAL_CONTACT}. Include the work claimed to be infringed, the page or material at issue, your contact information, and a statement that you have authority to submit the notice.`,
        ],
      },
    ],
  },
  {
    slug: "trademark-disclaimer",
    title: "Trademark and Manufacturer Disclaimer",
    description: "Aircraft manufacturer, model, and trademark disclaimer.",
    effectiveDate: "June 20, 2026",
    lastUpdated: "June 20, 2026",
    audience: "Website visitors, aircraft owners, operators, crews, and vendors",
    sections: [
      { id: "draft-status", heading: "Attorney-review draft", body: [commonDraftNote] },
      {
        id: "names",
        heading: "Aircraft names and marks",
        body: [
          "Aircraft manufacturer names, model names, aircraft categories, and third-party marks are referenced only for identification, compatibility, aircraft-class context, or support-scope discussion.",
          "AMG is not affiliated with, endorsed by, sponsored by, or approved by aircraft manufacturers or third-party trademark owners unless a separate written relationship states otherwise.",
        ],
      },
    ],
  },
  {
    slug: "media-use-notice",
    title: "AI and Media Asset Disclosure",
    description: "Media provenance, generated imagery, and asset-governance notice.",
    effectiveDate: "June 20, 2026",
    lastUpdated: "June 20, 2026",
    audience: "Website visitors, portal users, and reviewers",
    sections: [
      { id: "draft-status", heading: "Attorney-review draft", body: [commonDraftNote] },
      {
        id: "media",
        heading: "Media sources",
        body: [
          "AMG may use owned media, licensed media, generated imagery, edited assets, screenshots, icons, and operational illustrations. Some imagery may be representative and not depict a specific aircraft, crew, owner, operator, vendor, or accepted request.",
        ],
      },
      {
        id: "governance",
        heading: "Asset governance",
        body: [
          "AMG maintains internal asset and generated-media registers to record known sources, generation prompts or identifiers where available, usage notes, and review status.",
        ],
      },
    ],
  },
  {
    slug: "privacy-choices",
    legacyPath: "/privacy-choices",
    title: "Privacy Choices and Data Rights",
    description: "Request access, correction, deletion, portability, restriction, or marketing opt-out.",
    effectiveDate: "June 20, 2026",
    lastUpdated: "June 20, 2026",
    audience: "Website visitors, form submitters, and portal users",
    sections: [
      { id: "draft-status", heading: "Attorney-review draft", body: [commonDraftNote] },
      {
        id: "available-requests",
        heading: "Available request types",
        body: [
          "Depending on your location and relationship with AMG, you may request access, correction, deletion, portability, restriction, objection, marketing opt-out, SMS opt-out, cookie preference review, or account-related assistance.",
        ],
      },
      {
        id: "verification",
        heading: "Verification",
        body: [
          "AMG may need to verify identity, authority, account status, request scope, or legal basis before acting on a privacy or data-rights request.",
        ],
      },
    ],
  },
  {
    slug: "subprocessors",
    title: "Subprocessors and Service Providers",
    description: "Categories of service providers used to operate the AMG website and portal.",
    effectiveDate: "June 20, 2026",
    lastUpdated: "June 20, 2026",
    audience: "Website visitors, portal users, clients, crew, and vendors",
    sections: [
      { id: "draft-status", heading: "Attorney-review draft", body: [commonDraftNote] },
      {
        id: "categories",
        heading: "Provider categories",
        body: ["AMG may use service providers for these operational categories."],
        bullets: [
          "Hosting, deployment, CDN, and observability.",
          "Database, authentication, object storage, and backend services.",
          "Email delivery, transactional notifications, and communications routing.",
          "Analytics, consent management, security, abuse prevention, and error monitoring.",
          "Document processing, media management, AI-assisted production tools, and administrative software.",
        ],
      },
      {
        id: "review",
        heading: "Review",
        body: [
          "AMG reviews provider access and purpose before enabling systems that handle personal information or operational documents.",
        ],
      },
    ],
  },
  {
    slug: "data-retention",
    title: "Data Retention Summary",
    description: "Summary of AMG retention principles for forms, portal records, documents, and consent records.",
    effectiveDate: "June 20, 2026",
    lastUpdated: "June 20, 2026",
    audience: "Website visitors, portal users, clients, crew, and vendors",
    sections: [
      { id: "draft-status", heading: "Attorney-review draft", body: [commonDraftNote] },
      {
        id: "principles",
        heading: "Retention principles",
        body: [
          "AMG retains records only as long as reasonably needed for support review, portal administration, legal compliance, dispute prevention, security, business administration, records continuity, or another legitimate operational purpose.",
        ],
      },
      {
        id: "summary",
        heading: "Current summary",
        body: ["Retention periods may vary by record type and legal requirement."],
        bullets: [
          "Public form submissions: retained for inquiry handling, audit, and business continuity unless deletion is approved.",
          "Portal documents and credentials: retained while relevant to active review, account status, assignments, legal obligations, or operational records.",
          "Consent events and marketing preferences: retained to document consent, opt-out, and preference history.",
          "Audit and security events: retained to protect portal integrity, investigate incidents, and document administrative actions.",
        ],
      },
    ],
  },
];

export const legalDocumentBySlug = new Map(legalDocuments.map((document) => [document.slug, document]));

export function getLegalDocument(slug: string) {
  return legalDocumentBySlug.get(slug);
}

export function requiredLegalSlugs() {
  return legalDocuments.map((document) => document.slug);
}
