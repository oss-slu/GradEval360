import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Toaster } from "@/components/ui/toaster";
import { authClient } from "@/lib/auth-client";
import AppointmentDetailsPage from "@/features/appointments/pages/AppointmentDetailsPage";
import AppointmentsPage from "@/features/appointments/pages/AppointmentsPage";
import DashboardPage from "@/features/dashboard/pages/DashboardPage";
import LoginPage from "@/pages/LoginPage";
import MentorExpectationSettingPage from "@/features/appointments/pages/MentorExpectationSettingPage";
import ProfilePage from "@/pages/ProfilePage";

const { useSession } = authClient;

function AppRoutes() {
  const location = useLocation();
  const { data: session, isPending } = useSession();

  const isAuthed = !!session?.user;
  const onLoginRoute = location.pathname === "/login";

  if (isPending) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-slate-50/50">
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
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/appointments" element={<AppointmentsPage />} />
        <Route path="/appointments/:id" element={<AppointmentDetailsPage />} />
        <Route path="/appointments/:id/evaluation" element={<MentorExpectationSettingPage />} />
        <Route path="/profile" element={<ProfilePage />} />
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
