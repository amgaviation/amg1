import { NextResponse } from "next/server";

export function contentDisposition(kind: "inline" | "attachment", filename: string) {
  const safe = filename.replace(/["\r\n]/g, "_");
  return `${kind}; filename="${safe}"`;
}

export async function fileResponse(input: {
  file: Blob;
  filename: string;
  contentType?: string | null;
  disposition?: "inline" | "attachment";
}) {
  return new NextResponse(await input.file.arrayBuffer(), {
    headers: {
      "Content-Type": input.contentType || input.file.type || "application/octet-stream",
      "Content-Disposition": contentDisposition(input.disposition ?? "inline", input.filename),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
