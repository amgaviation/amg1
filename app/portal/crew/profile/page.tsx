import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { Notice, PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { ProfileEditor } from "@/components/portal/profile-editor";

export const metadata = { title: "Profile - Crew Portal" };

export default async function CrewProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const user = await requireRole("crew");
  const params = await searchParams;
  return (
    <>
      {params.success === "profile" ? <Notice tone="success">Profile details saved.</Notice> : null}
      {params.success === "avatar" ? <Notice tone="success">Profile picture updated.</Notice> : null}
      {params.error === "avatar-file" ? <Notice tone="danger">Profile pictures must be JPG, PNG, or WEBP up to 5 MB.</Notice> : null}
      {params.error === "avatar-save" || params.error === "profile-save" ? <Notice tone="danger">That change could not be saved. Try again.</Notice> : null}
      {params.error === "profile-name" ? <Notice tone="danger">Enter your name.</Notice> : null}
      <PageHeader
        eyebrow="Crew"
        title="Profile"
        description="Your profile picture and contact details — qualifications and credentials live in Credentials & Documents."
      />
      <ProfileEditor user={user} backTo="/portal/crew/profile" showHomeBase />
      <SectionCard title="Account & Credentials" icon="badgeCheck">
        <div className="grid gap-2 text-sm text-[var(--deck-text-2)]">
          <p>
            <Link href="/portal/crew/settings" className="text-[var(--deck-accent-ink)] hover:underline">
              Login &amp; security settings
            </Link>{" "}
            — change your portal email or password.
          </p>
          <p>
            <Link href="/portal/crew/credentials" className="text-[var(--deck-accent-ink)] hover:underline">
              Credentials &amp; documents
            </Link>{" "}
            — certificates, medicals, and qualification records AMG reviews.
          </p>
        </div>
      </SectionCard>
    </>
  );
}
