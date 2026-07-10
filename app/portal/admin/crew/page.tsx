import { archiveCrewRecord, bulkDeletePortalAccounts, saveCrewRecord } from "@/app/portal/actions/admin";
import { BulkResultNotice } from "@/components/portal/ui/bulk-result-notice";
import { AdminRecordManager, type AdminRecordFilter, type AdminRecordRow } from "@/components/portal/admin/admin-record-manager";
import { Notice, PageHeader } from "@/components/portal/ui/primitives";
import {
  AVAILABILITY_STATUS,
  AVAILABILITY_STATUS_LABEL,
  AVAILABILITY_STATUS_TONE,
  CREDENTIAL_STATUS_LABEL,
  PROFILE_STATUS,
  PROFILE_STATUS_LABEL,
  PROFILE_STATUS_TONE,
  type Tone,
  toneFor,
} from "@/lib/portal/constants";
import { formatDate, formatDateTime } from "@/lib/portal/format";
import { listAllCredentials, listAllCrew, listAllDocuments, listAllMissions } from "@/lib/portal/queries";
import { dependencyConfirmMessage } from "@/lib/portal/record-safety";
import { requireRolePermission } from "@/lib/portal/permissions";

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

type CrewProfileForLocation = {
  city?: string | null;
  state?: string | null;
  country?: string | null;
  location_display?: string | null;
};

function profileTone(status: string): Tone {
  return toneFor(PROFILE_STATUS_TONE, status);
}

function availabilityTone(status?: string | null): Tone {
  return toneFor(AVAILABILITY_STATUS_TONE, status);
}

function listText(value?: string[] | null) {
  return value?.length ? value.join(", ") : "";
}

function boolFilter(value?: boolean | null) {
  return value ? "true" : "false";
}

function locationText(profile?: CrewProfileForLocation | null, fallback?: string | null) {
  return profile?.location_display || [profile?.city, profile?.state, profile?.country].filter(Boolean).join(", ") || fallback || null;
}

