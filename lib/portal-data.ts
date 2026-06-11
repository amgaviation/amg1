import {
  BadgeCheck,
  BriefcaseBusiness,
  CalendarClock,
  ClipboardCheck,
  FileCheck2,
  Gauge,
  Handshake,
  Plane,
  ShieldCheck,
  UserRoundCheck,
  Users,
  Wrench,
} from "lucide-react";

export type PortalRole = "client" | "crew" | "admin" | "partner";

export type PortalMetric = {
  label: string;
  value: string;
  detail: string;
};

export type PortalQueueItem = {
  id: string;
  title: string;
  owner: string;
  status: string;
  priority: "Standard" | "High" | "Critical";
  due: string;
};

export type PortalRecord = {
  ref: string;
  aircraft: string;
  route: string;
  service: string;
  stage: string;
  nextAction: string;
  assigned: string;
};

export type PortalDocument = {
  name: string;
  scope: string;
  visibility: string;
  status: string;
};

export type PortalTimeline = {
  step: string;
  title: string;
  body: string;
};

export type PortalModule = {
  name: string;
  permissions: string[];
};

export type PortalRoleConfig = {
  id: PortalRole;
  title: string;
  shortTitle: string;
  href: string;
  access: string;
  summary: string;
  image: string;
  icon: typeof Plane;
  metrics: PortalMetric[];
  queueTitle: string;
  queue: PortalQueueItem[];
  recordsTitle: string;
  records: PortalRecord[];
  documents: PortalDocument[];
  workflow: PortalTimeline[];
  modules: PortalModule[];
};

