import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

import { AppHeader } from "@/components/AppHeader";
import { AppSidebar } from "@/components/AppSidebar";
import { authClient, authFetch } from "@/lib/auth-client";
import { getUserRole } from "@/lib/auth-client.logic";
import type { SummaryResponse } from "./dashboard.logic";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const STATUS_LABELS: Record<string, string> = {
  AwaitingExpectationSetting: "Expectation Setting",
  ExpectationSet: "GA Review",
  AwaitingMentorFinalization: "Mentor Finalization",
  AwaitingSelfEvaluation: "Self-Evaluation",
  SelfEvaluationCompleted: "Mentor Evaluation",
  MentorEvaluationCompleted: "Admin Review",
  AwaitingSignOff: "Sign-Off",
  FinalEvaluated: "Completed",
};

export default function DataVisualizationsPage() {
  const { data: session } = authClient.useSession();
  const userRole = getUserRole(session);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const academicYearStart = currentMonth >= 7 ? currentYear : currentYear - 1;

  const [selectedAcademicYear, setSelectedAcademicYear] = useState(String(academicYearStart));
  const [selectedUnit, setSelectedUnit] = useState("all");

  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSummary() {
      try {
        setLoading(true);
        setError("");

        const response = await authFetch(`/api/appointments/summary?academicYear=${selectedAcademicYear}&unitId=${selectedUnit}`, {
          method: "GET",
        });

        if (!response.ok) {
          throw new Error(
            `Failed to load visualization data (${response.status})`
          );
        }

        const data = (await response.json()) as SummaryResponse;
        setSummary(data);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Something went wrong while loading visualization data.";

        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadSummary();
  }, [selectedAcademicYear, selectedUnit]);

  const chartData = summary
    ? Object.entries(summary.statusCounts).map(([status, count]) => ({
        status: STATUS_LABELS[status] ?? status,
        count,
      }))
    : [];

  if (userRole !== "Admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex h-screen w-screen overflow-hidden bg-background">
        <AppSidebar />

        <SidebarInset className="flex h-full min-w-0 flex-1 flex-col">
          <AppHeader />

          <main className="flex-1 overflow-y-auto bg-muted/30 p-8">
            <div className="mx-auto max-w-6xl space-y-6">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="md:hidden" />

                <div>
                  <h1 className="text-3xl font-bold tracking-tight">
                    Appointment Visualizations
                  </h1>

                  <p className="mt-1 text-sm text-muted-foreground">
                    View appointment activity for the {selectedAcademicYear}-{Number(selectedAcademicYear) + 1} academic year.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <label
                    htmlFor="academic-year"
                    className="mb-2 block text-sm font-medium"
                >
                    Academic Year
                </label>

                <select
                    id="academic-year"
                    value={selectedAcademicYear}
                    onChange={(event) => setSelectedAcademicYear(event.target.value)}
                    className="w-full max-w-xs rounded-md border bg-background px-3 py-2 text-sm"
                >
                    <option value={String(academicYearStart)}>
                    {academicYearStart}-{academicYearStart + 1}
                    </option>

                    <option value={String(academicYearStart - 1)}>
                    {academicYearStart - 1}-{academicYearStart}
                    </option>

                    <option value={String(academicYearStart - 2)}>
                    {academicYearStart - 2}-{academicYearStart - 1}
                    </option>
                </select>
                <label
                  htmlFor="unit"
                  className="mb-2 mt-4 block text-sm font-medium"
                >
                  Unit
                </label>

                <select
                  id="unit"
                  value={selectedUnit}
                  onChange={(event) => setSelectedUnit(event.target.value)}
                  className="w-full max-w-xs rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option value="all">All Units</option>
                  <option value="UNIT-A">UNIT-A</option>
                  <option value="UNIT-B">UNIT-B</option>
                </select>
              </div>

              {loading ? (
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                  <p className="text-sm text-muted-foreground">
                    Loading visualization data...
                  </p>
                </div>
              ) : error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm">
                  <p className="text-sm font-medium text-red-700">
                    Could not load visualization data.
                  </p>

                  <p className="mt-1 text-sm text-red-600">
                    {error}
                  </p>
                </div>
              ) : summary ? (
                <>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl border bg-card p-6 shadow-sm">
                      <p className="text-sm text-muted-foreground">
                        Total Appointments
                      </p>

                      <p className="mt-2 text-3xl font-semibold">
                        {summary.totalAppointments}
                      </p>
                    </div>

                    <div className="rounded-xl border bg-card p-6 shadow-sm">
                      <p className="text-sm text-muted-foreground">
                        In Progress
                      </p>

                      <p className="mt-2 text-3xl font-semibold">
                        {summary.inProgressAppointments}
                      </p>
                    </div>

                    <div className="rounded-xl border bg-card p-6 shadow-sm">
                      <p className="text-sm text-muted-foreground">
                        Completed
                      </p>

                      <p className="mt-2 text-3xl font-semibold">
                        {summary.completedAppointments}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border bg-card p-6 shadow-sm">
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold">
                        Appointments by Status
                      </h2>

                      <p className="text-sm text-muted-foreground">
                        {selectedAcademicYear}-{Number(selectedAcademicYear) + 1} Academic Year
                      </p>
                    </div>

                    <div className="h-[400px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />

                          <XAxis
                            dataKey="status"
                            tick={{ fontSize: 12 }}
                          />

                          <YAxis allowDecimals={false} />

                          <Tooltip />

                          <Bar
                            dataKey="count"
                            fill="hsl(var(--primary))"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}