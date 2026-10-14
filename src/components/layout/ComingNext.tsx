import { Hammer } from "lucide-react";
import { PageHeader } from "./PageHeader";

/** Placeholder for pages that will be built in the next steps. */
export function ComingNext({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-8 sm:py-8">
      <PageHeader title={title} description={description} />
      <div className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-line bg-white p-8 text-sm text-muted">
        <Hammer size={18} className="text-brand" /> This page is built in a later step.
      </div>
    </div>
  );
}
