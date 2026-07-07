import Link from "next/link";
import { requireRolePermission } from "@/lib/portal/permissions";
import { createService } from "@/app/portal/actions/services";
import { Notice, PageHeader } from "@/components/portal/ui/primitives";
import { ServiceForm } from "@/components/portal/admin/service-form";
import { listActiveServicesForPicker, listPlanTierOptions, serviceFlashMessage } from "@/lib/portal/services";

export const metadata = { title: "New Service - Admin Portal" };

const BASE = "/portal/admin/financial/pricing";

export default async function NewServicePage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  await requireRolePermission("admin", "settings");
  const params = await searchParams;
  const flash = serviceFlashMessage(params);
  const [tierOptions, attachableServices] = await Promise.all([listPlanTierOptions(), listActiveServicesForPicker()]);

  return (
    <>
      {flash ? <Notice tone={flash.tone}>{flash.message}</Notice> : null}
      <PageHeader
        eyebrow="AMG Billing"
        title="New Service"
        description="Define a catalog service. The cost type — coordination fee, pass-through, or plan fee — is permanent once created; AMG margin lives only in coordination fees and plan retainers."
        actions={
          <Link href={BASE} className="text-xs text-muted-foreground hover:text-accent">
            Back to catalog
          </Link>
        }
      />
      <ServiceForm
        mode="create"
        action={createService}
        tierOptions={tierOptions}
        attachableServices={attachableServices}
        redirectTo={`${BASE}/new`}
        cancelHref={BASE}
      />
    </>
  );
}
