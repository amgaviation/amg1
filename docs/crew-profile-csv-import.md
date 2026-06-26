# Crew Profile CSV Import

## Source CSV

- File validated locally: `/Users/tonygonzalez/Downloads/Pilot Network (MASTER) - All Pilots.csv`
- Expected rows from request: 40
- Actual valid data rows found: 39
- Blank physical data rows found: 0

Because the CSV contains 39 valid rows, a complete import from this file creates or updates 39 crew profiles, not 40.

## Import Command

```bash
npm run import:crew-profiles -- "/path/to/Pilot Network (MASTER) - All Pilots.csv"
```

Required environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional overwrite mode:

```bash
npm run import:crew-profiles -- "/path/to/Pilot Network (MASTER) - All Pilots.csv" --overwrite
```

Without `--overwrite`, the importer preserves existing non-blank manual profile fields and only fills blanks, while still refreshing import metadata and searchable text.

## Column Mapping

| CSV column | Database field |
| --- | --- |
| First Name | `crew_profiles.first_name` |
| Last Name | `crew_profiles.last_name` |
| First + Last Name | `profiles.full_name`, `crew_profiles.display_name` |
| Certificates/Ratings | `crew_profiles.certificates_ratings`, `certificate_level`, `type_ratings` |
| Total Time | `crew_profiles.total_time` |
| Aircraft/Type Experience | `crew_profiles.aircraft_type_experience`, `preferred_aircraft` |
| Email 1 | `profiles.email`, `crew_profiles.source_email` |
| Phone 1 | `profiles.phone` |
| Address 1 | `crew_profiles.address` |
| City | `crew_profiles.city` |
| State | `crew_profiles.state` |
| Zip | `crew_profiles.zip` |
| Country | `crew_profiles.country` |
| Company | `profiles.company_name`, `crew_profiles.company` |
| PIC Time | `crew_profiles.pic_time` |
| ME Time | `crew_profiles.multi_time`, `crew_profiles.me_time` |
| Turb Time | `crew_profiles.turbine_time` |
| INST Time | `crew_profiles.instrument_time` |
| Dual Given | `crew_profiles.dual_given_time` |
| Medical | `crew_profiles.medical` |
| Passport Mentioned | `crew_profiles.passport_mentioned` |
| Resume Notes | `crew_profiles.resume_notes` |
| Needs Manual Review | `crew_profiles.needs_manual_review` |
| Reviewed | `crew_profiles.reviewed` |
| Approved | `crew_profiles.approved`, `profiles.status` |
| Priority Candidate | `crew_profiles.priority_candidate` |
| Last Contacted | `crew_profiles.last_contacted` |
| Notes | `crew_profiles.notes`, `ops_notes` |
| Insurance Approved | `crew_profiles.insurance_approved` |

## Fields Added

Migration `20260626090000_imported_crew_profile_fields.sql` adds nullable import, contact, location, qualification, review, and metadata fields to `public.crew_profiles`. Existing columns are reused for `total_time`, `pic_time`, `multi_time`, `turbine_time`, `preferred_aircraft`, `type_ratings`, `certificate_level`, and `ops_notes`.

Indexes were added for email lookup, last name, city/state, review flags, status fields, and import batch lookup. RLS is not weakened; the admin portal continues to read through trusted server-side service-role calls after role checks.

## Parsing Rules

Boolean true values: `TRUE`, `true`, `Yes`, `yes`, `Y`, `1`, `checked`.

Boolean false values: `FALSE`, `false`, `No`, `no`, `N`, `0`, blank/null.

Flight-time fields are parsed as numbers after removing commas. Blank or invalid values are stored as `null`.

`Last Contacted` is parsed as a date when present. Blank or invalid dates are stored as `null`.

## Deduplication

The importer is idempotent:

1. Match existing crew by `profiles.email` when email is present.
2. If email is missing, match by `full_name + phone`.
3. If only `full_name + city + state` is available, import continues and logs a weak duplicate warning.

Existing records are updated instead of duplicated. By default, existing non-blank manual fields are preserved unless `--overwrite` is passed.

## Manual Review Flags

Rows are imported and marked `needs_manual_review = true` when any of these are true:

- Missing email
- Missing phone
- Missing first or last name
- Missing city/state
- Blank total time
- Blank certificates/ratings
- Blank aircraft/type experience
- CSV `Needs Manual Review` is true

## Portal Verification

After import, visit `/portal/admin/crew`. The crew roster should show imported profiles with:

- Full name, email, phone, and location
- Aircraft / type experience
- Total time and PIC time
- Medical
- Reviewed, approved, priority candidate, and insurance approved flags
- Last contacted

Use advanced filters for name/search text plus medical, approved, reviewed, priority candidate, insurance approved, and needs manual review.

The selected-record drawer includes contact, location, certificates/ratings, aircraft/type experience, flight-time summary, medical/passport, resume notes, internal notes, review flags, insurance approval, and import metadata.

## Database Verification

The importer prints:

- Rows read and valid rows
- Inserted, updated, skipped, flagged, and errors
- Count of imported profiles for the current batch
- Count of total crew profiles
- Boolean counts for reviewed, approved, priority candidate, insurance approved, and needs manual review
- Spot-check summaries for Timothy Buck, Stan Jones, Stephen Petit, Victor Ko, and Timothy Miller

## Manual Follow-up

The provided CSV has 39 valid rows, not 40. If a 40th pilot is expected, obtain the missing row in the source CSV and rerun the import. The rerun is safe because matching profiles are updated rather than duplicated.
