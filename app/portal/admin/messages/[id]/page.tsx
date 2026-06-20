import { redirect } from "next/navigation";

export default async function AdminMessageThreadRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/portal/admin/messages?thread=${id}`);
}
