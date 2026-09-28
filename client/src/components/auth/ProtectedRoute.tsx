import { Navigate, Outlet } from "react-router-dom";
import type { ReactNode } from "react";
import { authClient } from "@/lib/auth-client";

type ProtectedRouteProps = {
  children?: ReactNode;
};

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (!session?.user) {
    return <Navigate to="/login" replace />;
  }

  return children ?? <Outlet />;
}