export const portalRoles: PortalRoleConfig[] = [
  {
    id: "client",
    title: "Client Portal",
    shortTitle: "Owner",
    href: "/portal/client",
    access: "Aircraft owners, family office users, and approved owner representatives",
    summary:
      "A private owner workspace for support requests, aircraft visibility, passenger context, document access, approvals, and AMG Operations communication.",
    image: "/images/jet-interior.png",
    icon: Plane,
    metrics: [
      { label: "Open requests", value: "04", detail: "2 awaiting AMG review" },
      { label: "Aircraft profiles", value: "03", detail: "1 readiness note updated" },
      { label: "Passengers", value: "18", detail: "6 marked frequent" },
      { label: "Shared files", value: "24", detail: "Owner-visible documents" },
    ],
    queueTitle: "Owner Action Queue",
    queue: [
      {
        id: "REQ-1048",
        title: "Approve reposition support window",
        owner: "N721AG",
        status: "Owner review",
        priority: "High",
        due: "Today 1500 ET",
      },
      {
        id: "DOC-883",
        title: "Review renewed insurance certificate",
        owner: "Gulfstream G280",
        status: "Document review",
        priority: "Standard",
        due: "Jun 13",
      },
      {
        id: "PAX-220",
        title: "Confirm passenger preference update",
        owner: "Owner profile",
        status: "Needs confirmation",
        priority: "Standard",
        due: "Jun 14",
      },
    ],
    recordsTitle: "Support Requests",
    records: [
      {
        ref: "REQ-1048",
        aircraft: "N721AG",
        route: "TEB to PBI",
        service: "Ferry and repositioning",
        stage: "Crew review",
        nextAction: "Owner approval",
        assigned: "AMG Ops",
      },
      {
        ref: "REQ-1039",
        aircraft: "N88MG",
        route: "DAL to ASE",
        service: "Flight operations coordination",
        stage: "Scheduled",
        nextAction: "Manifest lock",
        assigned: "Crew Lead",
      },
      {
        ref: "REQ-1027",
        aircraft: "N415AM",
        route: "OPF to SAV",
        service: "Maintenance flight support",
        stage: "Completed",
        nextAction: "Closeout docs",
        assigned: "Client Services",
      },
    ],
    documents: [
      { name: "Owner operating preferences", scope: "Profile", visibility: "Owner + AMG", status: "Current" },
      { name: "Aircraft insurance certificate", scope: "N721AG", visibility: "Owner + crew when assigned", status: "Renewed" },
      { name: "Trip support invoice packet", scope: "REQ-1039", visibility: "Owner + AMG finance", status: "Draft" },
    ],
    workflow: [
      { step: "01", title: "Submit", body: "Owner provides aircraft, timing, support scope, passenger context, and requested route." },
      { step: "02", title: "Review", body: "AMG reviews operating constraints, crew availability, records, and owner authority." },
      { step: "03", title: "Approve", body: "Owner and assigned crew approve material changes before the support item is locked." },
      { step: "04", title: "Close", body: "AMG posts final notes, documents, invoices, and follow-up items." },
    ],
    modules: [
      { name: "Requests", permissions: ["Create", "View owned", "Edit before review", "Cancel with crew notice"] },
      { name: "Aircraft", permissions: ["View assigned owner aircraft", "Request profile updates"] },
      { name: "Documents", permissions: ["View owner-visible", "Upload owner packet", "Approve release"] },
      { name: "Messages", permissions: ["Message AMG Operations", "View request threads"] },
    ],
  },
  {
    id: "crew",
    title: "Crew Portal",
    shortTitle: "Crew",
    href: "/portal/crew",
    access: "Pilots, contract crew, aircraft managers, maintenance coordinators, and approved support users",
    summary:
      "An operations workspace for assignments, crew qualification records, availability, aircraft readiness, manifests, and approval checkpoints.",
    image: "/images/operations.png",
    icon: UserRoundCheck,
    metrics: [
      { label: "Assignments", value: "06", detail: "3 active this week" },
      { label: "Approval items", value: "05", detail: "2 owner changes" },
      { label: "Open pool", value: "09", detail: "Crew interest available" },
      { label: "Credential status", value: "92%", detail: "Network readiness" },
    ],
    queueTitle: "Crew Approval Queue",
    queue: [
      {
        id: "APP-441",
        title: "Review owner edit to departure window",
        owner: "REQ-1048",
        status: "Crew review",
        priority: "High",
        due: "Today 1600 ET",
      },
      {
        id: "CRD-119",
        title: "Medical certificate renewal needed",
        owner: "Crew profile",
        status: "Credential gap",
        priority: "Critical",
        due: "Jun 12",
      },
      {
        id: "AVL-309",
        title: "Confirm availability for maintenance flight",
        owner: "N415AM",
        status: "Pending crew",
        priority: "Standard",
        due: "Jun 15",
      },
    ],
    recordsTitle: "Assigned Support",
    records: [
      {
        ref: "REQ-1048",
        aircraft: "N721AG",
        route: "TEB to PBI",
        service: "Ferry and repositioning",
        stage: "Crew review",
        nextAction: "Confirm window",
        assigned: "Captain review",
      },
      {
        ref: "REQ-1041",
        aircraft: "N604AG",
        route: "APA to SDL",
        service: "Contract pilot support",
        stage: "Interest pool",
        nextAction: "Submit availability",
        assigned: "Open crew",
      },
      {
        ref: "REQ-1035",
        aircraft: "N88MG",
        route: "DAL to ASE",
        service: "Owner mission",
        stage: "Manifest review",
        nextAction: "Crew lock",
        assigned: "Assigned crew",
      },
    ],
    documents: [
      { name: "Pilot certificate", scope: "Crew profile", visibility: "Crew + AMG", status: "Verified" },
      { name: "Medical certificate", scope: "Crew profile", visibility: "Crew + AMG", status: "Renewal due" },
      { name: "Aircraft quick reference", scope: "N721AG", visibility: "Assigned crew", status: "Current" },
    ],
    workflow: [
      { step: "01", title: "Qualify", body: "Crew maintain profile, aircraft experience, documents, insurance context, and availability." },
      { step: "02", title: "Match", body: "AMG matches crew to aircraft, route, owner requirements, and support scope." },
      { step: "03", title: "Approve", body: "Crew review edits, manifests, timing, and operational notes before accepting assignment changes." },
      { step: "04", title: "Report", body: "Crew submit completion notes, expenses, document updates, or exceptions." },
    ],
    modules: [
      { name: "Assignments", permissions: ["View assigned", "Express interest", "Accept assignment", "Submit completion notes"] },
      { name: "Crew profile", permissions: ["Maintain credentials", "Set availability", "View compliance status"] },
      { name: "Aircraft readiness", permissions: ["View assigned aircraft", "Add crew note", "Flag readiness concern"] },
      { name: "Manifests", permissions: ["View when assigned", "Acknowledge changes", "Flag data issue"] },
    ],
  },
  {
    id: "admin",
    title: "Admin Portal",
    shortTitle: "Admin",
    href: "/portal/admin",
    access: "AMG administrators, operations managers, dispatch coordinators, finance, and compliance leads",
    summary:
      "The system command center for access review, user permissions, support lifecycle management, aircraft records, documents, partner coordination, billing, and audit history.",
    image: "/images/jet-sky.png",
    icon: ShieldCheck,
    metrics: [
      { label: "Access requests", value: "12", detail: "4 need identity review" },
      { label: "Live support", value: "31", detail: "8 priority items" },
      { label: "Crew gaps", value: "07", detail: "Across 5 aircraft" },
      { label: "Audit events", value: "148", detail: "Last 24 hours" },
    ],
    queueTitle: "Operations Command Queue",
    queue: [
      {
        id: "ACC-204",
        title: "Approve owner representative access",
        owner: "Family Office",
        status: "Identity review",
        priority: "Critical",
        due: "Today 1200 ET",
      },
      {
        id: "REQ-1048",
        title: "Resolve crew review before owner approval",
        owner: "N721AG",
        status: "Crew review",
        priority: "High",
        due: "Today 1600 ET",
      },
      {
        id: "BIL-510",
        title: "Finalize support closeout packet",
        owner: "REQ-1027",
        status: "Finance draft",
        priority: "Standard",
        due: "Jun 13",
      },
    ],
    recordsTitle: "System Support Records",
    records: [
      {
        ref: "REQ-1048",
        aircraft: "N721AG",
        route: "TEB to PBI",
        service: "Ferry and repositioning",
        stage: "Crew review",
        nextAction: "Coordinate approval",
        assigned: "Ops Manager",
      },
      {
        ref: "REQ-1045",
        aircraft: "N604AG",
        route: "MIA to HPN",
        service: "Owner support",
        stage: "Intake",
        nextAction: "Validate scope",
        assigned: "Client Services",
      },
      {
        ref: "REQ-1027",
        aircraft: "N415AM",
        route: "OPF to SAV",
        service: "Maintenance flight support",
        stage: "Closeout",
        nextAction: "Finance packet",
        assigned: "Finance",
      },
    ],
    documents: [
      { name: "Role policy matrix", scope: "System", visibility: "Admin only", status: "Controlled" },
      { name: "Support acceptance checklist", scope: "All requests", visibility: "AMG operations", status: "Current" },
      { name: "Partner SLA packet", scope: "Vendors", visibility: "Admin + partner owner", status: "Draft" },
    ],
    workflow: [
      { step: "01", title: "Intake", body: "Validate requester, aircraft, authority, support category, timing, route, and required documents." },
      { step: "02", title: "Coordinate", body: "Assign AMG owner, crew, partner vendors, documents, approvals, and task checklists." },
      { step: "03", title: "Control", body: "Enforce role-based permissions, approvals, sensitive passenger data controls, and audit logging." },
      { step: "04", title: "Report", body: "Close the record with final status, notes, billing packet, document retention, and analytics." },
    ],
    modules: [
      { name: "Users", permissions: ["Invite", "Approve", "Suspend", "Impersonation audit only"] },
      { name: "Requests", permissions: ["Create", "Read all", "Assign", "Advance stage", "Cancel", "Close"] },
      { name: "Permissions", permissions: ["Set role defaults", "Apply overrides", "Review audit"] },
      { name: "Finance", permissions: ["Draft charges", "Attach packet", "Release owner packet"] },
    ],
  },
  {
    id: "partner",
    title: "Partner Portal",
    shortTitle: "Partner",
    href: "/portal/partner",
    access: "Approved FBOs, maintenance facilities, ground transport, catering, hotels, and aviation service partners",
    summary:
      "A limited-access partner workspace for vendor tasks, service confirmations, document exchange, milestone updates, and AMG-controlled request visibility.",
    image: "/images/jet-sky.png",
    icon: Handshake,
    metrics: [
      { label: "Assigned tasks", value: "11", detail: "5 due in 48 hours" },
      { label: "Confirmations", value: "08", detail: "Ground/FBO/vendor" },
      { label: "Open RFQs", value: "03", detail: "Awaiting partner quote" },
      { label: "Shared docs", value: "16", detail: "Partner-visible only" },
    ],
    queueTitle: "Partner Task Queue",
    queue: [
      {
        id: "VND-331",
        title: "Confirm hangar availability",
        owner: "N604AG",
        status: "Partner pending",
        priority: "High",
        due: "Today 1700 ET",
      },
      {
        id: "VND-327",
        title: "Upload maintenance slot confirmation",
        owner: "REQ-1027",
        status: "Document needed",
        priority: "Standard",
        due: "Jun 13",
      },
      {
        id: "RFQ-114",
        title: "Submit crew hotel quote",
        owner: "DAL support",
        status: "Quote requested",
        priority: "Standard",
        due: "Jun 14",
      },
    ],
    recordsTitle: "Partner Visible Work",
    records: [
      {
        ref: "VND-331",
        aircraft: "N604AG",
        route: "MIA to HPN",
        service: "FBO coordination",
        stage: "Partner pending",
        nextAction: "Confirm capacity",
        assigned: "Partner ops",
      },
      {
        ref: "VND-327",
        aircraft: "N415AM",
        route: "OPF to SAV",
        service: "Maintenance facility support",
        stage: "Document needed",
        nextAction: "Upload confirmation",
        assigned: "Facility desk",
      },
      {
        ref: "RFQ-114",
        aircraft: "N88MG",
        route: "DAL to ASE",
        service: "Crew lodging",
        stage: "Quote requested",
        nextAction: "Submit quote",
        assigned: "Hotel partner",
      },
    ],
    documents: [
      { name: "Partner task order", scope: "VND-331", visibility: "Assigned partner + AMG", status: "Active" },
      { name: "Facility certificate", scope: "Partner profile", visibility: "Partner + AMG", status: "Verified" },
      { name: "Service quote", scope: "RFQ-114", visibility: "Partner + AMG finance", status: "Requested" },
    ],
    workflow: [
      { step: "01", title: "Assign", body: "AMG shares only the task, timing, location, and contact details required for the vendor role." },
      { step: "02", title: "Confirm", body: "Partner confirms capacity, service details, pricing, or document requirements." },
      { step: "03", title: "Update", body: "Partner posts milestone updates, attachments, and exceptions into the AMG-controlled record." },
      { step: "04", title: "Complete", body: "AMG validates completion, stores documents, and keeps partner visibility scoped." },
    ],
    modules: [
      { name: "Tasks", permissions: ["View assigned vendor tasks", "Update partner milestone", "Upload partner document"] },
      { name: "Quotes", permissions: ["Submit quote", "Revise requested quote", "View award status"] },
      { name: "Partner profile", permissions: ["Maintain contacts", "Maintain service area", "Upload compliance docs"] },
      { name: "Messages", permissions: ["Message AMG on assigned work", "No owner direct message by default"] },
    ],
  },
];

