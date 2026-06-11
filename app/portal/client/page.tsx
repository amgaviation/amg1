import { redirect } from "next/navigation";

export default function ClientPortalRoot() {
  redirect("/portal/client/dashboard");
}
