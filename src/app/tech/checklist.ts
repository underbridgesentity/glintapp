// Canonical 15-point quality checklist. Order matters; stored verbatim
// in qualityChecks.points as [{ point, pass }].
export const CHECKLIST_POINTS = [
  "Exterior pre-rinse (water-efficient)",
  "Wheel and arch clean",
  "Body wash with reclaim products",
  "Glass exterior",
  "Dry and detail body panels",
  "Door shuts and sills",
  "Mirrors and trim",
  "Tyre dressing",
  "Interior vacuum",
  "Dashboard and console wipe",
  "Interior glass",
  "Door pockets and cupholders",
  "Mats cleaned and replaced",
  "Boot area check",
  "Final walk-around inspection",
] as const;

export function todayInJohannesburg(): string {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "Africa/Johannesburg",
  });
}
