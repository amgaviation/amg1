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

const yesNoOptions = [
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

function boolText(value?: boolean | null) {
  return value ? "Yes" : "No";
}

function boolFilter(value?: boolean | null) {
  return value ? "true" : "false";
}

function locationText(profile?: NonNullable<Awaited<ReturnType<typeof listAllCrew>>[number]["crew_profile"]> | null, fallback?: string | null) {
  return profile?.location_display || [profile?.city, profile?.state, profile?.country].filter(Boolean).join(", ") || fallback || "";
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
    const name = member.full_name ?? member.email;
    const availability = profile?.availability_status ?? "available";
    const location = locationText(profile, member.home_base);
    const aircraftExperience = profile?.aircraft_type_experience || listText(profile?.preferred_aircraft) || profile?.time_in_type;
    const certificatesRatings = profile?.certificates_ratings || listText(profile?.type_ratings) || profile?.certificate_level;
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
      subtitle: [profile?.certificate_level, member.home_base].filter(Boolean).join(" - "),
      status: { label: PROFILE_STATUS_LABEL[member.status] ?? member.status, tone: profileTone(member.status) },
      secondaryStatus: { label: AVAILABILITY_STATUS_LABEL[availability] ?? availability, tone: availabilityTone(availability) },
      cells: {
        name,
        email: member.email,
        phone: member.phone,
        location,
        homeAirport: member.home_base,
        roleType: profile?.certificate_level,
        status: member.status,
        aircraftExperience,
        totalTime: profile?.total_time,
        picTime: profile?.pic_time,
        medical: profile?.medical,
        reviewed: boolText(profile?.reviewed),
        approved: boolText(profile?.approved),
        priorityCandidate: boolText(profile?.priority_candidate),
        insuranceApproved: boolText(profile?.insurance_approved),
        lastContacted: profile?.last_contacted ? formatDate(profile.last_contacted) : "-",
        secondaryStatus: availability,
        credentialStatus: CREDENTIAL_STATUS_LABEL[credentialStatus] ?? credentialStatus,
        updated: member.updated_at ? formatDateTime(member.updated_at) : "-",
      },
      searchText: [
        name,
        member.email,
        member.phone,
        member.home_base,
        location,
        profile?.certificate_level,
        certificatesRatings,
        aircraftExperience,
        profile?.medical,
        profile?.city,
        profile?.state,
        profile?.time_in_type,
        listText(profile?.preferred_aircraft),
        listText(profile?.type_ratings),
        profile?.resume_notes,
        profile?.notes,
        profile?.ops_notes,
      ].filter(Boolean).join(" "),
      filters: {
        status: member.status,
        homeAirport: member.home_base ?? "",
        roleType: profile?.certificate_level ?? "",
        aircraftCategory: profile?.preferred_aircraft?.[0] ?? "",
        medical: profile?.medical ?? "",
        reviewed: boolFilter(profile?.reviewed),
        approved: boolFilter(profile?.approved),
        priorityCandidate: boolFilter(profile?.priority_candidate),
        insuranceApproved: boolFilter(profile?.insurance_approved),
        needsManualReview: boolFilter(profile?.needs_manual_review),
        credentialStatus,
        availability,
      },
      formValues: {
        full_name: member.full_name,
        email: member.email,
        phone: member.phone,
        company_name: member.company_name,
        home_base: member.home_base,
        first_name: profile?.first_name ?? "",
        last_name: profile?.last_name ?? "",
        address: profile?.address ?? "",
        city: profile?.city ?? "",
        state: profile?.state ?? "",
        zip: profile?.zip ?? "",
        country: profile?.country ?? "",
        certificates_ratings: profile?.certificates_ratings ?? "",
        aircraft_type_experience: profile?.aircraft_type_experience ?? "",
        certificate_level: profile?.certificate_level ?? "",
        preferred_aircraft: listText(profile?.preferred_aircraft),
        type_ratings: listText(profile?.type_ratings),
        preferred_regions: listText(profile?.preferred_regions),
        total_time: profile?.total_time,
        pic_time: profile?.pic_time,
        me_time: profile?.me_time ?? profile?.multi_time,
        turbine_time: profile?.turbine_time,
        instrument_time: profile?.instrument_time,
        dual_given_time: profile?.dual_given_time,
        jet_time: profile?.jet_time,
        time_in_type: profile?.time_in_type,
        medical: profile?.medical ?? "",
        passport_mentioned: boolFilter(profile?.passport_mentioned),
        resume_notes: profile?.resume_notes ?? "",
        needs_manual_review: boolFilter(profile?.needs_manual_review),
        reviewed: boolFilter(profile?.reviewed),
        approved: boolFilter(profile?.approved),
        priority_candidate: boolFilter(profile?.priority_candidate),
        last_contacted: profile?.last_contacted ?? "",
        notes: profile?.notes ?? "",
        insurance_approved: boolFilter(profile?.insurance_approved),
        profile_status: profile?.profile_status ?? "under_review",
        crew_status: profile?.crew_status ?? "candidate",
        availability_status: availability,
        ops_notes: profile?.ops_notes,
        status: member.status,
      },
      details: [
        { label: "Contact", value: [member.email, member.phone].filter(Boolean).join(" | ") },
        { label: "Email", value: member.email },
        { label: "Phone", value: member.phone },
        { label: "Location", value: location },
        { label: "Address", value: profile?.address },
        { label: "Company", value: member.company_name ?? profile?.company },
        { label: "Certificates / Ratings", value: certificatesRatings },
        { label: "Aircraft / Type Experience", value: aircraftExperience },
        { label: "Role / Type", value: profile?.certificate_level },
        { label: "Approval", value: PROFILE_STATUS_LABEL[member.status] ?? member.status },
        { label: "Availability", value: AVAILABILITY_STATUS_LABEL[availability] ?? availability },
        { label: "Total Time", value: profile?.total_time },
        { label: "PIC Time", value: profile?.pic_time },
        { label: "Multi-Engine Time", value: profile?.me_time ?? profile?.multi_time },
        { label: "Turbine Time", value: profile?.turbine_time },
        { label: "Instrument Time", value: profile?.instrument_time },
        { label: "Dual Given", value: profile?.dual_given_time },
        { label: "Time In Type", value: profile?.time_in_type },
        { label: "Medical", value: profile?.medical },
        { label: "Passport Mentioned", value: boolText(profile?.passport_mentioned) },
        { label: "Resume Notes", value: profile?.resume_notes },
        { label: "Internal Notes", value: profile?.notes || profile?.ops_notes },
        { label: "Needs Manual Review", value: boolText(profile?.needs_manual_review) },
        { label: "Reviewed", value: boolText(profile?.reviewed) },
        { label: "Approved", value: boolText(profile?.approved) },
        { label: "Priority Candidate", value: boolText(profile?.priority_candidate) },
        { label: "Insurance Approved", value: boolText(profile?.insurance_approved) },
        { label: "Last Contacted", value: profile?.last_contacted ? formatDate(profile.last_contacted) : null },
      ],
      tabs: [
        {
          title: "Import Metadata",
          rows: [
            { label: "Source", value: profile?.import_source },
            { label: "Batch", value: profile?.import_batch_id },
            { label: "Row", value: profile?.import_row_number },
            { label: "Imported", value: profile?.imported_at ? formatDateTime(profile.imported_at) : null },
            { label: "Profile Status", value: profile?.profile_status },
            { label: "Crew Status", value: profile?.crew_status },
          ],
          empty: "No import metadata for this crew profile.",
        },
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
    { key: "homeAirport", label: "Home Airport", options: uniqueOptions(crew.map((member) => member.home_base)) },
    { key: "roleType", label: "Role / Type", options: uniqueOptions(crew.map((member) => member.crew_profile?.certificate_level)) },
    { key: "aircraftCategory", label: "Aircraft", options: uniqueOptions(crew.map((member) => member.crew_profile?.preferred_aircraft?.[0])) },
    { key: "medical", label: "Medical", options: uniqueOptions(crew.map((member) => member.crew_profile?.medical)) },
    { key: "approved", label: "Approved", options: yesNoOptions },
    { key: "reviewed", label: "Reviewed", options: yesNoOptions },
    { key: "priorityCandidate", label: "Priority Candidate", options: yesNoOptions },
    { key: "insuranceApproved", label: "Insurance Approved", options: yesNoOptions },
    { key: "needsManualReview", label: "Needs Manual Review", options: yesNoOptions },
    { key: "credentialStatus", label: "Credentials", options: Object.entries(CREDENTIAL_STATUS_LABEL).map(([value, label]) => ({ value, label })) },
    { key: "availability", label: "Availability", options: AVAILABILITY_STATUS.map(({ value, label }) => ({ value, label })) },
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
          { key: "name", label: "Name", sortable: true },
          { key: "email", label: "Email", sortable: true },
          { key: "phone", label: "Phone", sortable: true },
          { key: "location", label: "Location", sortable: true },
          { key: "aircraftExperience", label: "Aircraft / Type", sortable: true },
          { key: "totalTime", label: "Total Time", sortable: true },
          { key: "picTime", label: "PIC Time", sortable: true },
          { key: "medical", label: "Medical", sortable: true },
          { key: "reviewed", label: "Reviewed", sortable: true },
          { key: "approved", label: "Approved", sortable: true },
          { key: "priorityCandidate", label: "Priority", sortable: true },
          { key: "insuranceApproved", label: "Insurance", sortable: true },
          { key: "lastContacted", label: "Last Contacted", sortable: true },
        ]}
        filters={filters}
        fields={[
          { name: "full_name", label: "Full Name", required: true },
          { name: "email", label: "Email", type: "email", required: true },
          { name: "phone", label: "Phone", type: "tel" },
          { name: "company_name", label: "Company" },
          { name: "home_base", label: "Home Airport" },
          { name: "first_name", label: "First Name" },
          { name: "last_name", label: "Last Name" },
          { name: "address", label: "Address", fullWidth: true },
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
          { name: "dual_given_time", label: "Dual Given", type: "number" },
          { name: "jet_time", label: "Jet Time", type: "number" },
          { name: "time_in_type", label: "Time In Type" },
          { name: "medical", label: "Medical", type: "textarea", fullWidth: true },
          { name: "passport_mentioned", label: "Passport Mentioned", type: "select", options: yesNoOptions },
          { name: "resume_notes", label: "Resume Notes", type: "textarea", fullWidth: true },
          { name: "needs_manual_review", label: "Needs Manual Review", type: "select", options: yesNoOptions },
          { name: "reviewed", label: "Reviewed", type: "select", options: yesNoOptions },
          { name: "approved", label: "Approved", type: "select", options: yesNoOptions },
          { name: "priority_candidate", label: "Priority Candidate", type: "select", options: yesNoOptions },
          { name: "last_contacted", label: "Last Contacted", type: "date" },
          { name: "insurance_approved", label: "Insurance Approved", type: "select", options: yesNoOptions },
          { name: "profile_status", label: "Profile Status" },
          { name: "crew_status", label: "Crew Status" },
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
