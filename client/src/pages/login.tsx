import * as React from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleOktaSignIn() {
    setIsLoading(true);
    setError(null);

    try {
      await authClient.signIn.social({ provider: "okta" });
      // Usually redirects away; if it doesn't, session guard in App.tsx will handle it.
    } catch (e) {
      setError("Sign-in failed. Try again or check your Okta setup.");
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-slate-50/50 flex items-center justify-center p-6">
      <Card className="w-full max-w-md shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">GradEval360</CardTitle>
          <CardDescription>
            Sign in to continue to your dashboard.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          <Button
            className="w-full"
            onClick={handleOktaSignIn}
            disabled={isLoading}
          >
            {isLoading ? "Redirecting to Okta..." : "Sign in with Okta"}
          </Button>

          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              You’ll be redirected to Okta to authenticate.
            </p>
          )}
        </CardContent>

        <CardFooter className="text-xs text-muted-foreground">
          Need access? Contact an admin.
        </CardFooter>
      </Card>
    </div>
  );
}