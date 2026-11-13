export type GaRosterEntry = {
  gaId: string;
  gaName: string;
  gaEmail: string;
  units: string[];
  mentors: string[];
  openAppointments: number;
  totalAppointments: number;
};

export type GaRosterFilters = {
  search: string;
  unit: string;
};

export const GA_ROSTER_URL = "/api/ga-roster";
export const ALL_UNITS = "all";

export function normalizeGaRosterResponse(data: unknown): GaRosterEntry[] {
  const raw = Array.isArray(data) ? data : (data as { gas?: unknown } | null)?.gas;
  if (!Array.isArray(raw)) return [];

  return raw.map((item) => {
    const entry = (item ?? {}) as Partial<GaRosterEntry>;
    return {
      gaId: String(entry.gaId ?? ""),
      gaName: entry.gaName ?? "",
      gaEmail: entry.gaEmail ?? "",
      units: Array.isArray(entry.units) ? entry.units : [],
      mentors: Array.isArray(entry.mentors) ? entry.mentors : [],
      openAppointments: Number(entry.openAppointments) || 0,
      totalAppointments: Number(entry.totalAppointments) || 0,
    };
  });
}

export function filterGaRoster(entries: GaRosterEntry[], filters: GaRosterFilters): GaRosterEntry[] {
  const search = filters.search.trim().toLowerCase();
  const unit = filters.unit && filters.unit !== ALL_UNITS ? filters.unit : null;

  return entries.filter((entry) => {
    if (unit && !entry.units.includes(unit)) return false;
    if (!search) return true;

    return [entry.gaName, entry.gaEmail, ...entry.mentors].some((value) =>
      value.toLowerCase().includes(search),
    );
  });
}

export function getUnitOptions(entries: GaRosterEntry[]): string[] {
  return [...new Set(entries.flatMap((entry) => entry.units))].sort((a, b) => a.localeCompare(b));
}

export function formatList(values: string[]): string {
  return values.length > 0 ? values.join(", ") : "—";
}

export function getGaNameLabel(entry: Pick<GaRosterEntry, "gaName" | "gaEmail">): string {
  return entry.gaName.trim() || entry.gaEmail || "Unknown GA";
}

export function getRosterCountLabel(shown: number, total: number, loading: boolean): string {
  if (loading) return "Loading...";
  const noun = total === 1 ? "GA" : "GAs";
  return shown === total ? `${total} ${noun}` : `${shown} of ${total} ${noun}`;
}
