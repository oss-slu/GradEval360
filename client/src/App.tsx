import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import { authClient } from "@/lib/auth-client";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/app-sidebar";
import { AppHeader } from "./components/app-header";
import ProtectedRoute from "./components/auth/protected-route";
import LoginPage from "@/pages/login";
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import AppointmentsPage from "@/pages/appointments";
import AppointmentDetailsPage from "@/pages/appointment-details";
import { Toaster } from "@/components/ui/toaster";

const { useSession } = authClient;

function DashboardShell() {
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
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              </div>

              <WelcomeBanner />

              <div className="grid gap-6 md:grid-cols-3">
                <div className="h-40 rounded-xl border-2 border-dashed bg-muted/50" />
                <div className="h-40 rounded-xl border-2 border-dashed bg-muted/50" />
                <div className="h-40 rounded-xl border-2 border-dashed bg-muted/50" />
              </div>
              <div className="mt-8 h-[500px] rounded-xl border bg-card shadow-sm" />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function AppRoutes() {
  const location = useLocation();
  const { data: session, isPending } = useSession();

  const isAuthed = !!session?.user;
  const onLoginRoute = location.pathname === "/login";

  if (isPending) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50/50">
        <div className="text-sm text-muted-foreground">Loading session...</div>
      </div>
    );
  }

  if (!isAuthed && !onLoginRoute) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardShell />} />
        <Route path="/appointments" element={<AppointmentsPage />} />
        <Route path="/appointments/:id" element={<AppointmentDetailsPage />} />
      </Route>
      <Route path="*" element={<Navigate to={isAuthed ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <>
      <AppRoutes />
      <Toaster />
    </>
  );
}
