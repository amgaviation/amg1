"use client";

import { RecordDetailError } from "@/components/portal/admin/record-detail-states";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  void error;
  return <RecordDetailError label="Crew record" href="/portal/admin/crew" reset={reset} />;
}
