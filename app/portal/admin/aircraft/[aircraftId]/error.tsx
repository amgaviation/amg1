"use client";

import { RecordDetailError } from "@/components/portal/admin/record-detail-states";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  void error;
  return <RecordDetailError label="Aircraft record" href="/portal/admin/aircraft" reset={reset} />;
}
