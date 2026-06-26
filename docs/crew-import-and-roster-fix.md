# Crew Import and Roster Fix

## CSV Row Count

The uploaded Pilot Network CSV contains 39 data rows plus 1 header row. Local validation against `Pilot Network (MASTER) - All Pilots.csv` detected 39 valid crew profile rows.

The previously expected 40th profile is not present in this CSV. Do not report 40 imported profiles unless another valid row is supplied.

## Import Target

The admin Crew Management page reads from:

- `public.profiles` filtered by `role = 'crew'`
- `public.crew_profiles` loaded by matching `crew_profiles.id = profiles.id`

The importer writes both tables so imported pilots are visible to `/portal/admin/crew`.

## Supabase Environment

The importer uses:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

It does not use `NEXT_PUBLIC_SUPABASE_ANON_KEY` for import writes. The service role key must be available only in server-side or trusted script environments.

In this local environment, `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` were present in `.env.local`, but the service-role API check returned `Invalid API key`, so the live database import was not executed.

## Fields Added

Migration `supabase/migrations/20260626010000_crew_profile_csv_import_fields.sql` adds CSV-specific fields to `public.crew_profiles`, including contact fields, certificates/ratings, aircraft/type experience, flight-time fields, review booleans, notes, and import metadata.

## Import Command

After the migration is applied to the same Supabase project used by the deployed portal, run:

```bash
npm run import:crew-profiles -- "/mnt/data/Pilot Network (MASTER) - All Pilots.csv"
```

For local validation with the discovered copy:

```bash
npm run import:crew-profiles -- "/Users/tonygonzalez/Downloads/Pilot Network (MASTER) - All Pilots.csv"
```

## Import Result

Live import result from this environment:

- rows read: not run against live database
- valid rows: 39 detected locally
- inserted: not run
- updated: not run
- skipped: not run
- flagged: not run
- errors: service-role schema check returned `Invalid API key`
- import_batch_id: not generated for a live import

## Roster Layout Changes

The Crew Roster table is now full-width. Selecting a row opens a right-side drawer that overlays the table instead of shrinking it.

The table shows only scan fields: name, email, phone, location, aircraft/type experience, total time, reviewed, approved, priority, insurance, and last contacted. Lower-priority columns are hidden first at laptop widths.

The drawer shows grouped detail sections for contact, qualifications, flight time, review status, notes, and import metadata. Mobile uses stacked cards instead of horizontal table scrolling.

## Verification

After applying the migration and running the import, verify `/portal/admin/crew`:

- Search finds Timothy Buck.
- Search finds Stan Jones.
- Search finds Stephen Petit.
- Search finds Victor Ko.
- Search finds Timothy Miller.
- Row click opens the detail drawer.
- Imported fields appear in the drawer.
- The roster table is not compressed by a selected-record side panel.

## Manual Follow-Up

Apply the migration to the deployed Supabase project before running the import. The local environment does not have a valid service role key or a database URL/CLI path to apply the migration.

If a 40th profile is expected, provide an updated CSV containing that row.
