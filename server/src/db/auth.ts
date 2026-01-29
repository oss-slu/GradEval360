import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { genericOAuth } from "better-auth/plugins"; 
import { db } from "./index.js";
import * as schema from "./schema.js";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: {
            user: schema.users,
        }
    }),
    plugins: [
        genericOAuth({
            config: [
                {
                    providerId: "okta",
                    // For OIDC, 'discoveryUrl' is the gold standard. 
                    // It's usually your Okta issuer URL + /.well-known/openid-configuration
                    // Better-auth often handles the suffix if you just give the issuer.
                    discoveryUrl: process.env.OKTA_ISSUER_URL!,
                    clientId: process.env.OKTA_CLIENT_ID!,
                    clientSecret: process.env.OKTA_CLIENT_SECRET!,
                    scopes: ["openid", "profile", "email"],
                }
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
    }
});