import { StreamTable } from "@/components/streams/stream-table";
import { Suspense } from "react";

export default function StreamsPage() {
  return (
    <div className="flex flex-col gap-6 w-full">
      <Suspense fallback={<div className="text-xs text-muted-foreground animate-pulse py-20 text-center">Loading broadcasts...</div>}>
        <StreamTable streams={[]} />
      </Suspense>
    </div>
  );
}
