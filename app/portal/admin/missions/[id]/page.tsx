import { redirect } from "next/navigation";

export default async function AdminMissionAliasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/portal/admin/trips/${id}`);
}
