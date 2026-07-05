import Link from "next/link";
import { notFound } from "next/navigation";
import { sendCrewEmailAction } from "@/app/portal/actions/crew-email";
import { saveCrewRecord } from "@/app/portal/actions/admin";
import { CrewEmailComposer } from "@/components/portal/admin/crew-email-composer";
import {
  BackLink,
  DetailGrid,
  RecordEditForm,
  RecordSummaryHeader,
  RelatedList,
  detailValue,
  type DetailFormField,
} from "@/components/portal/admin/record-detail";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { Notice, PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AVAILABILITY_STATUS,
  AVAILABILITY_STATUS_LABEL,
  AVAILABILITY_STATUS_TONE,
  CREDENTIAL_STATUS_LABEL,
  PROFILE_STATUS,
  PROFILE_STATUS_LABEL,
  PROFILE_STATUS_TONE,
  toneFor,
} from "@/lib/portal/constants";
import { formatDate, formatDateTime } from "@/lib/portal/format";
import {
  buildCrewEmailContext,
  listCrewCommunications,
  listCrewEmailTemplates,
} from "@/lib/portal/crew-email";
import {
  listAllCredentials,
  listAllCrew,
  listAllDocuments,
  listMissionsForCrew,
} from "@/lib/portal/queries";
import { requireRole } from "@/lib/portal/session";

export const metadata = { title: "Crew Detail - Admin Portal" };

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

const crewFields: DetailFormField[] = [
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
  { name: "preferred_aircraft", label: "Aircraft Experience", type: "textarea", fullWidth: true },
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
];

function listText(value?: string[] | null) {
  return value?.length ? value.join(", ") : "";
}

function boolValue(value?: boolean | null) {
  return value ? "true" : "false";
}

function aircraftSummary(value?: string | null, fallback?: string[] | null) {
  const items = value
    ? value.split(/[,;\n]/).map((item) => item.trim()).filter(Boolean)
    : fallback ?? [];
  return items.length ? items.join(", ") : null;
}

