"use client";

import { useEffect } from "react";
import { RecordDetailError } from "@/components/portal/admin/record-detail-states";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return <RecordDetailError label="Messages" href="/portal/crew" reset={reset} />;
}
