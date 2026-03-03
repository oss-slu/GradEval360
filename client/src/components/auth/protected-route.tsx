
import { Navigate, Outlet } from "react-router-dom";
import { authClient } from "@/lib/auth-client";

export default function ProtectedRoute(){
    const { data: session, isPending } = authClient.useSession();

    //Loading state
    if (isPending) {
        return <div>Loading...</div>;
    }

    //Not authenticaticated
    if (!session) {
        return <Navigate to= "/login" replace />;
    }

    //Authenticated
    return <Outlet />;


}