import { archiveCrewRecord, saveCrewRecord } from "@/app/portal/actions/admin";
import { AdminRecordManager, type AdminRecordFilter, type AdminRecordRow } from "@/components/portal/admin/admin-record-manager";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { Notice, PageHeader } from "@/components/portal/ui/primitives";
import {
  AVAILABILITY_STATUS,
  AVAILABILITY_STATUS_LABEL,
  AVAILABILITY_STATUS_TONE,
  CREDENTIAL_STATUS_LABEL,
  CREDENTIAL_STATUS_TONE,
  PROFILE_STATUS,
  PROFILE_STATUS_LABEL,
  PROFILE_STATUS_TONE,
  type Tone,
  toneFor,
} from "@/lib/portal/constants";
import { formatDate, formatDateTime } from "@/lib/portal/format";
import { listAllCredentials, listAllCrew, listAllDocuments, listAllMissions } from "@/lib/portal/queries";
import { requireRole } from "@/lib/portal/session";

export const metadata = { title: "Crew - Admin Portal" };

const certificateOptions = [
  { value: "", label: "Not specified" },
  { value: "ATP", label: "ATP" },
  { value: "Commercial", label: "Commercial" },
  { value: "Private", label: "Private" },
  { value: "Dispatcher", label: "Dispatcher / Coordinator" },
  { value: "Cabin Crew", label: "Cabin Crew" },
  { value: "Maintenance Pilot", label: "Maintenance Pilot" },
];

const booleanOptions = [
  { value: "false", label: "No" },
  { value: "true", label: "Yes" },
];

function profileTone(status: string): Tone {
  return toneFor(PROFILE_STATUS_TONE, status);
}

function availabilityTone(status?: string | null): Tone {
  return toneFor(AVAILABILITY_STATUS_TONE, status);
}

function listText(value?: string[] | null) {
  return value?.length ? value.join(", ") : "";
}

function locationText(profile: { city?: string | null; state?: string | null; country?: string | null } | null | undefined, fallback?: string | null) {
  return [profile?.city, profile?.state].filter(Boolean).join(", ") || profile?.country || fallback || null;
}

function aircraftSummary(value?: string | null, fallback?: string[] | null) {
  const items = value
    ? value.split(/[,;\n]/).map((item) => item.trim()).filter(Boolean)
    : fallback ?? [];
  if (!items.length) return null;
  if (items.length <= 2) return items.join(", ");
  return `${items.slice(0, 2).join(", ")} +${items.length - 2} more`;
}

function yesNo(value?: boolean | null) {
  return Boolean(value);
}

function uniqueOptions(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter(Boolean) as string[]))
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({ value, label: value }));
}

