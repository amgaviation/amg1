import assert from "node:assert/strict";
import { updateAuthEmailIfPresent } from "../lib/portal/auth-email-sync";

function mockDb(message: string | null) {
  return {
    auth: {
      admin: {
        async updateUserById() {
          return { error: message ? { message } : null };
        },
      },
    },
  };
}

async function main() {
  const missing = await updateAuthEmailIfPresent(mockDb("User not found"), "profile-only-id", "updated@example.com");
  assert.deepEqual(missing, {
    ok: true,
    authUserFound: false,
    reason: "User not found",
  });

  const updated = await updateAuthEmailIfPresent(mockDb(null), "auth-user-id", "updated@example.com");
  assert.deepEqual(updated, { ok: true, authUserFound: true });

  const fatal = await updateAuthEmailIfPresent(mockDb("Email rate limit exceeded"), "auth-user-id", "updated@example.com");
  assert.deepEqual(fatal, {
    ok: false,
    reason: "Email rate limit exceeded",
  });

  console.log("portal auth email sync verification passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
