import { AUTO_SCENE_ID, DEMO_SCENES, PHOTO_EXTENSIONS, PHOTO_FOLDER } from "@/data/seed";
import type { Area } from "@/types";

/** "Void area" → "void-area", "Garage / parking" → "garage-parking". */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export interface AreaPhotos {
  /** Name prefix the photos were found under, e.g. "walkway"; null if none were found. */
  prefix: string | null;
  label: string | null;
  empty: string | null;
  person: string | null;
  covered: string | null;
  /** File names VisionGuard looked for, to show the user what to add. */
  expected: { empty: string; person: string; covered: string };
}

/** Name prefixes to try, in order: the chosen photo set, or the area's name then its type. */
export function candidatePrefixes(area: Pick<Area, "name" | "kind" | "sceneId">): string[] {
  if (area.sceneId && area.sceneId !== AUTO_SCENE_ID) return [area.sceneId];
  const list = [slugify(area.name)];
  if (area.kind !== "custom") list.push(area.kind);
  return [...new Set(list.filter(Boolean))];
}

/** True if a photo exists at this URL (HEAD request; nothing is downloaded). */
async function exists(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD", cache: "no-store" });
    return res.ok && (res.headers.get("content-type") ?? "").startsWith("image/");
  } catch {
    return false;
  }
}

/** First existing file among name.jpg, name.jpeg, name.png, name.webp. */
async function findFile(baseNames: string[]): Promise<string | null> {
  for (const base of baseNames) {
    const urls = PHOTO_EXTENSIONS.map((ext) => `${PHOTO_FOLDER}/${base}.${ext}`);
    const found = await Promise.all(urls.map(exists));
    const hit = urls[found.indexOf(true)];
    if (hit) return hit;
  }
  return null;
}

/**
 * Look in /public/demo for photos that belong to this area.
 * For an area called "Walkway" it looks for walkway-empty.jpg (or walkway.jpg),
 * walkway-person.jpg and walkway-covered.jpg, in any supported format.
 */
export async function resolveAreaPhotos(area: Pick<Area, "name" | "kind" | "sceneId">): Promise<AreaPhotos> {
  const prefixes = candidatePrefixes(area);
  const first = prefixes[0] ?? "area";
  const expected = {
    empty: `${first}-empty.jpg`,
    person: `${first}-person.jpg`,
    covered: `${first}-covered.jpg`,
  };

  for (const prefix of prefixes) {
    const empty = await findFile([`${prefix}-empty`, prefix]);
    if (!empty) continue;
    const [person, covered] = await Promise.all([findFile([`${prefix}-person`]), findFile([`${prefix}-covered`])]);
    const label = DEMO_SCENES.find((s) => s.id === prefix)?.label ?? prefix;
    return { prefix, label, empty, person, covered, expected: { ...expected, person: `${prefix}-person.jpg`, covered: `${prefix}-covered.jpg` } };
  }
  return { prefix: null, label: null, empty: null, person: null, covered: null, expected };
}
