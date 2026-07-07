import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { Notice, PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { ProfileEditor } from "@/components/portal/profile-editor";

export const metadata = { title: "Profile - Client Portal" };

export default async function ClientProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const user = await requireRole("client");
  const params = await searchParams;
  return (
    <>
      {params.success === "profile" ? <Notice tone="success">Profile details saved.</Notice> : null}
      {params.success === "avatar" ? <Notice tone="success">Profile picture updated.</Notice> : null}
      {params.error === "avatar-file" ? <Notice tone="danger">Profile pictures must be JPG, PNG, or WEBP up to 5 MB.</Notice> : null}
      {params.error === "avatar-save" || params.error === "profile-save" ? <Notice tone="danger">That change could not be saved. Try again.</Notice> : null}
      {params.error === "profile-name" ? <Notice tone="danger">Enter your name.</Notice> : null}
      <PageHeader
        eyebrow="Client"
        title="Profile"
        description="Your profile picture and contact details."
      />
      <ProfileEditor user={user} backTo="/portal/client/profile" />
      <SectionCard title="Account" icon="settings">
        <p className="text-sm text-[var(--deck-text-2)]">
          <Link href="/portal/client/settings" className="text-[var(--deck-accent-ink)] hover:underline">
            Login &amp; security settings
          </Link>{" "}
          — change your portal email, password, or billing contacts.
        </p>
      </SectionCard>
    </>
  );
}