export const portalNav = portalRoles.map(({ id, title, href }) => ({ id, title, href }));

export const permissionMatrix = [
  {
    module: "Support Requests",
    client: "Create/view owned; edit until review; cancel with notice",
    crew: "View assigned; approve operational changes; submit notes",
    partner: "View assigned task slice only; update vendor milestones",
    admin: "Full lifecycle control and assignment",
  },
  {
    module: "Aircraft Profiles",
    client: "View owned aircraft and request updates",
    crew: "View assigned aircraft and readiness notes",
    partner: "View minimum task-relevant aircraft context",
    admin: "Create, edit, archive, and assign visibility",
  },
  {
    module: "Passenger Data",
    client: "Manage passenger profile and preferences",
    crew: "View assigned manifest only",
    partner: "No access unless specifically granted",
    admin: "Govern access and audit every view/change",
  },
  {
    module: "Documents",
    client: "Owner-visible upload/download",
    crew: "Crew credential and assigned aircraft documents",
    partner: "Partner compliance and task documents",
    admin: "Retention, release, tagging, and sensitive file control",
  },
  {
    module: "Messages",
    client: "AMG request threads",
    crew: "Assignment threads",
    partner: "Vendor task threads",
    admin: "All scoped operational threads",
  },
] as const;

export const systemModules = [
  { name: "Identity and access", icon: ShieldCheck, body: "Invite, approval, MFA, role assignment, overrides, suspensions, and audit logs." },
  { name: "Request operations", icon: CalendarClock, body: "Support intake, lifecycle stages, tasking, crew review, owner approval, and closeout." },
  { name: "Aircraft records", icon: Plane, body: "Aircraft profiles, readiness state, ownership visibility, documents, and recurring support needs." },
  { name: "Crew network", icon: Users, body: "Crew credentials, aircraft qualification, availability, assignments, and compliance gaps." },
  { name: "Partner network", icon: BriefcaseBusiness, body: "Vendor profiles, assigned task slices, quotes, confirmations, and partner documents." },
  { name: "Documents", icon: FileCheck2, body: "Role-scoped storage, document types, retention, release approvals, and sensitive file controls." },
  { name: "Approvals", icon: ClipboardCheck, body: "Owner approvals, crew acceptance, admin overrides, cancellation notices, and policy gates." },
  { name: "Readiness", icon: Gauge, body: "Operational readiness checks across aircraft, crew, documents, route, weather, and vendors." },
  { name: "Maintenance support", icon: Wrench, body: "Maintenance flight support, facility coordination, return-to-service context, and closeout." },
  { name: "Audit and compliance", icon: BadgeCheck, body: "Immutable event history for views, edits, approvals, exports, and permission changes." },
] as const;

export function getPortalRole(role: PortalRole) {
  const config = portalRoles.find((item) => item.id === role);

  if (!config) {
    throw new Error(`Unknown portal role: ${role}`);
  }

  return config;
}
