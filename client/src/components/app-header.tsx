import { authClient } from "@/lib/auth-client";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const oktaSignInURL = `http://localhost:3000/api/auth/signin/okta?callbackURL=${encodeURIComponent(
    `${window.location.origin}/dashboard`
  )}`;

  async function handleLogout() {
    await authClient.signOut();
    localStorage.clear();
    sessionStorage.clear();
    window.location.assign("/login");
  }

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase()
    : "??";

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b px-6 bg-background/95 backdrop-blur">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div className="h-4 w-px bg-border hidden md:block" />
        {/* Hyperlink added here */}
        <a 
          href="/" 
          className="font-semibold text-lg hover:text-primary transition-colors tracking-tight"
        >
          GradEval360
        </a>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <div className="hidden flex-col items-end text-right md:flex">
              <span className="text-sm font-bold leading-none">{user.name}</span>
              <span className="text-[10px] font-medium text-muted-foreground uppercase mt-1">
                {(user as any)?.role || "Visitor"}
              </span>
            </div>

            <Avatar className="h-9 w-9 border shadow-sm">
              <AvatarImage src={user.image || ""} />
              <AvatarFallback className="bg-indigo-600 text-white text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-destructive"
            >
              Logout
            </Button>
          </>
        ) : (
          <Button asChild size="sm">
            <a href={oktaSignInURL}>Sign in with Okta</a>
          </Button>
        )}
      </div>
    </header>
  );
}
