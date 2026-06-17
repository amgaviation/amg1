import "server-only";

import { createServiceClient } from "@/lib/supabase/server";

export type FormSubmission = {
  id: string;
  source_page: string;
  submission_type: string;
  inquiry_type: string | null;
  support_path: string | null;
  full_name: string;
  email: string;
  phone: string;
  company_operator: string | null;
  preferred_contact_method: string | null;
  requester_role: string | null;
  aircraft_category: string | null;
  aircraft_type: string | null;
  tail_number: string | null;
  home_airport: string | null;
  current_aircraft_location: string | null;
  aircraft_status: string | null;
  timeline_urgency: string | null;
  owner_operator_approval_status: string | null;
  message: string | null;
  requested_support_summary: string | null;
  conditional_details: Record<string, string>;
  raw_form: Record<string, string>;
  acknowledgement: string;
  email_sent: boolean;
  email_sent_at: string | null;
  email_error: string | null;
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
        row.email,
        row.phone,
        row.company_operator,
        row.aircraft_type,
        row.tail_number,
        row.inquiry_type,
        row.support_path,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle)),
    );
  }

  return rows;
}
