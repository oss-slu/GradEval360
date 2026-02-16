// client/src/components/app-header.tsx
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function initials(name?: string) {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "?") + (parts[parts.length - 1]?.[0] ?? "?");
}

export function AppHeader() {
  // If your version of better-auth/react doesn't accept options here,
  // remove the argument. (Keep it if it works.)
  const { data: session, isPending } = authClient.useSession({
    fetchOptions: { credentials: "include" },
  } as any);

  const user: any = session?.user;
  const fullName =
    user?.fullName || user?.name || user?.displayName || user?.email || "User";
  const role = user?.role || "Unknown";

  async function handleLogout() {
    await authClient.signOut({
      fetchOptions: {
        credentials: "include",
        onSuccess: () => {
          window.location.href = "/";
        },
      },
    } as any);
  }

  return (
    <header className="flex h-14 items-center justify-between border-b px-4">
      <div className="text-sm">
        {isPending ? (
          <span className="text-muted-foreground">Loading session…</span>
        ) : session?.user ? (
          <span>
            Welcome, <span className="font-medium">{fullName}</span>{" "}
            <span className="text-muted-foreground">({role})</span>
          </span>
        ) : (
          <span className="text-muted-foreground">Not signed in</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback>{initials(fullName)}</AvatarFallback>
        </Avatar>

        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          disabled={!session?.user}
        >
          Logout
        </Button>
      </div>
    </header>
  );
}
