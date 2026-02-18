// client/src/lib/auth-client.ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    baseURL: "http://localhost:3000",
    fetchOptions: {
        credentials: "include", // Set it globally here once
    }
});