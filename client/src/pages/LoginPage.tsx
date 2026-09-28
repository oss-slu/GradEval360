import * as React from "react";
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
  const oktaSignInURL = `http://localhost:3000/api/auth/signin/okta?callbackURL=${encodeURIComponent(
    `${window.location.origin}/dashboard`
  )}`;

  function handleOktaSignIn() {
    setIsLoading(true);
    window.location.assign(oktaSignInURL);
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

          <p className="text-xs text-muted-foreground">
            You’ll be redirected to Okta to authenticate.
          </p>
        </CardContent>

        <CardFooter className="text-xs text-muted-foreground">
          Need access? Contact an admin.
        </CardFooter>
      </Card>
    </div>
  );
}
