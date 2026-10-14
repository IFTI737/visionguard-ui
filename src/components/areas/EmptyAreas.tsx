import { Cctv, Clock3, MapPin, Plus, Shapes } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";

const STEPS = [
  { icon: MapPin, title: "Add an area", text: "Rooftop, gate, garage, or your own." },
  { icon: Cctv, title: "Connect its camera", text: "Enter the camera's IP address." },
  { icon: Shapes, title: "Mark restricted zones", text: "Draw on the camera view." },
  { icon: Clock3, title: "Set the hours", text: "Choose when each zone is restricted." },
];

export function EmptyAreas() {
  return (
    <div className="flex flex-col gap-6">
      <section className="relative overflow-hidden rounded-2xl bg-brand px-6 py-8 text-white sm:px-10 sm:py-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full border-[40px] border-white/10"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 right-24 size-48 rounded-full border-[28px] border-white/5"
        />
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Welcome to VisionGuard</p>
        <h1 className="mt-2 max-w-xl text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
          Describe your building once. VisionGuard watches it for you.
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/80">
          Tell us which areas your cameras cover, then mark the places and hours that matter. You only hear
          about what needs attention.
        </p>
        <ol className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="flex gap-3 rounded-xl bg-white/10 p-3.5 backdrop-blur-sm">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white text-brand">
                <Icon size={16} />
              </span>
              <div>
                <p className="text-sm font-semibold">
                  <span className="mr-1 text-white/60">{i + 1}.</span>
                  {title}
                </p>
                <p className="text-xs text-white/75">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-col items-center rounded-2xl border-2 border-dashed border-line bg-white px-6 py-14 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-brand-tint text-brand">
          <Cctv size={26} />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-ink">You haven&apos;t added any areas yet</h2>
        <p className="mt-1 max-w-sm text-sm text-muted">
          Start with the place you worry about most, such as the rooftop or the front gate.
        </p>
        <ButtonLink href="/areas/new" className="mt-6">
          <Plus size={16} /> Add an area
        </ButtonLink>
      </section>
    </div>
  );
}
