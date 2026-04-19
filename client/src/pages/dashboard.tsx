import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { authClient, authFetch } from "@/lib/auth-client";
import {
  buildStatusCards,
  getPendingHeading,
  getStatusLabel,
  type SummaryResponse,
} from "./dashboard.logic";

export default function DashboardPage() {
  const { data: session } = authClient.useSession();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userRoleRaw =
    (session?.user as any)?.role ??
    (session?.user as any)?.userRole ??
    (session?.user as any)?.metadata?.role;

  const userRole = userRoleRaw ? String(userRoleRaw) : null;

  useEffect(() => {
    let isMounted = true;

    async function loadSummary() {
      try {
        setLoading(true);
        setError("");

        const response = await authFetch("/api/appointments/summary", { method: "GET" });
        if (!response.ok) {
          throw new Error(`Failed to load dashboard summary (${response.status})`);
        }

        const data = (await response.json()) as SummaryResponse;
        if (isMounted) {
          setSummary(data);
        }
      } catch (err) {
        if (!isMounted) return;
        const message =
          err instanceof Error ? err.message : "Something went wrong while loading the dashboard.";
        setError(message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadSummary();

    return () => {
      isMounted = false;
    };
  }, []);

  const statusCards = useMemo(() => {
    return buildStatusCards(summary);
  }, [summary]);

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex h-screen w-screen overflow-hidden bg-background">
        <AppSidebar />
        <SidebarInset className="flex h-full min-w-0 flex-1 flex-col">
          <AppHeader />
          <main className="flex-1 overflow-y-auto bg-slate-50/50 p-8">
            <div className="mx-auto max-w-6xl space-y-6">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="md:hidden" />
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Milestone 2 annual evaluation status and completion reporting.
                  </p>
                </div>
              </div>

              <WelcomeBanner />

              {loading ? (
                <div className="rounded-xl border bg-white p-6 shadow-sm">
                  <p className="text-sm text-muted-foreground">Loading milestone summary...</p>
                </div>
              ) : error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm">
                  <p className="text-sm font-medium text-red-700">Could not load dashboard.</p>
                  <p className="mt-1 text-sm text-red-600">{error}</p>
                </div>
              ) : !summary ? (
                <div className="rounded-xl border bg-white p-6 shadow-sm">
                  <p className="text-sm text-muted-foreground">No summary data available.</p>
                </div>
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl border bg-white p-6 shadow-sm">
                      <p className="text-sm text-muted-foreground">Appointments in scope</p>
                      <p className="mt-2 text-3xl font-semibold">{summary.totalAppointments}</p>
                    </div>
                    <div className="rounded-xl border bg-white p-6 shadow-sm">
                      <p className="text-sm text-muted-foreground">Completed evaluations</p>
                      <p className="mt-2 text-3xl font-semibold">{summary.completedAppointments}</p>
                    </div>
                    <div className="rounded-xl border bg-white p-6 shadow-sm">
                      <p className="text-sm text-muted-foreground">Completion progress</p>
                      <p className="mt-2 text-3xl font-semibold">{summary.completionPercentage}%</p>
                      <div className="mt-3 h-2 rounded-full bg-slate-100">
                        <div
                          className="h-2 rounded-full bg-slate-900"
                          style={{ width: `${summary.completionPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
                    <div className="rounded-xl border bg-white p-6 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h2 className="text-lg font-semibold">Appointments by status</h2>
                          <p className="text-sm text-muted-foreground">
                            Role-appropriate view of Milestone 2 workflow progress.
                          </p>
                        </div>
                        <Button variant="outline" onClick={() => navigate("/appointments")}>
                          Open appointments
                        </Button>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {statusCards.length > 0 ? (
                          statusCards.map((item) => (
                            <div key={item.status} className="rounded-lg border bg-slate-50 p-4">
                              <p className="text-sm text-muted-foreground">{item.label}</p>
                              <p className="mt-2 text-2xl font-semibold">{item.count}</p>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-lg border bg-slate-50 p-4 text-sm text-muted-foreground">
                            No appointments found for your current scope.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl border bg-white p-6 shadow-sm">
                      <h2 className="text-lg font-semibold">{getPendingHeading(userRole)}</h2>
                      <p className="text-sm text-muted-foreground">
                        Items that still need action before they reach FinalEvaluated.
                      </p>
                      <div className="mt-4 space-y-3">
                        {summary.pendingItems.length > 0 ? (
                          summary.pendingItems.slice(0, 6).map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              className="w-full rounded-lg border bg-slate-50 p-4 text-left transition hover:bg-slate-100"
                              onClick={() => navigate(`/appointments/${item.id}`)}
                            >
                              <p className="font-medium">{item.appointmentCode ?? item.id}</p>
                              <p className="mt-1 text-sm text-slate-600">{getStatusLabel(item.status)}</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                Unit: {item.unitId ?? "Not assigned"}
                              </p>
                            </button>
                          ))
                        ) : (
                          <div className="rounded-lg border bg-slate-50 p-4 text-sm text-muted-foreground">
                            Everything in your scope is complete.
                          </div>
                        )}
                      </div>
                      <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm">
                        <p className="font-medium text-slate-900">Role summary</p>
                        <p className="mt-1 text-slate-600">
                          {userRole === "GA" &&
                            "Track your remaining acknowledgments and self-evaluations here."}
                          {userRole === "Mentor" &&
                            "Use this view to identify GA records waiting on mentor evaluation work."}
                          {userRole === "Admin" &&
                            "Use this queue to prepare sign-off and finalize milestone completion."}
                          {!userRole &&
                            "Use this dashboard to review workflow completion and pending items."}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
