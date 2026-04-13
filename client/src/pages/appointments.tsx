import { useEffect, useMemo, useState } from "react";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { authClient } from "@/lib/auth-client";
import ExpectationReviewForm from "@/components/appointments/expectation-review-form";
import SelfEvalForm from "@/components/appointments/self-eval-form";

type Appointment = {
  id?: string | number;
  appointmentId?: string | number;
  title?: string;
  name?: string;
  subject?: string;
  status?: string;
  date?: string;
  time?: string;
  startsAt?: string;
  startTime?: string;
  scheduledAt?: string;
  mentorName?: string;
  gaName?: string;
  adminName?: string;
  unitId?: string;
};

function formatDateTime(appointment: Appointment) {
  const rawDateTime =
    appointment.startsAt ?? appointment.startTime ?? appointment.scheduledAt ?? appointment.date;

  if (!rawDateTime) {
    return appointment.time ? `Time: ${appointment.time}` : "Date not available";
  }

  const parsed = new Date(rawDateTime);

  if (Number.isNaN(parsed.getTime())) {
    if (appointment.time) {
      return `${rawDateTime} at ${appointment.time}`;
    }
    return rawDateTime;
  }

  return parsed.toLocaleString();
}

function getAppointmentTitle(appointment: Appointment, index: number) {
  return appointment.title || appointment.subject || appointment.name || `Appointment ${index + 1}`;
}

function getAppointmentId(appointment: Appointment, index: number) {
  return appointment.id ?? appointment.appointmentId ?? index;
}

function getStatusClasses(status?: string) {
  const normalized = (status || "unknown").toLowerCase();

  if (
    normalized.includes("approved") ||
    normalized.includes("confirmed") ||
    normalized.includes("complete")
  ) {
    return "bg-green-100 text-green-800 border-green-200";
  }

  if (
    normalized.includes("pending") ||
    normalized.includes("awaiting") ||
    normalized.includes("expectation")
  ) {
    return "bg-yellow-100 text-yellow-800 border-yellow-200";
  }

  if (normalized.includes("cancel")) {
    return "bg-red-100 text-red-800 border-red-200";
  }

  return "bg-slate-100 text-slate-800 border-slate-200";
}

export default function AppointmentsPage() {
  const { data: session } = authClient.useSession();

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

  async function loadAppointments() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("http://localhost:3000/api/appointments", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
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
      const message =
        err instanceof Error ? err.message : "Something went wrong while loading appointments.";

      setError(message);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("http://localhost:3000/api/appointments", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to load appointments (${response.status})`);
        }

        const data = await response.json();

        if (!isMounted) return;

        const normalized = Array.isArray(data)
          ? data
          : Array.isArray(data?.appointments)
            ? data.appointments
            : [];

        setAppointments(normalized);
      } catch (err) {
        if (!isMounted) return;

        const message =
          err instanceof Error ? err.message : "Something went wrong while loading appointments.";

        setError(message);
        setAppointments([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, []);

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

    if (role === "GA") {
      return status === "ExpectationSet" || status === "AwaitingSelfEvaluation";
    }

    if (role === "Mentor") {
      return (
        status === "AwaitingExpectationSetting" ||
        status === "SelfEvaluationCompleted" ||
        status === "AwaitingMentorEvaluation"
      );
    }

    return false;
  }

  function renderGAActionForm(appointment: Appointment, index: number) {
    const status = appointment.status;
    const appointmentId = getAppointmentId(appointment, index);

    if (userRole !== "GA") return null;

    if (status === "ExpectationSet") {
      return (
        <ExpectationReviewForm
          appointmentId={appointmentId}
          onSuccess={loadAppointments}
        />
      );
    }

    if (status === "AwaitingSelfEvaluation") {
      return (
        <SelfEvalForm
          appointmentId={appointmentId}
          onSuccess={loadAppointments}
        />
      );
    }

    return null;
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
                              {status}
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
                                <p className="text-sm text-muted-foreground">
                                  {formatDateTime(appointment)}
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
                                {status}
                              </span>
                            </div>

                            {shouldShowAction(status, userRole) && renderGAActionForm(appointment, index)}
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
      </div>
    </SidebarProvider>
  );
}