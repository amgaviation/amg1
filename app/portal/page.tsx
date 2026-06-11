import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/portal/session";
import { ROLE_HOME } from "@/lib/portal/constants";

export default async function PortalRootPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  redirect(ROLE_HOME[user.role]);
}
