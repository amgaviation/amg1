"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { COMPLIANCE_POLICY_VERSION } from "@/lib/compliance/config";
import { recordComplianceEvidence } from "@/lib/compliance/evidence";
import { listAllUsers } from "@/lib/portal/queries";
import { actor, str } from "@/app/portal/actions/_helpers";

export async function completeAdminSecurityReview(formData: FormData) {
  const admin = await actor(["admin"], "compliance.edit");
  const notes = str(formData, "notes") || null;
  const users = await listAllUsers();
  const reviewedAccounts = users.map((user) => ({
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
  }));

  await recordComplianceEvidence({
    actor: admin,
    audience: "admin",
    eventType: "admin_access_review_completed",
    eventArea: "security",
    relatedRecordType: "admin_access_review",
    policyVersion: COMPLIANCE_POLICY_VERSION,
    acknowledgmentText: "Admin completed an access and permission review for portal users shown in the security review page.",
    metadata: {
      notes,
      reviewedAccountCount: reviewedAccounts.length,
      activeAdminCount: reviewedAccounts.filter((item) => item.role === "admin" && item.status === "approved").length,
      suspendedCount: reviewedAccounts.filter((item) => item.status === "suspended").length,
      reviewedAccounts,
      mfaStatusSource: "not_available_in_profiles",
    },
  });

  revalidatePath("/portal/admin/security-review");
  redirect("/portal/admin/security-review?success=reviewed");
}
