import { useEffect, useMemo, useState } from "react";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";

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
  return (
    appointment.title ||
    appointment.subject ||
    appointment.name ||
    `Appointment ${index + 1}`
  );
}

function getAppointmentId(appointment: Appointment, index: number) {
  return appointment.id ?? appointment.appointmentId ?? index;
}

function getStatusClasses(status?: string) {
  const normalized = (status || "unknown").toLowerCase();

  if (normalized.includes("approved") || normalized.includes("confirmed") || normalized.includes("complete")) {
    return "bg-green-100 text-green-800 border-green-200";
  }

  if (normalized.includes("pending")) {
    return "bg-yellow-100 text-yellow-800 border-yellow-200";
  }

  if (normalized.includes("cancel")) {
    return "bg-red-100 text-red-800 border-red-200";
  }

  return "bg-slate-100 text-slate-800 border-slate-200";
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadAppointments() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/appointments", {
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

        // Handles either:
        // 1. an array response
        // 2. an object like { appointments: [...] }
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

    loadAppointments();

    return () => {
      isMounted = false;
    };
  }, []);

  const appointmentCountLabel = useMemo(() => {
    if (loading) return "Loading...";
    if (appointments.length === 1) return "1 appointment";
    return `${appointments.length} appointments`;
  }, [appointments.length, loading]);

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex h-screen w-screen bg-background overflow-hidden">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 min-w-0 h-full">
          <AppHeader />
          <main className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
            <div className="mx-auto max-w-6xl">
              <div className="flex items-center gap-4 mb-6">
                <SidebarTrigger className="md:hidden" />
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
                  <p className="text-sm text-muted-foreground mt-1">{appointmentCountLabel}</p>
                </div>
              </div>

              {loading ? (
                <div className="rounded-xl border bg-white p-6 shadow-sm">
                  <p className="text-sm text-muted-foreground">Loading appointments...</p>
                </div>
              ) : error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm">
                  <p className="text-sm font-medium text-red-700">Could not load appointments.</p>
                  <p className="text-sm text-red-600 mt-1">{error}</p>
                </div>
              ) : appointments.length === 0 ? (
                <div className="rounded-xl border bg-white p-6 shadow-sm">
                  <p className="text-sm text-muted-foreground">No appointments found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {appointments.map((appointment, index) => {
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

                            {(appointment.mentorName || appointment.gaName || appointment.adminName) && (
                              <div className="text-sm text-muted-foreground">
                                {appointment.mentorName && <p>Mentor: {appointment.mentorName}</p>}
                                {appointment.gaName && <p>GA: {appointment.gaName}</p>}
                                {appointment.adminName && <p>Admin: {appointment.adminName}</p>}
                              </div>
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
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}