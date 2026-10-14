import { MapPin, TriangleAlert } from "lucide-react";

interface CustomAreaFormProps {
  selected: boolean;
  name: string;
  hazard: boolean;
  onFocus: () => void;
  onNameChange: (name: string) => void;
  onHazardChange: (hazard: boolean) => void;
}

/** "Add your own area" card, for places the presets don't cover (e.g. a void area or staircase). */
export function CustomAreaForm({
  selected,
  name,
  hazard,
  onFocus,
  onNameChange,
  onHazardChange,
}: CustomAreaFormProps) {
  return (
    <div
      className={`rounded-2xl border bg-white p-5 transition-all ${
        selected ? "border-brand shadow-md shadow-brand/10 ring-3 ring-brand-tint" : "border-line"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`grid size-11 shrink-0 place-items-center rounded-xl ${
            selected ? "bg-brand text-white" : "bg-brand-tint text-brand"
          }`}
        >
          <MapPin size={21} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-ink">Add your own area</h3>
          <p className="text-xs text-muted">For places not in the list, such as a staircase, store room or water tank.</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
        <label className="block">
          <span className="sr-only">Area name</span>
          <input
            value={name}
            maxLength={40}
            onFocus={onFocus}
            onChange={(e) => {
              onFocus();
              onNameChange(e.target.value);
            }}
            placeholder="Area name, e.g. Staircase"
            className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-shadow placeholder:text-muted/70 focus:border-brand focus:ring-3 focus:ring-brand-tint"
          />
        </label>
        <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-line px-3.5 py-2.5 text-sm text-ink hover:bg-pale">
          <input
            type="checkbox"
            checked={hazard}
            onChange={(e) => {
              onFocus();
              onHazardChange(e.target.checked);
            }}
            className="size-4 accent-danger"
          />
          <TriangleAlert size={15} className="text-danger" />
          Hazard area
        </label>
      </div>
      <p className="mt-2 text-xs text-muted">
        Mark it as a hazard if someone could fall or get hurt there; its zones can then alert at any hour.
      </p>
    </div>
  );
}