function aircraftSummary(value?: string | null, fallback?: string[] | null) {
  const items = value
    ? value.split(/[,;\n]/).map((item) => item.trim()).filter(Boolean)
    : fallback ?? [];
  if (!items.length) return null;
  if (items.length <= 2) return items.join(", ");
  return `${items.slice(0, 2).join(", ")} +${items.length - 2} more`;
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
  await requireRolePermission("admin", "crew");
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
    const dependencies = [
      { label: "credential", count: memberCredentials.length },
      { label: "mission", count: assignedMissions.length },
      { label: "document", count: memberDocuments.length },
    ];
    const name = profile?.display_name ?? member.full_name ?? member.email;
    const availability = profile?.availability_status ?? "available";
    const location = locationText(profile, member.home_base);
    const aircraftExperience = aircraftSummary(profile?.aircraft_type_experience ?? profile?.time_in_type, profile?.preferred_aircraft);
    const certificatesRatings = profile?.certificates_ratings || listText(profile?.type_ratings) || profile?.certificate_level;

    return {
      id: member.id,
      title: name,
      subtitle: [location, certificatesRatings].filter(Boolean).join(" - "),
      status: { label: PROFILE_STATUS_LABEL[member.status] ?? member.status, tone: profileTone(member.status) },
      secondaryStatus: { label: AVAILABILITY_STATUS_LABEL[availability] ?? availability, tone: availabilityTone(availability) },
      cells: {
        name,
        email: member.email,
        phone: member.phone,
        certificates: certificatesRatings,
        location,
        aircraftExperience,
        totalTime: profile?.total_time,
        reviewed: Boolean(profile?.reviewed),
        approved: Boolean(profile?.approved),
        priority: Boolean(profile?.priority_candidate),
        insurance: Boolean(profile?.insurance_approved),
        lastContacted: profile?.last_contacted ? formatDate(profile.last_contacted) : null,
      },
      searchText: [
        name,
        member.email,
        profile?.source_email,
        member.phone,
        member.home_base,
        location,
        profile?.company,
        certificatesRatings,
        profile?.aircraft_type_experience,
        profile?.medical,
        profile?.resume_notes,
        profile?.notes,
        profile?.ops_notes,
        profile?.searchable_text,
      ].filter(Boolean).join(" "),
      filters: {
        reviewed: boolFilter(profile?.reviewed),
        approved: boolFilter(profile?.approved),
        priority: boolFilter(profile?.priority_candidate),
        insurance: boolFilter(profile?.insurance_approved),
        needsManualReview: boolFilter(profile?.needs_manual_review),
        state: profile?.state ?? "",
        aircraftKeyword: [profile?.aircraft_type_experience, listText(profile?.preferred_aircraft), profile?.time_in_type].filter(Boolean).join(" "),
      },
      formValues: {
        full_name: member.full_name,
        email: member.email,
        phone: member.phone,
        company_name: member.company_name ?? profile?.company,
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
        { label: "Email", value: member.email },
        { label: "Phone", value: member.phone },
        { label: "Location", value: location },
        { label: "Aircraft", value: aircraftExperience },
      ],
      detailSections: [
        {
          title: "Contact",
          rows: [
            { label: "Email", value: member.email },
            { label: "Source Email", value: profile?.source_email },
            { label: "Phone", value: member.phone },
            { label: "Address", value: profile?.address },
            { label: "City / State / Zip", value: [profile?.city, profile?.state, profile?.zip].filter(Boolean).join(", ") },
            { label: "Country", value: profile?.country },
            { label: "Company", value: member.company_name ?? profile?.company },
          ],
        },
        {
          title: "Qualifications",
          rows: [
            { label: "Certificates / Ratings", value: certificatesRatings },
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
            { label: "Dual Given", value: profile?.dual_given_time },
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
            { label: "Profile Status", value: profile?.profile_status },
            { label: "Crew Status", value: profile?.crew_status },
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
      archiveConfirm: dependencyConfirmMessage({
        action: "Deactivate",
        entity: "crew profile",
        dependencies,
        fallback: "Deactivate this crew profile? Historical credentials and assignments remain visible to admins.",
      }),
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
    { key: "reviewed", label: "Reviewed", options: yesNoOptions },
    { key: "approved", label: "Approved", options: yesNoOptions },
    { key: "priority", label: "Priority Candidate", options: yesNoOptions },
    { key: "insurance", label: "Insurance Approved", options: yesNoOptions },
    { key: "needsManualReview", label: "Needs Review", options: yesNoOptions },
    { key: "state", label: "State", options: uniqueOptions(crew.map((member) => member.crew_profile?.state)) },
    { key: "aircraftKeyword", label: "Aircraft / Type Keyword", type: "text" },
  ];

  return (
    <>
      {params.success === "archived-linked" ? <Notice tone="success">Crew profile deactivated. Credentials, assignments, and documents were preserved.</Notice> : null}
      {params.success && params.success !== "archived-linked" ? <Notice tone="success">Crew record saved.</Notice> : null}
      {params.error === "missing" ? <Notice tone="danger">Crew name and valid email are required.</Notice> : null}
      {params.error === "duplicate" ? <Notice tone="danger">A profile already exists for that email.</Notice> : null}
      {params.error === "invite" ? <Notice tone="danger">Portal invitation could not be sent.</Notice> : null}
      {params.error === "email" ? <Notice tone="danger">Email update could not be completed.</Notice> : null}
      {params.error === "crew-profile" ? <Notice tone="danger">Crew profile details could not be saved.</Notice> : null}
      {params.error === "stale" ? <Notice tone="danger">This crew profile was updated, archived, or removed by another admin. Refresh the roster and try again.</Notice> : null}
      {params.error === "save" ? <Notice tone="danger">Crew record could not be saved.</Notice> : null}

      <PageHeader
        eyebrow="AMG Operations"
        title="Crew Management"
        description="Manage crew profiles, approval status, qualifications, aircraft experience, credentials, and assignment readiness."
      />

      <BulkResultNotice params={params} entityLabel="crew member" />
      <AdminRecordManager
        title="Crew Roster"
        description="Crew records by approval status, availability, credentials, aircraft experience, and home base."
        rows={rows}
        columns={[
          { key: "name", label: "Name", sortable: true, className: "w-[15rem]" },
          { key: "certificates", label: "Certificates", sortable: true, className: "w-[14rem]" },
          { key: "location", label: "Location", sortable: true, className: "w-[10rem]" },
          { key: "aircraftExperience", label: "Aircraft / Type", sortable: true, className: "w-[14rem]" },
          { key: "totalTime", label: "Total Time", sortable: true, className: "w-[7rem]" },
          { key: "approved", label: "Approved", sortable: true, className: "w-[7rem]" },
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
          { name: "dual_given_time", label: "Dual Given", type: "number" },
          { name: "jet_time", label: "Jet Time", type: "number" },
          { name: "time_in_type", label: "Time In Type" },
          { name: "medical", label: "Medical", type: "textarea", fullWidth: true },
          { name: "passport_mentioned", label: "Passport Mentioned", type: "select", options: yesNoOptions },
          { name: "needs_manual_review", label: "Needs Manual Review", type: "select", options: yesNoOptions },
          { name: "reviewed", label: "Reviewed", type: "select", options: yesNoOptions },
          { name: "approved", label: "Approved", type: "select", options: yesNoOptions },
          { name: "priority_candidate", label: "Priority Candidate", type: "select", options: yesNoOptions },
          { name: "insurance_approved", label: "Insurance Approved", type: "select", options: yesNoOptions },
          { name: "last_contacted", label: "Last Contacted", type: "date" },
          { name: "profile_status", label: "Profile Status" },
          { name: "crew_status", label: "Crew Status" },
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
        hiddenStatuses={["Suspended", "Deleted"]}
        bulkDelete={{ action: bulkDeletePortalAccounts, entity: "crew", entityLabel: "crew member" }}
        emptyTitle="No crew match"
        emptyDescription="Adjust search or filters, or create a new crew member."
        detailEyebrow="Crew Detail"
        detailHrefBase="/portal/admin/crew"
      />
    </>
  );
}
