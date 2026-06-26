import { redirect } from "next/navigation";

export default async function RequestSupportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  query.set("source", "request-support");
  const service = Array.isArray(params.service) ? params.service[0] : params.service;
  const plan = Array.isArray(params.plan) ? params.plan[0] : params.plan;
  const category = Array.isArray(params.category) ? params.category[0] : params.category;
  const aircraftCategory = Array.isArray(params.aircraftCategory) ? params.aircraftCategory[0] : params.aircraftCategory;

  if (service) query.set("service", service);
  if (category === "subscription-program-inquiry" || plan) query.set("service", "fleet-support");
  if (plan) query.set("plan", plan);
  if (aircraftCategory) query.set("aircraftCategory", aircraftCategory);

  redirect(`/contact?${query.toString()}`);
}
