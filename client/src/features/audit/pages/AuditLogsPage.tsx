import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Download, Search } from "lucide-react";

import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient, authFetch } from "@/lib/auth-client";
import { getUserRole } from "@/lib/auth-client.logic";
import {
  DATE_RANGE_OPTIONS,
  buildAuditLogsUrl,
  formatAuditTimestamp,
  getActorLabel,
  getActorOptionLabel,
  getAppointmentLabel,
  getResultCountLabel,
  normalizeAuditResponse,
  type AuditActor,
  type AuditLogEntry,
} from "../audit-logs.logic";

const SEARCH_DEBOUNCE_MS = 300;

const selectClassName =
  "rounded-md border bg-white px-3 py-2 text-sm text-foreground shadow-sm";

export default function AuditLogsPage() {
  const { data: session } = authClient.useSession();
  const userRole = getUserRole(session);
  const isAdmin = userRole === "Admin";

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [actorId, setActorId] = useState("all");
  const [range, setRange] = useState("all");

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [actors, setActors] = useState<AuditActor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!isAdmin) return;

    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError("");

      try {
        const response = await authFetch(buildAuditLogsUrl({ search, actorId, range }), {
          method: "GET",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to load audit logs (${response.status})`);
        }

        const data = normalizeAuditResponse(await response.json());
        setLogs(data.logs);
        setActors(data.actors);
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Something went wrong while loading audit logs.");
        setLogs([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [isAdmin, search, actorId, range]);

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="bg-slate-50/50 p-8">
          <div className="mx-auto max-w-6xl rounded-xl border bg-white p-6 shadow-sm">
            <h1 className="text-xl font-semibold">Audit Logs</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Only administrators can view audit logs.
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
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>

          <section className="rounded-xl border bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold">Search and Filter</h2>

            <div className="relative mb-3 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                aria-label="Search audit logs"
                placeholder="Search by user, action, appointment"
                className="pl-9"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <select
                aria-label="Filter by user"
                className={selectClassName}
                value={actorId}
                onChange={(event) => setActorId(event.target.value)}
              >
                <option value="all">All users</option>
                {actors.map((actor) => (
                  <option key={actor.id} value={actor.id}>
                    {getActorOptionLabel(actor)}
                  </option>
                ))}
              </select>

              <select
                aria-label="Filter by date"
                className={selectClassName}
                value={range}
                onChange={(event) => setRange(event.target.value)}
              >
                {DATE_RANGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-2xl font-semibold">Activity History</h2>
              <div className="flex items-center gap-3">
                <p className="text-sm text-muted-foreground">
                  {getResultCountLabel(logs.length, loading)}
                </p>
                <span title="CSV export coming soon">
                  <Button type="button" variant="outline" size="sm" disabled>
                    <Download className="h-4 w-4" />
                    Export CSV
                  </Button>
                </span>
              </div>
            </div>

            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm">
                <p className="text-sm font-medium text-red-700">Could not load audit logs.</p>
                <p className="mt-1 text-sm text-red-600">{error}</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="border-b bg-slate-50 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-medium">Timestamp</th>
                      <th scope="col" className="px-4 py-3 font-medium">Performed by</th>
                      <th scope="col" className="px-4 py-3 font-medium">Action Performed</th>
                      <th scope="col" className="px-4 py-3 font-medium">Appointment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {loading && logs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                          Loading audit logs...
                        </td>
                      </tr>
                    ) : logs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                          No activity matches the selected filters.
                        </td>
                      </tr>
                    ) : (
                      logs.map((entry) => (
                        <tr key={entry.id} className="align-top hover:bg-slate-50/60">
                          <td className="whitespace-nowrap px-4 py-3">
                            {formatAuditTimestamp(entry.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium">{getActorLabel(entry)}</p>
                            {entry.actorRole && (
                              <p className="text-xs text-muted-foreground">{entry.actorRole}</p>
                            )}
                          </td>
                          <td className="px-4 py-3">{entry.description}</td>
                          <td className="whitespace-nowrap px-4 py-3">
                            {entry.appointmentId ? (
                              <Link
                                to={`/appointments/${entry.appointmentId}`}
                                className="font-medium text-slate-700 underline-offset-4 hover:underline"
                              >
                                {getAppointmentLabel(entry)}
                              </Link>
                            ) : (
                              getAppointmentLabel(entry)
                            )}
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
