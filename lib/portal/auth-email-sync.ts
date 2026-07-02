type AuthEmailSyncClient = {
  auth: {
    admin: {
      updateUserById: (
        userId: string,
        attributes: { email: string; email_confirm: boolean }
      ) => Promise<{ error: { message?: string } | null }>;
    };
  };
};

export type AuthEmailSyncResult =
  | { ok: true; authUserFound: true }
  | { ok: true; authUserFound: false; reason: string }
  | { ok: false; reason: string };

export function isMissingAuthUserError(error: { message?: string } | null | undefined) {
  return /user not found|not found|not.*exist/i.test(error?.message ?? "");
}

export async function updateAuthEmailIfPresent(
  db: AuthEmailSyncClient,
  userId: string,
  email: string
): Promise<AuthEmailSyncResult> {
  const { error } = await db.auth.admin.updateUserById(userId, {
    email,
    email_confirm: true,
  });

  if (!error) return { ok: true, authUserFound: true };

  if (isMissingAuthUserError(error)) {
    return {
      ok: true,
      authUserFound: false,
      reason: error.message ?? "auth_user_missing",
    };
  }

  return { ok: false, reason: error.message ?? "auth_email_update_failed" };
}
