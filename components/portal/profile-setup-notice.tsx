import Link from "next/link";
import { Notice } from "@/components/portal/ui/primitives";
import { getProfileCompletion } from "@/lib/portal/profile-completion";
import type { PortalRole } from "@/lib/portal/constants";

/**
 * "Complete your profile setup" banner shared by every role dashboard.
 * Server component: completeness is computed live on each load, so the
 * banner appears only while the profile is incomplete and disappears on
 * the first load after settings are saved — no manual dismissal, no
 * stale state.
 */
export async function ProfileSetupNotice({
  userId,
  role,
}: {
  userId: string;
  role: PortalRole;
}) {
  const completion = await getProfileCompletion(userId, role);
  if (completion.complete) return null;

  return (
    <Notice tone="warn">
      <span className="font-semibold">Complete your profile setup.</span>{" "}
      Missing: {completion.missing.join(", ")}.{" "}
      <Link href={completion.settingsHref} className="font-semibold underline underline-offset-2">
        {completion.settingsLabel}
      </Link>
    </Notice>
  );
}
