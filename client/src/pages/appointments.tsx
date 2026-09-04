import { useCallback, useEffect, useMemo, useState } from "react";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { authClient, authFetch } from "@/lib/auth-client";
import { useNavigate } from "react-router-dom";
import {
  getActionLabelForRole,
  getAppointmentDateInfo,
  getAppointmentId,
  getAppointmentTitle,
  getStatusClasses,
  getStatusDisplay,
  STATUS_METADATA,
  STATUS_FLOW,
  type Appointment,
} from "./appointments.logic";

export default function AppointmentsPage() {
  const { data: session } = authClient.useSession();
  const navigate = useNavigate();

  const userRoleRaw =
    (session?.user as any)?.role ??
    (session?.user as any)?.userRole ??
    (session?.user as any)?.metadata?.role;

  const userRole = userRoleRaw ? String(userRoleRaw) : null;

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [mentorFilter, setMentorFilter] = useState("all");
  const [gaFilter, setGaFilter] = useState("all");
  const [showStatusFlow, setShowStatusFlow] = useState(false);

  const loadAppointments = useCallback(
    async (options?: { showLoading?: boolean; signal?: AbortSignal }) => {
      const showLoading = options?.showLoading ?? true;

      if (showLoading) {
        setLoading(true);
      }
      setError("");

      try {
        const response = await authFetch("/api/appointments", {
          method: "GET",
          signal: options?.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to load appointments (${response.status})`);
        }

        const data = await response.json();

        const normalized = Array.isArray(data)
          ? data
          : Array.isArray(data?.appointments)
            ? data.appointments
            : [];

        setAppointments(normalized);
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;

        const message =
          err instanceof Error ? err.message : "Something went wrong while loading appointments.";

        setError(message);
        setAppointments([]);
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    const controller = new AbortController();
    loadAppointments({ signal: controller.signal });
    return () => controller.abort();
  }, [loadAppointments]);


  const { statusOptions, mentorOptions, gaOptions } = useMemo(() => {
    const statusSet = new Set<string>();
    const mentorSet = new Set<string>();
    const gaSet = new Set<string>();

    for (const appt of appointments) {
      if (appt.status) statusSet.add(appt.status);
      if (appt.mentorName) mentorSet.add(appt.mentorName);
      if (appt.gaName) gaSet.add(appt.gaName);
    }

    const toSorted = (values: Set<string>) =>
      Array.from(values).sort((a, b) => a.localeCompare(b));

    return {
      statusOptions: toSorted(statusSet),
      mentorOptions: toSorted(mentorSet),
      gaOptions: toSorted(gaSet),
    };
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const statusOk = statusFilter === "all" || (appointment.status || "Unknown") === statusFilter;
      const mentorOk = mentorFilter === "all" || appointment.mentorName === mentorFilter;
      const gaOk = gaFilter === "all" || appointment.gaName === gaFilter;
      return statusOk && mentorOk && gaOk;
    });
  }, [appointments, statusFilter, mentorFilter, gaFilter]);

  const appointmentCountLabel = useMemo(() => {
    if (loading) return "Loading...";
    if (filteredAppointments.length === 1) return "1 appointment";
    return `${filteredAppointments.length} appointments`;
  }, [filteredAppointments.length, loading]);

  function shouldShowAction(status?: string, role?: string | null) {
    if (!role || !status) return false;
    return Boolean(getActionLabelForRole(status, role));
  }

  function renderActionButton(status?: string, appointment?: Appointment, index?: number) {
    if (!status || !appointment) return null;

    const label = getActionLabelForRole(status, userRole);
    if (!label) return null;

    const appointmentId = getAppointmentId(appointment, index ?? 0);

    return (
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
          onClick={() => navigate(`/appointments/${appointmentId}/evaluation`)}
        >
          {label}
        </button>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex h-screen w-screen overflow-hidden bg-background">
        <AppSidebar />
        <SidebarInset className="flex h-full min-w-0 flex-1 flex-col">
          <AppHeader />
          <main className="flex-1 overflow-y-auto bg-slate-50/50 p-8">
            <div className="mx-auto max-w-6xl">
              <div className="mb-6 flex items-center gap-4">
                <SidebarTrigger className="md:hidden" />
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
                  <p className="mt-1 text-sm text-muted-foreground">{appointmentCountLabel}</p>
                </div>
              </div>

              {loading ? (
                <div className="rounded-xl border bg-white p-6 shadow-sm">
                  <p className="text-sm text-muted-foreground">Loading appointments...</p>
                </div>
              ) : error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm">
                  <p className="text-sm font-medium text-red-700">Could not load appointments.</p>
                  <p className="mt-1 text-sm text-red-600">{error}</p>
                </div>
              ) : appointments.length === 0 ? (
                <div className="rounded-xl border bg-white p-6 shadow-sm">
                  <p className="text-sm text-muted-foreground">No appointments found.</p>
                </div>
              ) : (
                <>
                  <div className="rounded-xl border bg-white p-4 shadow-sm">
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-semibold">Filters</h2>
                        <p className="text-sm text-muted-foreground">
                          Narrow appointments by status, mentor, or GA.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowStatusFlow(true)}
                      >
                        View Status Flow
                      </Button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <label className="flex flex-col gap-1 text-sm font-medium text-muted-foreground">
                        Status
                        <select
                          className="rounded-md border bg-white px-3 py-2 text-sm text-foreground shadow-sm"
                          value={statusFilter}
                          onChange={(event) => setStatusFilter(event.target.value)}
                        >
                          <option value="all">All statuses</option>
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>
                              {getStatusDisplay(status)}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="flex flex-col gap-1 text-sm font-medium text-muted-foreground">
                        Mentor
                        <select
                          className="rounded-md border bg-white px-3 py-2 text-sm text-foreground shadow-sm"
                          value={mentorFilter}
                          onChange={(event) => setMentorFilter(event.target.value)}
                        >
                          <option value="all">All mentors</option>
                          {mentorOptions.map((mentor) => (
                            <option key={mentor} value={mentor}>
                              {mentor}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="flex flex-col gap-1 text-sm font-medium text-muted-foreground">
                        GA
                        <select
                          className="rounded-md border bg-white px-3 py-2 text-sm text-foreground shadow-sm"
                          value={gaFilter}
                          onChange={(event) => setGaFilter(event.target.value)}
                        >
                          <option value="all">All GAs</option>
                          {gaOptions.map((ga) => (
                            <option key={ga} value={ga}>
                              {ga}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>

                  {filteredAppointments.length === 0 ? (
                    <div className="rounded-xl border bg-white p-6 shadow-sm">
                      <p className="text-sm text-muted-foreground">
                        No appointments match the selected filters.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredAppointments.map((appointment, index) => {
                        const status = appointment.status || "Unknown";
                        const statusDisplay = getStatusDisplay(status);
                        const dateInfo = getAppointmentDateInfo(appointment);

                        return (
                          <div
                            key={String(getAppointmentId(appointment, index))}
                            className="rounded-xl border bg-white p-5 shadow-sm"
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="space-y-1">
                                <h2 className="text-lg font-semibold">
                                  {getAppointmentTitle(appointment, index)}
                                </h2>
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                  Appointment {appointment.appointmentCode ?? `GA-${index + 1}`}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {dateInfo.label}: {dateInfo.value}
                                </p>

                                {(appointment.mentorName ||
                                  appointment.gaName ||
                                  appointment.adminName) && (
                                  <div className="text-sm text-muted-foreground">
                                    {appointment.mentorName && <p>Mentor: {appointment.mentorName}</p>}
                                    {appointment.gaName && <p>GA: {appointment.gaName}</p>}
                                    {appointment.adminName && <p>Admin: {appointment.adminName}</p>}
                                  </div>
                                )}

                                {appointment.unitId && (
                                  <p className="text-sm text-muted-foreground">
                                    Unit: {appointment.unitId}
                                  </p>
                                )}
                              </div>

                              <span
                                className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-medium ${getStatusClasses(
                                  status
                                )}`}
                              >
                                {statusDisplay}
                              </span>
                            </div>
                            {STATUS_METADATA[status] && (
                              <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm">
                                <p className="font-medium text-slate-900">
                                  Next owner: {STATUS_METADATA[status].primaryActor}
                                </p>
                                <p className="mt-1 text-slate-600">
                                  {STATUS_METADATA[status].requiredAction}
                                </p>
                              </div>
                            )}
                            {shouldShowAction(status, userRole) &&
                              renderActionButton(status, appointment, index)}
                            <div className="mt-3">
                              <button
                                type="button"
                                className="text-sm font-medium text-slate-700 underline-offset-4 hover:underline"
                                onClick={() =>
                                  navigate(`/appointments/${getAppointmentId(appointment, index)}`)
                                }
                              >
                                View details
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </main>
        </SidebarInset>
        {showStatusFlow && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">Appointment Status Flow</h2>
                  <p className="text-sm text-muted-foreground">
                    Follow the lifecycle with the primary actor and required action at each step.
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-md border px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  onClick={() => setShowStatusFlow(false)}
                >
                  Close
                </button>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {STATUS_FLOW.map((step, index) => (
                  <div key={step.status} className="rounded-lg border bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Step {index + 1}
                        </p>
                        <p className="text-base font-semibold">{step.label}</p>
                        <p className="text-xs text-muted-foreground">{step.status}</p>
                      </div>
                      <span className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium text-slate-700">
                        {step.primaryActor}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-700">{step.requiredAction}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </SidebarProvider>
  );
}
