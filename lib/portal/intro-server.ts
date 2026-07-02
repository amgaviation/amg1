import "server-only";

import { cookies } from "next/headers";
import {
  PORTAL_INTRO_PENDING_COOKIE,
  PORTAL_INTRO_PENDING_COOKIE_MAX_AGE_SECONDS,
} from "@/lib/portal/intro";

export const portalIntroPendingCookieOptions = {
  path: "/portal",
  maxAge: PORTAL_INTRO_PENDING_COOKIE_MAX_AGE_SECONDS,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

export async function markPortalIntroPending() {
  const cookieStore = await cookies();
  cookieStore.set(PORTAL_INTRO_PENDING_COOKIE, "1", portalIntroPendingCookieOptions);
}

export async function clearPortalIntroPending() {
  const cookieStore = await cookies();
  cookieStore.set(PORTAL_INTRO_PENDING_COOKIE, "", {
    path: "/portal",
    maxAge: 0,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  cookieStore.set(PORTAL_INTRO_PENDING_COOKIE, "", {
    path: "/",
    maxAge: 0,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}
