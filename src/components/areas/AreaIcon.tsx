import {
  ArrowLeftToLine,
  ArrowRightToLine,
  Car,
  DoorOpen,
  Fence,
  Layers,
  MapPin,
  ScanFace,
  Warehouse,
  type LucideProps,
} from "lucide-react";
import type { AreaKind } from "@/types";

const ICONS: Record<AreaKind, React.ComponentType<LucideProps>> = {
  rooftop: Warehouse,
  void: Layers,
  garage: Car,
  "front-gate": Fence,
  "entrance-face": ScanFace,
  "back-side": DoorOpen,
  "left-side": ArrowLeftToLine,
  "right-side": ArrowRightToLine,
  custom: MapPin,
};

export function AreaIcon({ kind, ...props }: { kind: AreaKind } & LucideProps) {
  const Icon = ICONS[kind] ?? MapPin;
  return <Icon {...props} />;
}
