import { StreamTable } from "@/components/streams/stream-table";

export default function StreamsPage() {
  return (
    <div className="flex flex-col gap-6 w-full">
      <StreamTable streams={[]} />
    </div>
  );
}
