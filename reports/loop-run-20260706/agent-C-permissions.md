# Agent C — User Simulation (permissions single pass)

[C-P-01] P1 portal — app/portal/admin/dashboard/page.tsx: admin dashboard still renders counts/QuickLinks (CRM, billing, docs/expenses/subscriptions, calendar) for modules revoked from the admin role; every click dead-ends at /portal/no-access; aggregate counts leak. Fix: gate widgets on permissionsForRole view flags. (bug)
[C-P-02] P2 portal — app/api/portal/search/route.ts + command-palette: Cmd+K search only checks isAdminRole; surfaces labels from denied modules and dead-ends on click. Fix: filter result groups by matrix view flags. (bug)
[C-P-03] P2 portal — crew "documents" matrix cell is inert: crew docs live under credentials → crew module; /portal/crew/documents is a redirect alias. Fix: make crew doc surface map consistently or drop the misleading cell. (fix)
[C-P-04] P3 portal — /portal/no-access ignores ?action: stronger-action denials read as total module lockout. Fix: action-aware copy. (fix)
[C-P-05] P3 portal — no-access copy says "ask Operations" even when the denied user IS Operations (admin). Fix: role-aware guidance. (fix)
[C-P-06] P3 portal — matrix page: live-immediately behavior only communicated after save. Fix: upfront note near Save. (feature-suggestion)
