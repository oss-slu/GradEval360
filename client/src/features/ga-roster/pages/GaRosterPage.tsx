import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { authClient, authFetch } from "@/lib/auth-client";
import { getUserRole } from "@/lib/auth-client.logic";
import {
  ALL_UNITS,
  GA_ROSTER_URL,
  filterGaRoster,
  formatList,
  getGaNameLabel,
  getRosterCountLabel,
  getUnitOptions,
  normalizeGaRosterResponse,
  type GaRosterEntry,
} from "../ga-roster.logic";

const selectClassName =
  "rounded-md border bg-white px-3 py-2 text-sm text-foreground shadow-sm";

export default function GaRosterPage() {
  const { data: session } = authClient.useSession();
  const userRole = getUserRole(session);
  const isAdmin = userRole === "Admin";

  const [search, setSearch] = useState("");
  const [unit, setUnit] = useState(ALL_UNITS);

  const [roster, setRoster] = useState<GaRosterEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAdmin) return;

    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError("");

      try {
        const response = await authFetch(GA_ROSTER_URL, {
          method: "GET",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to load GA roster (${response.status})`);
        }

        setRoster(normalizeGaRosterResponse(await response.json()));
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Something went wrong while loading the GA roster.");
        setRoster([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [isAdmin]);

  const unitOptions = useMemo(() => getUnitOptions(roster), [roster]);
  const visibleRoster = useMemo(
    () => filterGaRoster(roster, { search, unit }),
    [roster, search, unit],
  );

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="bg-slate-50/50 p-8">
          <div className="mx-auto max-w-6xl rounded-xl border bg-white p-6 shadow-sm">
            <h1 className="text-xl font-semibold">GA Roster</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Only administrators can view the GA roster.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="bg-slate-50/50 p-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">GA Roster</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Graduate assistants in your department, with their mentors and open appointments.
            </p>
          </div>

          <section className="rounded-xl border bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold">Search and Filter</h2>

            <div className="flex flex-wrap gap-3">
              <div className="relative w-full max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  aria-label="Search GAs"
                  placeholder="Search by GA, email, or mentor"
                  className="pl-9"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>

              <select
                aria-label="Filter by department or unit"
                className={selectClassName}
                value={unit}
                onChange={(event) => setUnit(event.target.value)}
              >
                <option value={ALL_UNITS}>All units</option>
                {unitOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-2xl font-semibold">Graduate Assistants</h2>
              <p className="text-sm text-muted-foreground">
                {getRosterCountLabel(visibleRoster.length, roster.length, loading)}
              </p>
            </div>

            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm">
                <p className="text-sm font-medium text-red-700">Could not load the GA roster.</p>
                <p className="mt-1 text-sm text-red-600">{error}</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="border-b bg-slate-50 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-medium">GA</th>
                      <th scope="col" className="px-4 py-3 font-medium">Mentor</th>
                      <th scope="col" className="px-4 py-3 font-medium">Department / Unit</th>
                      <th scope="col" className="px-4 py-3 text-right font-medium">Open appointments</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {loading && roster.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                          Loading GA roster...
                        </td>
                      </tr>
                    ) : visibleRoster.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                          {roster.length === 0
                            ? "No graduate assistants found in your department."
                            : "No graduate assistants match the selected filters."}
                        </td>
                      </tr>
                    ) : (
                      visibleRoster.map((entry) => (
                        <tr key={entry.gaId} className="align-top hover:bg-slate-50/60">
                          <td className="px-4 py-3">
                            <p className="font-medium">{getGaNameLabel(entry)}</p>
                            {entry.gaEmail && (
                              <p className="text-xs text-muted-foreground">{entry.gaEmail}</p>
                            )}
                          </td>
                          <td className="px-4 py-3">{formatList(entry.mentors)}</td>
                          <td className="px-4 py-3">
                            {entry.units.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {entry.units.map((unitId) => (
                                  <Badge key={unitId} variant="secondary">
                                    {unitId}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-medium tabular-nums">
                            {entry.openAppointments}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
