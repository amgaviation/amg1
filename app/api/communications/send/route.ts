import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/portal/session";
import { sendCommunicationEmail } from "@/lib/portal/communications";
import { createSafeErrorResponse, getUserFacingErrorMessage, logServerError } from "@/lib/errors/user-facing-errors";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin" || user.status !== "approved") {
    return NextResponse.json(
      createSafeErrorResponse({ audience: "admin", area: "communications", action: "send", category: "permission" }),
      { status: 403 },
    );
  }

  try {
    const formData = await request.formData();
    const result = await sendCommunicationEmail(formData, user);
    if (!result.ok) {
      return NextResponse.json(
        createSafeErrorResponse({
          audience: "admin",
          area: "communications",
          action: "send",
          category: result.reason === "configuration" ? "configuration_missing" : "send_failed",
          correlationId: result.referenceId,
        }),
        { status: result.reason === "validation" ? 400 : 503 },
      );
    }

    return NextResponse.json({
      ok: true,
      threadId: result.threadId,
      messageId: result.messageId,
      message: "Message sent.",
    });
  } catch (error) {
    const referenceId = logServerError("Communications send API failed", error, { userId: user.id });
    return NextResponse.json(
      {
        ok: false,
        code: "COMMUNICATION_SEND_UNAVAILABLE",
        message: getUserFacingErrorMessage({ area: "communications", action: "send", correlationId: referenceId }),
        referenceId,
      },
      { status: 500 },
    );
  }
}
