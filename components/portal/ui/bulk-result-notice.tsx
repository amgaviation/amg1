import { Notice } from "@/components/portal/ui/primitives";

/**
 * Renders the outcome of a bulk action from the redirect params every bulk
 * server action emits (?bulk=deleted&deleted=N&released=N&skipped=N, or
 * ?error=none-selected|too-many-selected). Without this, guarded skips are
 * invisible — a fully-skipped batch would look identical to a silent failure.
 */
export function BulkResultNotice({
  params,
  entityLabel = "record",
}: {
  params: {
    bulk?: string;
    deleted?: string;
    released?: string;
    skipped?: string;
    error?: string;
  };
  entityLabel?: string;
}) {
  if (params.error === "none-selected") {
    return <Notice tone="warn">No rows were selected for the bulk action.</Notice>;
  }
  if (params.error === "too-many-selected") {
    return (
      <Notice tone="warn">
        Too many rows selected for one batch — select up to 200 and run the delete again.
      </Notice>
    );
  }
  if (params.bulk !== "deleted") return null;

  const done = Number(params.deleted ?? params.released ?? 0) || 0;
  const skipped = Number(params.skipped ?? 0) || 0;
  const plural = (count: number) => (count === 1 ? entityLabel : `${entityLabel}s`);

  if (done === 0 && skipped > 0) {
    return (
      <Notice tone="warn">
        No {plural(2)} were deleted — all {skipped} selected {plural(skipped)} were skipped by
        safety guards (protected, already processed, or not deletable in their current state).
      </Notice>
    );
  }
  if (skipped > 0) {
    return (
      <Notice tone="success">
        Deleted {done} {plural(done)}; {skipped} {plural(skipped)} skipped by safety guards.
      </Notice>
    );
  }
  if (done > 0) {
    return (
      <Notice tone="success">
        Deleted {done} {plural(done)}.
      </Notice>
    );
  }
  return null;
}
