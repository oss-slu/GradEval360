import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { genericOAuth } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { db } from "./index.js";
import * as schema from "./schema.js";

const requiredEnvVars = [
    "BETTER_AUTH_URL",
    "OKTA_ISSUER_URL",
    "OKTA_CLIENT_ID",
    "OKTA_CLIENT_SECRET",
] as const;

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
}

async function resolveRoleByEmail(email?: string): Promise<string> {
    if (!email) return "GA";

    const normalizedEmail = email.toLowerCase();
    const [matchedUser] = await db
        .select({ role: schema.users.role })
        .from(schema.users)
        .where(eq(schema.users.email, normalizedEmail))
        .limit(1);

    return matchedUser?.role ?? "GA";
}

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL,
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: {
            user: schema.authUsers,
            session: schema.authSessions,
            account: schema.authAccounts,
            verification: schema.authVerifications,
        }
    }),
    plugins: [
        genericOAuth({
            config: [
                {
                    providerId: "okta",
                    discoveryUrl: `${process.env.OKTA_ISSUER_URL!}/.well-known/openid-configuration`,
                    clientId: process.env.OKTA_CLIENT_ID!,
                    clientSecret: process.env.OKTA_CLIENT_SECRET!,
                    scopes: ["openid", "profile", "email"],
                    prompt: "login",
                    overrideUserInfo: true,
                    mapProfileToUser: (async (profile: any) => ({
                        role: await resolveRoleByEmail(profile.email),
                    })) as any,
                },
            ]
        })
    ],
    user: {
        additionalFields: {
            role: {
                type: "string",
                required: true,
                defaultValue: "GA"
            }
        }
    },
    trustedOrigins: ["http://localhost:5173"]
});
