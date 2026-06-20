import { AlertCircle } from "lucide-react";
import { getUserFacingErrorMessage, type UserFacingErrorInput } from "@/lib/errors/user-facing-errors";

export function SafeErrorMessage({
  className,
  ...input
}: UserFacingErrorInput & {
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={
        className ??
        "rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm leading-relaxed text-red-900"
      }
    >
      <div className="flex gap-2">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{getUserFacingErrorMessage(input)}</span>
      </div>
    </div>
  );
}
