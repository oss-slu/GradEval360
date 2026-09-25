import { authClient } from "@/lib/auth-client";
import { Badge } from "@/components/ui/badge";

const { useSession } = authClient;

function normalizeRole(role: unknown): string {
  if (!role) return "User";
  const r = String(role).trim();
  // Keep it short + pretty
  if (r.toLowerCase() === "graduateassistant") return "GA";
  return r;
}

export function WelcomeBanner() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="rounded-xl border bg-card shadow-sm p-4">
        <div className="h-5 w-56 bg-muted animate-pulse rounded" />
        <div className="mt-2 h-4 w-28 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  if (!session?.user) return null;

  const name =
    session.user.name ||
    session.user.email?.split("@")[0] ||
    "there";

  // Adjust these keys depending on how you store roles in the session
  const role =
    (session.user as any).role ??
    (session.user as any).userRole ??
    (session.user as any).metadata?.role;

  return (
    <div className="rounded-xl border bg-card shadow-sm p-4 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="text-lg font-semibold truncate">Welcome, {name}</div>
        <div className="text-sm text-muted-foreground truncate">
          You’re signed in and ready to roll.
        </div>
      </div>

      <Badge variant="secondary" className="shrink-0">
        {normalizeRole(role)}
      </Badge>
    </div>
  );
}
