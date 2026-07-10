import { isAdminRole } from "@/lib/portal/constants";

/**
 * Resolve the in-portal destination for a notification, branched by the
 * recipient's role. Notifications carry only `entity_type`/`entity_id`, and the
 * same entity lives at a different path for each role (a mission is
 * `/portal/admin/trips/<id>` for ops, `/portal/client/trips/<id>` for an owner,
 * `/portal/crew/missions/<id>` for crew) — so the caller must pass the viewing
 * role, not reuse the admin-only search hrefs.
 *
 * Returns `null` when there is no sensible page for that role + entity (the row
 * then renders as plain, non-clickable text). Every path returned here is a
 * route that actually exists under `app/portal/<role>/`.
 *
 * Only entity types that are emitted by `notifyUser`/`notifyAdmins` are mapped;
 * unknown types fall through to `null`.
 */
export function notificationHref(
  role: string,
  entityType: string | null,
  entityId: string | null
): string | null {
  if (!entityType) return null;

  // Detail routes need an id; list-page fallbacks do not. `detail` returns null
  // when the id is missing so we never link to a broken `/base/undefined`.
  const detail = (base: string): string | null => (entityId ? `${base}/${entityId}` : null);

  if (isAdminRole(role)) {
    switch (entityType) {
      case "mission":
        return detail("/portal/admin/trips");
      case "invoice":
        return detail("/portal/admin/invoices");
      case "quote":
        return detail("/portal/admin/quotes");
      case "client_subscription":
        return detail("/portal/admin/subscriptions");
      case "subscription_plan":
        return "/portal/admin/subscriptions";
      case "aircraft":
        return detail("/portal/admin/aircraft");
      case "crm_lead":
        return detail("/portal/admin/crm");
      case "network_application":
        return detail("/portal/admin/network-applications");
      case "thread":
        return detail("/portal/admin/messages");
      case "profile":
        // A profile id could be a client, crew, partner, or staff record; the
        // all-users directory is the one page that lands correctly for any of
        // them without guessing the sub-role.
        return "/portal/admin/users";
      case "vendor_invoice":
      case "vendor_receipt":
        return "/portal/admin/vendor-invoices";
      case "ops_task":
        return "/portal/admin/tasks";
      case "calendar_event":
        return "/portal/admin/calendar";
      case "expense":
        return "/portal/admin/expenses";
      // credential / service_request have no admin page reachable by that id.
      default:
        return null;
    }
  }

  if (role === "client") {
    switch (entityType) {
      case "mission":
        return detail("/portal/client/trips");
      case "invoice":
        return detail("/portal/client/billing");
      case "quote":
        return detail("/portal/client/quotes");
      case "client_subscription":
        return detail("/portal/client/subscriptions");
      case "aircraft":
        return "/portal/client/aircraft";
      case "thread":
        return detail("/portal/client/messages");
      case "profile":
        return "/portal/client/profile";
      default:
        return null;
    }
  }

  if (role === "crew") {
    switch (entityType) {
      case "mission":
        return detail("/portal/crew/missions");
      case "credential":
        return "/portal/crew/credentials";
      case "expense":
        return "/portal/crew/expenses";
      case "invoice":
        return "/portal/crew/invoices";
      case "thread":
        return detail("/portal/crew/messages");
      case "profile":
        return "/portal/crew/profile";
      default:
        return null;
    }
  }

  if (role === "partner") {
    switch (entityType) {
      case "service_request":
        return detail("/portal/partner/requests");
      case "invoice":
      case "vendor_invoice":
        return "/portal/partner/invoices";
      case "quote":
        return "/portal/partner/quotes";
      case "thread":
        return detail("/portal/partner/messages");
      case "profile":
        return "/portal/partner/profile";
      default:
        return null;
    }
  }

  return null;
}