export default async function AdminCrewDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ crewId: string }>;
  searchParams: Promise<{ success?: string; error?: string; email?: string; email_error?: string; ref?: string }>;
}) {
  const user = await requireRole("admin");
  const { crewId } = await params;
  const query = await searchParams;

  const [
    crew,
    credentials,
    missions,
    documents,
    communications,
    templates,
    emailContext,
  ] = await Promise.all([
    listAllCrew(),
    listAllCredentials(),
    listMissionsForCrew(crewId),
    listAllDocuments({ ownerId: crewId }),
    listCrewCommunications(crewId),
    listCrewEmailTemplates(),
    buildCrewEmailContext(crewId),
  ]);

  const member = crew.find((item) => item.id === crewId);
  if (!member || member.role !== "crew") notFound();

  const profile = member.crew_profile;
  const crewCredentials = credentials.filter((credential) => credential.crew_id === crewId);
  const name = profile?.display_name ?? member.full_name ?? member.email;
  const availability = profile?.availability_status ?? "available";
  const aircraftExperience = aircraftSummary(profile?.aircraft_type_experience ?? profile?.time_in_type, profile?.preferred_aircraft);
  const certificatesRatings = profile?.certificates_ratings || listText(profile?.type_ratings) || profile?.certificate_level;
  const backTo = `/portal/admin/crew/${crewId}`;
  const location = profile?.location_display || [profile?.city, profile?.state, profile?.country].filter(Boolean).join(", ") || member.home_base;

  const missionOptions = missions.map((mission) => ({
    id: mission.id,
    label: `${mission.ref} - ${mission.departure_airport} to ${mission.arrival_airport}`,
    variables: {
      mission_id: mission.ref,
      mission_date: mission.requested_departure ?? "",
      departure_airport: mission.departure_airport,
      arrival_airport: mission.arrival_airport,
      aircraft_type: [mission.aircraft?.make, mission.aircraft?.model].filter(Boolean).join(" "),
      tail_number: mission.tail_number ?? mission.aircraft?.tail_number ?? "",
    },
  }));

  const formValues = {
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
    passport_mentioned: boolValue(profile?.passport_mentioned),
    resume_notes: profile?.resume_notes ?? "",
    needs_manual_review: boolValue(profile?.needs_manual_review),
    reviewed: boolValue(profile?.reviewed),
    approved: boolValue(profile?.approved),
    priority_candidate: boolValue(profile?.priority_candidate),
    last_contacted: profile?.last_contacted ?? "",
    notes: profile?.notes ?? "",
    insurance_approved: boolValue(profile?.insurance_approved),
    profile_status: profile?.profile_status ?? "under_review",
    crew_status: profile?.crew_status ?? "candidate",
    availability_status: availability,
    ops_notes: profile?.ops_notes,
    status: member.status,
  };

  return (
    <PortalShell role="admin" user={user}>
      {query.success ? <Notice tone="success">Crew record saved.</Notice> : null}
      {query.email === "sent" ? <Notice tone="success">Crew email sent and logged.</Notice> : null}
      {query.email_error === "configuration" ? <Notice tone="danger">Crew email was logged but could not be sent because Resend is not configured.</Notice> : null}
      {query.email_error === "validation" ? <Notice tone="danger">Crew email could not be sent. Check the recipient, template, subject, and body.</Notice> : null}
      {query.email_error === "provider" ? <Notice tone="danger">Crew email was logged but Resend rejected the message.</Notice> : null}
      {query.email_error === "failed" ? <Notice tone="danger">Crew email could not be completed{query.ref ? ` (${query.ref})` : ""}.</Notice> : null}
      {query.error === "stale" ? <Notice tone="danger">This crew profile was updated, archived, or removed by another admin. Return to the roster and refresh the record.</Notice> : null}

      <PageHeader
        eyebrow="Crew Detail"
        title="Crew Record"
        description="Crew profile, qualifications, documents, mission history, communications, notes, and account settings."
        actions={<BackLink href="/portal/admin/crew" label="Crew Roster" />}
      />

      <RecordSummaryHeader
        eyebrow="Flight Crew"
        title={name}
        subtitle={[location, certificatesRatings].filter(Boolean).join(" - ")}
        status={{ label: PROFILE_STATUS_LABEL[member.status] ?? member.status, tone: toneFor(PROFILE_STATUS_TONE, member.status) }}
        secondaryStatus={{ label: AVAILABILITY_STATUS_LABEL[availability] ?? availability, tone: toneFor(AVAILABILITY_STATUS_TONE, availability) }}
        meta={member.updated_at ? `Updated ${formatDateTime(member.updated_at)}` : null}
        actions={
          emailContext ? (
            <CrewEmailComposer
              crewId={crewId}
              crewName={name}
              crewEmail={member.email}
              templates={templates}
              variables={emailContext.variables}
              missionOptions={missionOptions}
              backTo={backTo}
              action={sendCrewEmailAction}
            />
          ) : null
        }
      />

      <Tabs defaultValue="overview" className="gap-5">
        <TabsList className="h-auto w-full flex-wrap justify-start bg-[var(--deck-panel-2)] p-1">
          {["Overview", "Contact", "Qualifications / Aircraft", "Documents", "Missions", "Communications", "Notes", "Settings"].map((tab) => (
            <TabsTrigger key={tab} value={tab.toLowerCase().replace(/ \/ /g, "-").replace(/\s+/g, "-")} className="grow-0 rounded-md px-3 py-2 text-xs">
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <SectionCard title="Crew Overview" icon="users">
            <DetailGrid
              items={[
                { label: "Email", value: member.email },
                { label: "Phone", value: member.phone },
                { label: "Home Airport", value: member.home_base },
                { label: "Location", value: location },
                { label: "Aircraft Experience", value: aircraftExperience },
                { label: "Total Time", value: profile?.total_time },
                { label: "Last Contacted", value: profile?.last_contacted ? formatDate(profile.last_contacted) : null },
              ]}
            />
          </SectionCard>
          <SectionCard title="Review State" icon="clipboard">
            <DetailGrid
              items={[
                { label: "Reviewed", value: profile?.reviewed },
                { label: "Approved", value: profile?.approved },
                { label: "Priority Candidate", value: profile?.priority_candidate },
                { label: "Insurance Approved", value: profile?.insurance_approved },
                { label: "Manual Review", value: profile?.needs_manual_review },
                { label: "Profile Status", value: profile?.profile_status },
                { label: "Crew Status", value: profile?.crew_status },
              ]}
            />
          </SectionCard>
        </TabsContent>

        <TabsContent value="contact">
          <SectionCard title="Contact" icon="mail">
            <DetailGrid
              items={[
                { label: "Email", value: member.email },
                { label: "Source Email", value: profile?.source_email },
                { label: "Phone", value: member.phone },
                { label: "Address", value: profile?.address },
                { label: "City / State / Zip", value: [profile?.city, profile?.state, profile?.zip].filter(Boolean).join(", ") },
                { label: "Country", value: profile?.country },
                { label: "Company", value: member.company_name ?? profile?.company },
              ]}
            />
          </SectionCard>
        </TabsContent>

        <TabsContent value="qualifications-aircraft" className="grid gap-5 lg:grid-cols-2">
          <SectionCard title="Qualifications" icon="badgeCheck">
            <DetailGrid
              items={[
                { label: "Certificates / Ratings", value: certificatesRatings },
                { label: "Aircraft / Type", value: aircraftExperience },
                { label: "Type Ratings", value: listText(profile?.type_ratings) },
                { label: "Medical", value: profile?.medical },
                { label: "Passport Mentioned", value: profile?.passport_mentioned },
                { label: "Preferred Regions", value: listText(profile?.preferred_regions) },
              ]}
            />
          </SectionCard>
          <SectionCard title="Flight Time" icon="plane">
            <DetailGrid
              items={[
                { label: "Total Time", value: profile?.total_time },
                { label: "PIC Time", value: profile?.pic_time },
                { label: "Multi-Engine Time", value: profile?.me_time ?? profile?.multi_time },
                { label: "Turbine Time", value: profile?.turbine_time },
                { label: "Instrument Time", value: profile?.instrument_time },
                { label: "Dual Given", value: profile?.dual_given_time },
                { label: "Jet Time", value: profile?.jet_time },
                { label: "Time In Type", value: profile?.time_in_type },
              ]}
            />
          </SectionCard>
          <div className="lg:col-span-2">
            <RelatedList
              items={crewCredentials.map((credential) => ({
                title: credential.credential_type,
                meta: credential.expiration_date ? `Expires ${formatDate(credential.expiration_date)}` : "No expiration date",
                body: credential.review_notes,
                status: (
                  <StatusBadge
                    label={CREDENTIAL_STATUS_LABEL[credential.status] ?? credential.status.replace(/_/g, " ")}
                    tone={credential.status === "approved" ? "success" : credential.status === "expired" ? "danger" : "warn"}
                  />
                ),
              }))}
              emptyTitle="No credentials"
              emptyDescription="Credential records for this crew member will appear here."
            />
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <RelatedList
            items={documents.map((document) => ({
              title: document.name,
              meta: [document.doc_type, document.expiration_date ? `Expires ${formatDate(document.expiration_date)}` : null].filter(Boolean).join(" - "),
              body: document.review_notes,
              status: <StatusBadge label={document.status.replace(/_/g, " ")} tone={document.status === "approved" ? "success" : document.status === "rejected" ? "danger" : "warn"} />,
            }))}
            emptyTitle="No crew documents"
            emptyDescription="Documents uploaded for this crew member will appear here."
          />
        </TabsContent>

        <TabsContent value="missions">
          <RelatedList
            items={missions.map((mission) => ({
              title: mission.ref,
              href: `/portal/admin/trips/${mission.id}`,
              meta: [mission.departure_airport, mission.arrival_airport, mission.requested_departure ? formatDateTime(mission.requested_departure) : null].filter(Boolean).join(" - "),
              body: `Assignment: ${detailValue(mission.assignment_status)}. Aircraft: ${mission.aircraft?.tail_number ?? mission.tail_number ?? "Not provided"}.`,
              status: <StatusBadge label={mission.status.replace(/_/g, " ")} tone={mission.status === "completed" ? "success" : "info"} />,
            }))}
            emptyTitle="No crew missions"
            emptyDescription="Mission offers and assignments for this crew member will appear here."
          />
        </TabsContent>

        <TabsContent value="communications">
          <SectionCard title="Communications" icon="messageSquare">
            {communications.length ? (
              <div className="grid gap-3">
                {communications.map((message) => (
                  <details key={message.id} className="rounded-lg border border-[var(--deck-line)] bg-[var(--deck-panel)] p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                    <summary className="cursor-pointer list-none">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-[var(--deck-text)]">{message.subject}</p>
                          <p className="mt-1 font-mono text-xs text-[var(--amg-text-muted)]">
                            {formatDateTime(message.sentAt ?? message.createdAt)} - {message.recipientEmail}
                          </p>
                        </div>
                        <StatusBadge label={message.status.replace(/_/g, " ")} tone={message.status === "failed" || message.status === "bounced" ? "danger" : "success"} />
                      </div>
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--amg-text-secondary)]">{message.body}</p>
                    </summary>
                    <div className="mt-4 border-t border-[var(--deck-line)] pt-4">
                      <DetailGrid
                        items={[
                          { label: "Template", value: message.templateKey },
                          { label: "Sent By", value: message.sentBy },
                          { label: "Provider", value: message.provider },
                          { label: "Provider ID", value: message.providerMessageId },
                          { label: "Error", value: message.errorMessage },
                        ]}
                      />
                      <pre className="mt-4 whitespace-pre-wrap rounded-md border border-[var(--deck-line)] bg-[var(--deck-panel-2)] p-3 text-xs leading-5 text-[var(--deck-text-2)]">{message.body}</pre>
                    </div>
                  </details>
                ))}
              </div>
            ) : (
              <RelatedList items={[]} emptyTitle="No sent crew communications" emptyDescription="Sent crew emails will appear here after delivery is attempted." />
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="notes" className="grid gap-5 lg:grid-cols-2">
          <SectionCard title="Internal Notes" icon="clipboard">
            <DetailGrid
              items={[
                { label: "Resume Notes", value: profile?.resume_notes },
                { label: "Profile Notes", value: profile?.notes },
                { label: "Operations Notes", value: profile?.ops_notes },
              ]}
            />
          </SectionCard>
          <SectionCard title="Import Metadata" icon="database">
            <DetailGrid
              items={[
                { label: "Import Source", value: profile?.import_source },
                { label: "Import Batch ID", value: profile?.import_batch_id },
                { label: "Import Row", value: profile?.import_row_number },
                { label: "Imported At", value: profile?.imported_at ? formatDateTime(profile.imported_at) : null },
              ]}
            />
          </SectionCard>
        </TabsContent>

        <TabsContent value="settings">
          <RecordEditForm
            title="Crew Settings"
            action={saveCrewRecord}
            recordIdName="profile_id"
            recordId={crewId}
            backTo={backTo}
            fields={crewFields}
            values={formValues}
          />
        </TabsContent>
      </Tabs>

      <div className="flex justify-start">
        <Link href="/portal/admin/crew" className="text-sm text-[var(--amg-text-muted)] hover:text-[var(--deck-gold-deep)]">
          Back to crew roster
        </Link>
      </div>
    </PortalShell>
  );
}
