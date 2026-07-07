import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRolePermission } from "@/lib/portal/permissions";
import { retryStripeSync, updateService } from "@/app/portal/actions/services";
import { Notice, PageHeader } from "@/components/portal/ui/primitives";
import { ServiceForm } from "@/components/portal/admin/service-form";
import {
  getServiceDetail,
  listActiveServicesForPicker,
  listPlanTierOptions,
  listServiceCategories,
  serviceFlashMessage,
} from "@/lib/portal/services";

export const metadata = { title: "Edit Service - Admin Portal" };

const BASE = "/portal/admin/financial/pricing";

export default async function EditServicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  await requireRolePermission("admin", "settings");
  const { id } = await params;
  const flashParams = await searchParams;
  const [detail, tierOptions, attachableServices, categories] = await Promise.all([
    getServiceDetail(id),
    listPlanTierOptions(),
    listActiveServicesForPicker(),
    listServiceCategories(),
  ]);
  if (!detail) notFound();
  const { service, variants, variables, attachments } = detail;
  const flash = serviceFlashMessage(flashParams);
  // The matrix edits CURRENT prices only — closed rows are history and live
  // on the detail page's price timeline (snapshot-never-reference).
  const openVariants = variants.filter((variant) => variant.effective_to === null);

  return (
    <>
      {flash ? <Notice tone={flash.tone}>{flash.message}</Notice> : null}
      <PageHeader
        eyebrow="Service Catalog"
        title={`Edit ${service.code}`}
        description={`${service.name} — cost type is permanent; price changes close the old price row and open a new one on the start date you choose (today by default).`}
        actions={
          <>
            <Link href={`${BASE}/${service.id}`} className="text-xs text-muted-foreground hover:text-accent">
              View detail
            </Link>
            <Link href={BASE} className="text-xs text-muted-foreground hover:text-accent">
              Back to catalog
            </Link>
          </>
        }
      />
      <ServiceForm
        mode="edit"
        action={updateService}
        retryAction={retryStripeSync}
        service={service}
        initialVariants={openVariants.map((variant) => ({
          id: variant.id,
          label: variant.label,
          aircraft_category: variant.aircraft_category,
          aircraft_band: variant.aircraft_band,
          plan_tier_match: variant.plan_tier_match,
          unit_price: variant.unit_price,
          annual_price: variant.annual_price,
          effective_from: variant.effective_from,
        }))}
        initialVariables={variables.map((variable) => ({
          id: variable.id,
          key: variable.key,
          label: variable.label,
          input_type: variable.input_type,
          options: variable.options,
          default_value: variable.default_value,
          min_value: variable.min_value,
          max_value: variable.max_value,
          role: variable.role,
          required: variable.required,
        }))}
        initialAttachments={attachments.map((attachment) => ({
          id: attachment.id,
          child_service_id: attachment.child_service_id,
          attachment_mode: attachment.attachment_mode,
          quantity: attachment.quantity,
          price_override: attachment.price_override,
        }))}
        tierOptions={tierOptions}
        attachableServices={attachableServices}
        categories={categories}
        restoreDraft={Boolean(flashParams.error)}
        redirectTo={`${BASE}/${service.id}/edit`}
        cancelHref={`${BASE}/${service.id}`}
      />
    </>
  );
}
