"use client";

import { useMemo, useState } from "react";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MATRIX_ROLES,
  PERMISSION_ACTIONS,
  PERMISSION_ACTION_LABELS,
  PERMISSION_MODULES,
  type ActionFlags,
  type MatrixRole,
  type PermissionAction,
  type PermissionModule,
} from "@/lib/portal/permissions-catalog";

const ROLE_TAB_LABELS: Record<MatrixRole, string> = {
  client: "Client",
  crew: "Crew",
  partner: "Partner",
  admin: "AMG Operations",
};

type Matrix = Record<MatrixRole, Record<PermissionModule, ActionFlags>>;

/**
 * Role × module × action permission grid. Checkbox names encode the cell
 * (perm.<role>.<module>.<action>) so the server action can rebuild the matrix
 * from FormData alone. Dependency rules mirror the server: View off clears
 * the row; Add/Edit/Delete on forces View on.
 */
export function PermissionsMatrix({
  initial,
  canEdit,
  action,
}: {
  initial: Matrix;
  canEdit: boolean;
  action: (formData: FormData) => Promise<void>;
}) {
  const [matrix, setMatrix] = useState<Matrix>(initial);

  const dirtyCount = useMemo(() => {
    let count = 0;
    for (const role of MATRIX_ROLES) {
      for (const { key } of PERMISSION_MODULES) {
        for (const a of PERMISSION_ACTIONS) {
          if (matrix[role][key][a] !== initial[role][key][a]) count += 1;
        }
      }
    }
    return count;
  }, [matrix, initial]);

  // Clearing View on governance-critical modules for the Operations role
  // locks every admin out of that surface at once — make Save confirm it.
  const criticalCleared = (["users", "settings"] as PermissionModule[]).filter(
    (m) => initial.admin[m].view && !matrix.admin[m].view
  );

  function toggle(role: MatrixRole, module: PermissionModule, actionKey: PermissionAction, value: boolean) {
    setMatrix((prev) => {
      const flags = { ...prev[role][module], [actionKey]: value };
      if (actionKey === "view" && !value) {
        flags.add = false;
        flags.edit = false;
        flags.delete = false;
      }
      if (actionKey !== "view" && value) flags.view = true;
      return { ...prev, [role]: { ...prev[role], [module]: flags } };
    });
  }

  return (
    <form action={action} className="grid gap-4">
      <Tabs defaultValue="client">
        <div className="-mx-1 overflow-x-auto px-1">
          <TabsList>
            {MATRIX_ROLES.map((role) => (
              <TabsTrigger key={role} value={role} className="shrink-0">
                {ROLE_TAB_LABELS[role]}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {MATRIX_ROLES.map((role) => (
          // forceMount keeps every role's checkboxes in the DOM: native form
          // submission only serializes mounted inputs, and the server treats
          // a missing cell as false — an unmounted tab would be wiped on save.
          <TabsContent
            key={role}
            value={role}
            forceMount
            className="data-[state=inactive]:hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] text-sm">
                <thead>
                  <tr className="border-b border-[var(--deck-line)] text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="sticky left-0 z-10 bg-[var(--deck-panel)] py-2 pr-4 font-medium">Module</th>
                    {PERMISSION_ACTIONS.map((a) => (
                      <th key={a} className="px-3 py-2 text-center font-medium">
                        {PERMISSION_ACTION_LABELS[a]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PERMISSION_MODULES.map(({ key, label, description }) => (
                    <tr
                      key={key}
                      className="border-b border-[var(--deck-line)] last:border-b-0 hover:bg-[var(--deck-row-hover)]"
                    >
                      <td className="sticky left-0 z-10 bg-[var(--deck-panel)] py-2.5 pr-4">
                        <div className="font-medium text-foreground">{label}</div>
                        <div className="text-xs text-muted-foreground">{description}</div>
                      </td>
                      {PERMISSION_ACTIONS.map((a) => (
                        <td key={a} className="px-3 py-2.5 text-center align-middle">
                          <input
                            type="checkbox"
                            name={`perm.${role}.${key}.${a}`}
                            checked={matrix[role][key][a]}
                            disabled={!canEdit}
                            onChange={(e) => toggle(role, key, a, e.target.checked)}
                            aria-label={`${ROLE_TAB_LABELS[role]} — ${label} — ${PERMISSION_ACTION_LABELS[a]}`}
                            className="h-4 w-4 cursor-pointer accent-[var(--deck-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--deck-accent)] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {canEdit ? (
        <div className="flex flex-wrap items-center gap-3">
          <SubmitButton
            pendingText="Saving permissions…"
            confirm={
              criticalCleared.length > 0
                ? `You are removing AMG Operations' access to: ${criticalCleared.join(", ")}. Every admin loses that area immediately, and only the Super Admin can restore it (here, or via Restore defaults). Continue?`
                : undefined
            }
          >
            {dirtyCount > 0 ? `Save ${dirtyCount} change${dirtyCount === 1 ? "" : "s"}` : "Save permissions"}
          </SubmitButton>
          <SubmitButton
            variant="outline"
            name="reset"
            value="defaults"
            pendingText="Restoring defaults…"
            confirm="Restore every role to the code defaults? This overwrites all custom permissions."
          >
            Restore defaults
          </SubmitButton>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Read-only view. Only the Super Admin can change permissions.
        </p>
      )}
    </form>
  );
}