export default async function AdminCrewPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const user = await requireRole("admin");
  const params = await searchParams;
  const [crew, credentials, missions, documents] = await Promise.all([
    listAllCrew(),
    listAllCredentials(),
    listAllMissions(),
    listAllDocuments(),
  ]);

  const rows: AdminRecordRow[] = crew.map((member) => {
    const profile = member.crew_profile;
    const memberCredentials = credentials.filter((credential) => credential.crew_id === member.id);
    const assignedMissions = missions.filter((mission) => mission.assigned_crew_id === member.id);
    const memberDocuments = documents.filter((document) => document.scope_id === member.id || document.uploaded_by === member.id);
    const name = profile?.display_name ?? member.full_name ?? member.email;
    const availability = profile?.availability_status ?? "available";
    const aircraft = aircraftSummary(profile?.aircraft_type_experience ?? profile?.time_in_type, profile?.preferred_aircraft);
    const location = locationText(profile, member.home_base);
    const credentialStatus = memberCredentials.some((credential) => credential.status === "expired")
      ? "expired"
      : memberCredentials.some((credential) => credential.status === "pending_review")
        ? "pending_review"
        : memberCredentials.length
          ? "approved"
          : "not_uploaded";

    return {
      id: member.id,
      title: name,
      subtitle: [location, profile?.certificates_ratings ?? profile?.certificate_level].filter(Boolean).join(" - "),
      status: { label: PROFILE_STATUS_LABEL[member.status] ?? member.status, tone: profileTone(member.status) },
      secondaryStatus: { label: AVAILABILITY_STATUS_LABEL[availability] ?? availability, tone: availabilityTone(availability) },
      cells: {
        name,
        email: member.email?.endsWith("@import.amg.invalid") ? null : member.email,
        phone: member.phone ?? profile?.phone,
        location,
        aircraftExperience: aircraft,
        totalTime: profile?.total_time,
        reviewed: yesNo(profile?.reviewed),
        approved: yesNo(profile?.approved),
        priority: yesNo(profile?.priority_candidate),
        insurance: yesNo(profile?.insurance_approved),
        lastContacted: profile?.last_contacted ? formatDate(profile.last_contacted) : null,
        status: member.status,
        secondaryStatus: availability,
        credentialStatus: CREDENTIAL_STATUS_LABEL[credentialStatus] ?? credentialStatus,
        updated: member.updated_at ? formatDateTime(member.updated_at) : "-",
      },
      searchText: [
        name,
        member.email,
        profile?.email,
        member.phone,
        profile?.phone,
        member.home_base,
        profile?.city,
        profile?.state,
        profile?.company,
        profile?.certificates_ratings,
        profile?.aircraft_type_experience,
        profile?.medical,
        profile?.notes,
        profile?.certificate_level,
        profile?.time_in_type,
        listText(profile?.preferred_aircraft),
        listText(profile?.type_ratings),
        profile?.ops_notes,
      ].filter(Boolean).join(" "),
      filters: {
        reviewed: String(Boolean(profile?.reviewed)),
        approved: String(Boolean(profile?.approved)),
        priority: String(Boolean(profile?.priority_candidate)),
        insurance: String(Boolean(profile?.insurance_approved)),
        needsManualReview: String(Boolean(profile?.needs_manual_review)),
        state: profile?.state ?? "",
        aircraftKeyword: [profile?.aircraft_type_experience, listText(profile?.preferred_aircraft), profile?.time_in_type].filter(Boolean).join(" "),
      },
      formValues: {
        full_name: member.full_name,
        email: member.email?.endsWith("@import.amg.invalid") ? "" : member.email,
        phone: member.phone ?? profile?.phone,
        company_name: member.company_name ?? profile?.company,
        home_base: member.home_base,
        certificate_level: profile?.certificate_level ?? profile?.certificates_ratings ?? "",
        first_name: profile?.first_name,
        last_name: profile?.last_name,
        address: profile?.address,
        city: profile?.city,
        state: profile?.state,
        zip: profile?.zip,
        country: profile?.country,
        certificates_ratings: profile?.certificates_ratings,
        aircraft_type_experience: profile?.aircraft_type_experience,
        preferred_aircraft: listText(profile?.preferred_aircraft),
        type_ratings: listText(profile?.type_ratings),
        preferred_regions: listText(profile?.preferred_regions),
        total_time: profile?.total_time,
        pic_time: profile?.pic_time,
        me_time: profile?.me_time,
        turbine_time: profile?.turbine_time,
        instrument_time: profile?.instrument_time,
        dual_given: profile?.dual_given,
        jet_time: profile?.jet_time,
        time_in_type: profile?.time_in_type,
        medical: profile?.medical,
        passport_mentioned: profile?.passport_mentioned ? "true" : "false",
        resume_notes: profile?.resume_notes,
        notes: profile?.notes,
        needs_manual_review: profile?.needs_manual_review ? "true" : "false",
        reviewed: profile?.reviewed ? "true" : "false",
        approved: profile?.approved ? "true" : "false",
        priority_candidate: profile?.priority_candidate ? "true" : "false",
        insurance_approved: profile?.insurance_approved ? "true" : "false",
        last_contacted: profile?.last_contacted,
        availability_status: availability,
        ops_notes: profile?.ops_notes,
        status: member.status,
      },
      details: [
        { label: "Email", value: member.email },
        { label: "Phone", value: member.phone ?? profile?.phone },
        { label: "Location", value: location },
        { label: "Aircraft", value: profile?.aircraft_type_experience ?? listText(profile?.preferred_aircraft) },
      ],
      detailSections: [
        {
          title: "Contact",
          rows: [
            { label: "Email", value: member.email?.endsWith("@import.amg.invalid") ? null : member.email },
            { label: "Phone", value: member.phone ?? profile?.phone },
            { label: "Address", value: profile?.address },
            { label: "City / State / Zip", value: [profile?.city, profile?.state, profile?.zip].filter(Boolean).join(", ") },
            { label: "Country", value: profile?.country },
            { label: "Company", value: member.company_name ?? profile?.company },
          ],
        },
        {
          title: "Qualifications",
          rows: [
            { label: "Certificates / Ratings", value: profile?.certificates_ratings ?? profile?.certificate_level },
            { label: "Aircraft / Type Experience", value: profile?.aircraft_type_experience ?? listText(profile?.preferred_aircraft) },
            { label: "Type Ratings", value: listText(profile?.type_ratings) },
            { label: "Medical", value: profile?.medical },
            { label: "Passport Mentioned", value: profile?.passport_mentioned },
          ],
        },
        {
          title: "Flight Time",
          rows: [
            { label: "Total Time", value: profile?.total_time },
            { label: "PIC Time", value: profile?.pic_time },
            { label: "Multi-Engine Time", value: profile?.me_time ?? profile?.multi_time },
            { label: "Turbine Time", value: profile?.turbine_time },
            { label: "Instrument Time", value: profile?.instrument_time },
            { label: "Dual Given", value: profile?.dual_given },
          ],
        },
        {
          title: "Review",
          rows: [
            { label: "Needs Manual Review", value: profile?.needs_manual_review },
            { label: "Reviewed", value: profile?.reviewed },
            { label: "Approved", value: profile?.approved },
            { label: "Priority Candidate", value: profile?.priority_candidate },
            { label: "Insurance Approved", value: profile?.insurance_approved },
            { label: "Last Contacted", value: profile?.last_contacted ? formatDate(profile.last_contacted) : null },
          ],
        },
        {
          title: "Notes",
          rows: [
            { label: "Resume Notes", value: profile?.resume_notes },
            { label: "Internal Notes", value: profile?.notes ?? profile?.ops_notes },
          ],
        },
        {
          title: "Import Metadata",
          rows: [
            { label: "Import Source", value: profile?.import_source },
            { label: "Import Batch ID", value: profile?.import_batch_id },
            { label: "Import Row Number", value: profile?.import_row_number },
            { label: "Imported At", value: profile?.imported_at ? formatDateTime(profile.imported_at) : null },
          ],
        },
      ],
      tabs: [
        {
          title: "Credentials",
          rows: memberCredentials.slice(0, 5).map((credential) => ({
            label: credential.credential_type,
            value: `${CREDENTIAL_STATUS_LABEL[credential.status] ?? credential.status}${credential.expiration_date ? ` - expires ${formatDate(credential.expiration_date)}` : ""}`,
          })),
          empty: "No credentials uploaded yet.",
        },
        {
          title: "Assigned Missions",
          rows: assignedMissions.slice(0, 5).map((mission) => ({
            label: mission.ref,
            value: `${mission.status.replace(/_/g, " ")} - ${mission.departure_airport} to ${mission.arrival_airport}`,
          })),
          empty: "No assigned missions yet.",
        },
        {
          title: "Documents",
          rows: memberDocuments.slice(0, 5).map((document) => ({ label: document.name, value: document.status.replace(/_/g, " ") })),
          empty: "No documents uploaded yet.",
        },
      ],
    };
  });

  const filters: AdminRecordFilter[] = [
    { key: "status", label: "Approval Status", options: PROFILE_STATUS.map(({ value, label }) => ({ value, label })) },
    { key: "reviewed", label: "Reviewed", options: [{ value: "true", label: "Yes" }, { value: "false", label: "No" }] },
    { key: "approved", label: "Approved", options: [{ value: "true", label: "Yes" }, { value: "false", label: "No" }] },
    { key: "priority", label: "Priority Candidate", options: [{ value: "true", label: "Yes" }, { value: "false", label: "No" }] },
    { key: "insurance", label: "Insurance Approved", options: [{ value: "true", label: "Yes" }, { value: "false", label: "No" }] },
    { key: "needsManualReview", label: "Needs Review", options: [{ value: "true", label: "Yes" }, { value: "false", label: "No" }] },
    { key: "state", label: "State", options: uniqueOptions(crew.map((member) => member.crew_profile?.state)) },
    { key: "aircraftKeyword", label: "Aircraft / Type Keyword", type: "text" },
  ];

  return (
    <PortalShell role="admin" user={user}>
      {params.success ? <Notice tone="success">Crew record saved.</Notice> : null}
      {params.error === "missing" ? <Notice tone="danger">Crew name and valid email are required.</Notice> : null}
      {params.error === "duplicate" ? <Notice tone="danger">A profile already exists for that email.</Notice> : null}
      {params.error === "invite" ? <Notice tone="danger">Portal invitation could not be sent.</Notice> : null}
      {params.error === "email" ? <Notice tone="danger">Email update could not be completed.</Notice> : null}
      {params.error === "crew-profile" ? <Notice tone="danger">Crew profile details could not be saved.</Notice> : null}
      {params.error === "save" ? <Notice tone="danger">Crew record could not be saved.</Notice> : null}

      <PageHeader
        eyebrow="AMG Operations"
        title="Crew Management"
        description="Manage crew profiles, approval status, qualifications, aircraft experience, credentials, and assignment readiness."
      />

      <AdminRecordManager
        title="Crew Roster"
        description="Searchable crew operations table with approval, availability, credentials, and selected-record detail workflow."
        rows={rows}
        columns={[
          { key: "name", label: "Name", sortable: true, className: "w-[15rem]" },
          { key: "email", label: "Email", sortable: true, className: "w-[17rem]" },
          { key: "phone", label: "Phone", sortable: true, className: "hidden w-[9rem] 2xl:table-cell" },
          { key: "location", label: "Location", sortable: true, className: "w-[10rem]" },
          { key: "aircraftExperience", label: "Aircraft / Type", sortable: true, className: "w-[14rem]" },
          { key: "totalTime", label: "Total Time", sortable: true, className: "w-[7rem]" },
          { key: "reviewed", label: "Reviewed", sortable: true, className: "hidden w-[7rem] xl:table-cell" },
          { key: "approved", label: "Approved", sortable: true, className: "w-[7rem]" },
          { key: "priority", label: "Priority", sortable: true, className: "hidden w-[7rem] 2xl:table-cell" },
          { key: "insurance", label: "Insurance", sortable: true, className: "hidden w-[7rem] 2xl:table-cell" },
          { key: "lastContacted", label: "Last Contacted", sortable: true, className: "hidden w-[9rem] 2xl:table-cell" },
        ]}
        filters={filters}
        fields={[
          { name: "full_name", label: "Full Name", required: true },
          { name: "email", label: "Email", type: "email", required: true },
          { name: "phone", label: "Phone", type: "tel" },
          { name: "company_name", label: "Company" },
          { name: "home_base", label: "Home Airport" },
          { name: "address", label: "Address" },
          { name: "city", label: "City" },
          { name: "state", label: "State" },
          { name: "zip", label: "Zip" },
          { name: "country", label: "Country" },
          { name: "certificate_level", label: "Role / Type", type: "select", options: certificateOptions },
          { name: "availability_status", label: "Availability", type: "select", options: AVAILABILITY_STATUS.map(({ value, label }) => ({ value, label })) },
          { name: "status", label: "Approval Status", type: "select", options: PROFILE_STATUS.map(({ value, label }) => ({ value, label })) },
          { name: "certificates_ratings", label: "Certificates / Ratings", type: "textarea", fullWidth: true },
          { name: "aircraft_type_experience", label: "Aircraft / Type Experience", type: "textarea", fullWidth: true },
          { name: "preferred_aircraft", label: "Aircraft Experience", type: "textarea", fullWidth: true, placeholder: "Citation XLS, Phenom 300, Challenger 350" },
          { name: "type_ratings", label: "Type Ratings", type: "textarea", fullWidth: true },
          { name: "preferred_regions", label: "Preferred Regions", type: "textarea", fullWidth: true },
          { name: "total_time", label: "Total Time", type: "number" },
          { name: "pic_time", label: "PIC Time", type: "number" },
          { name: "me_time", label: "Multi-Engine Time", type: "number" },
          { name: "turbine_time", label: "Turbine Time", type: "number" },
          { name: "instrument_time", label: "Instrument Time", type: "number" },
          { name: "dual_given", label: "Dual Given", type: "number" },
          { name: "jet_time", label: "Jet Time", type: "number" },
          { name: "time_in_type", label: "Time In Type" },
          { name: "medical", label: "Medical" },
          { name: "passport_mentioned", label: "Passport Mentioned", type: "select", options: booleanOptions },
          { name: "needs_manual_review", label: "Needs Manual Review", type: "select", options: booleanOptions },
          { name: "reviewed", label: "Reviewed", type: "select", options: booleanOptions },
          { name: "approved", label: "Approved", type: "select", options: booleanOptions },
          { name: "priority_candidate", label: "Priority Candidate", type: "select", options: booleanOptions },
          { name: "insurance_approved", label: "Insurance Approved", type: "select", options: booleanOptions },
          { name: "last_contacted", label: "Last Contacted", type: "date" },
          { name: "resume_notes", label: "Resume Notes", type: "textarea", fullWidth: true },
          { name: "notes", label: "Internal Notes", type: "textarea", fullWidth: true },
          { name: "ops_notes", label: "Qualifications / Internal Notes", type: "textarea", fullWidth: true },
        ]}
        createAction={saveCrewRecord}
        updateAction={saveCrewRecord}
        archiveAction={archiveCrewRecord}
        createLabel="New Crew Member"
        editLabel="Edit Crew Member"
        archiveLabel="Deactivate"
        archiveConfirm="Deactivate this crew profile? Historical credentials and assignments remain visible to admins."
        archiveDisabledReason="Crew member is already inactive."
        recordIdName="profile_id"
        backTo="/portal/admin/crew"
        emptyTitle="No crew match"
        emptyDescription="Adjust search or filters, or create a new crew member."
      />
    </PortalShell>
  );
}
