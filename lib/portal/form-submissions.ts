import "server-only";

import { createServiceClient } from "@/lib/supabase/server";

export type FormSubmission = {
  id: string;
  source_page: string;
  submission_type: string;
  requester_name: string | null;
  first_name: string | null;
  last_name: string | null;
  inquiry_type: string | null;
  support_path: string | null;
  full_name: string;
  email: string;
  phone: string;
  company: string | null;
  organization: string | null;
  company_operator: string | null;
  preferred_contact_method: string | null;
  requester_role: string | null;
  aircraft: string | null;
  aircraft_category: string | null;
  aircraft_type: string | null;
  tail_number: string | null;
  route: string | null;
  departure_airport: string | null;
  arrival_airport: string | null;
  timing: string | null;
  requested_date: string | null;
  requested_time: string | null;
  support_type: string | null;
  service_interest: string | null;
  crew_need: string | null;
  passenger_context: string | null;
  home_airport: string | null;
  current_aircraft_location: string | null;
  aircraft_status: string | null;
  timeline_urgency: string | null;
  owner_operator_approval_status: string | null;
  message: string | null;
  requested_support_summary: string | null;
  conditional_details: Record<string, string>;
  raw_form: Record<string, string>;
  payload: Record<string, string | boolean | string[]>;
  acknowledgement: string;
  email_sent: boolean;
  email_sent_at: string | null;
  email_error: string | null;
  internal_email_sent: boolean | null;
  internal_email_sent_at: string | null;
  confirmation_email_sent: boolean | null;
  confirmation_email_sent_at: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
};

export async function listFormSubmissions(filter?: {
  source?: string;
  status?: string;
  search?: string;
}) {
  const db = await createServiceClient();
  const { data, error } = await (db as any)
    .from("contact_form_submissions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(250);

  if (error) {
    console.error("Failed to list form submissions", error);
    return [];
  }

  let rows = (data ?? []) as FormSubmission[];
  if (filter?.source && filter.source !== "All") {
    rows = rows.filter((row) => row.source_page === filter.source);
  }
  if (filter?.status && filter.status !== "All") {
    rows = rows.filter((row) => row.status === filter.status);
  }
  if (filter?.search) {
    const needle = filter.search.toLowerCase();
    rows = rows.filter((row) =>
      [
        row.full_name,
        row.requester_name,
        row.email,
        row.phone,
        row.company,
        row.organization,
        row.company_operator,
        row.aircraft,
        row.aircraft_type,
        row.tail_number,
        row.inquiry_type,
        row.support_path,
        row.support_type,
        row.service_interest,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle)),
    );
  }

  return rows;
}
