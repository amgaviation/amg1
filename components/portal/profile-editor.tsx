import { SectionCard } from "@/components/portal/ui/primitives";
import { TextField } from "@/components/portal/ui/fields";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { updateOwnProfile, uploadAvatar } from "@/app/portal/actions/profiles";
import { initials } from "@/lib/portal/format";

/**
 * Self-service profile editor shared by client, crew, and partner profile
 * pages: profile picture upload plus the details every contractor/client may
 * maintain themselves (name, phone, company, base). Email and role stay in
 * the account security / admin flows.
 */
export function ProfileEditor({
  user,
  backTo,
  showHomeBase = false,
}: {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    companyName: string | null;
    homeBase?: string | null;
    avatarPath?: string | null;
  };
  backTo: string;
  showHomeBase?: boolean;
}) {
  return (
    <>
      <SectionCard
        title="Profile Picture"
        icon="users"
        description="Shown across the portal — in the header, messages, and AMG's directory."
      >
        <div className="flex flex-wrap items-center gap-5">
          {user.avatarPath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/portal/avatars/${user.id}?v=${encodeURIComponent(user.avatarPath)}`}
              alt={`${user.name} profile picture`}
              className="h-20 w-20 rounded-full border border-[var(--deck-line-strong)] object-cover"
            />
          ) : (
            <span className="flex h-20 w-20 items-center justify-center rounded-full border border-[var(--deck-accent-line)] bg-[var(--deck-accent-tint)] text-xl font-bold text-[var(--deck-accent-ink)]">
              {initials(user.name)}
            </span>
          )}
          <form action={uploadAvatar} className="grid min-w-0 flex-1 gap-3">
            <input type="hidden" name="back_to" value={backTo} />
            <input
              type="file"
              name="avatar"
              required
              accept="image/jpeg,image/png,image/webp"
              className="block w-full cursor-pointer rounded-md border border-dashed border-[var(--deck-line-strong)] bg-[var(--deck-panel-2)] p-3 text-sm text-[var(--deck-text-2)] file:mr-3 file:rounded-md file:border-0 file:bg-[var(--deck-accent)] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[var(--deck-on-accent)]"
            />
            <div>
              <SubmitButton variant="outline" size="sm" pendingText="Uploading...">
                {user.avatarPath ? "Replace picture" : "Upload picture"}
              </SubmitButton>
            </div>
            <p className="text-xs text-[var(--deck-text-3)]">JPG, PNG, or WEBP up to 5 MB.</p>
          </form>
        </div>
      </SectionCard>

      <SectionCard title="Your Details" icon="settings">
        <form action={updateOwnProfile} className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="back_to" value={backTo} />
          <TextField label="Full Name" name="full_name" required defaultValue={user.name} />
          <TextField label="Phone" name="phone" type="tel" defaultValue={user.phone ?? ""} placeholder="+1 (555) 000-0000" />
          <TextField label="Company" name="company_name" defaultValue={user.companyName ?? ""} />
          {showHomeBase ? (
            <TextField label="Home Base" name="home_base" defaultValue={user.homeBase ?? ""} placeholder="e.g. KFXE" />
          ) : null}
          <div className="md:col-span-2">
            <SubmitButton pendingText="Saving...">Save details</SubmitButton>
          </div>
        </form>
      </SectionCard>
    </>
  );
}
