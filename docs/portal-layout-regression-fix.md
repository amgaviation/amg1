# Portal Layout Regression Fix

## Broken Pages

- `/portal/admin/crew`
- `/portal/admin/aircraft`
- `/portal/admin/clients`
- `/portal/admin/messages`

## Root Cause

The admin list pages used a shared split-pane layout that permanently reserved a selected-record panel beside the table at desktop sizes. Combined with too many visible columns, the table lost enough horizontal space that primary identities, dates, status badges, and actions became cramped or overlapped.

The portal shell also capped content at `max-w-6xl`, which is too narrow for operational admin tables after the left sidebar is accounted for.

## Layout Pattern Chosen

Crew, aircraft, and clients now use a list-to-drawer workflow:

- The scan list uses the full available card width.
- Row click opens a right-side detail drawer that overlays the content instead of shrinking the list.
- The drawer contains record metadata, related record tabs, edit, close, and archive/deactivate actions.
- Create/edit still uses the existing modal form and server actions.
- Below `xl`, records render as stacked cards rather than a compressed table.

Messages now use an inbox workflow:

- Top toolbar with title, search, filters, view chips, provider status, and compose action.
- Main thread list plus detail pane on wide screens.
- No permanent left filter panel.
- Empty states are intentional and do not show the compose form by default.
- Compose opens in an overlay when requested.

## Components Changed

- `components/portal/admin/admin-record-manager.tsx`
  - Removed permanent selected-record side panel.
  - Added overlay detail drawer.
  - Added full-width desktop grid rows.
  - Added responsive mobile/tablet record cards.
  - Moved archive/deactivate actions into the drawer footer.
  - Normalized missing display values to `—`.

- `components/portal/shell/portal-shell.tsx`
  - Increased admin content width.
  - Added `min-w-0` to the main content area.

- `app/portal/admin/crew/page.tsx`
  - Reduced scan columns to identity, email, home airport, role, approval, availability, and updated.

- `app/portal/admin/aircraft/page.tsx`
  - Combined make/model into one scan column.
  - Removed maintenance, capacity, and crew requirements from the scan list.

- `app/portal/admin/clients/page.tsx`
  - Reduced scan columns to identity, company, email, status, aircraft count, and updated.

- `app/portal/admin/messages/page.tsx`
  - Rebuilt the inbox composition around toolbar filters, thread list, detail pane, and compose overlay.

## Responsive Behavior Confirmed

Implemented behavior:

- `>= xl`: full-width operational scan grid with row-click detail drawer.
- `< xl`: stacked record cards for crew, aircraft, and clients.
- Drawer overlays the viewport and does not shrink the underlying list.
- Messages use a two-column inbox/detail layout on wide screens and stack below wide desktop.
- Compose opens only from a deliberate compose action.

Automated browser verification is still pending because local type-check/build are blocked by unrelated untracked `components/site/home/cockpit-entrance.tsx` errors that existed before this task.

## Remaining Known Issues

- `npm run lint` currently fails before portal verification because the untracked local file `components/site/home/cockpit-entrance.tsx` references missing media asset keys:
  - `homeIntroCockpitShellMobileWebp`
  - `homeIntroCockpitShellDesktopWebp`
- Those files are outside this portal layout fix and were left unchanged.
