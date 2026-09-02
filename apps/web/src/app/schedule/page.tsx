"use client";

import { useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";

function Redirector() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/streams?tab=schedule");
  }, [router]);

  return (
    <div className="flex items-center justify-center py-20 text-xs text-muted-foreground animate-pulse">
      Redirecting to Unified Broadcast Manager...
    </div>
  );
}

export default function SchedulePage() {
  return (
    <Suspense fallback={null}>
      <Redirector />
    </Suspense>
  );
}
