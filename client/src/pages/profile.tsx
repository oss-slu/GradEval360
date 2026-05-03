import { useEffect, useMemo, useState } from "react";
import { Building2, Mail, ShieldCheck, User2, Users2 } from "lucide-react";

import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { authFetch } from "@/lib/auth-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

type UnitLike =
  | string
  | {
      id?: string;
      name?: string;
    };

type RawProfileResponse = {
  fullName?: string;
  email?: string;
  role?: string;
  unitId?: string | null;
  unitIds?: string[] | null;
  primaryUnit?: UnitLike | null;
  assignedUnits?: UnitLike[] | null;
  user?: {
    fullName?: string;
    email?: string;
    role?: string;
    unitId?: string | null;
    unitIds?: string[] | null;
    primaryUnit?: UnitLike | null;
    assignedUnits?: UnitLike[] | null;
  };
};

type ProfileData = {
  fullName: string;
  email: string;
  role: string;
  primaryUnit: string;
  assignedUnits: string[];
};

function getUnitName(unit: UnitLike | null | undefined): string {
  if (!unit) return "—";
  if (typeof unit === "string") return unit;
  return unit.name ?? "—";
}

function normalizeProfile(data: RawProfileResponse): ProfileData {
  const source = data.user ?? data;
  const assignedUnits =
    source.assignedUnits?.map((unit) => getUnitName(unit)).filter((name) => name !== "—") ??
    source.unitIds?.filter((unitId): unitId is string => Boolean(unitId)) ??
    [];

  return {
    fullName: source.fullName ?? "—",
    email: source.email ?? "—",
    role: source.role ?? "—",
    primaryUnit: source.unitId ?? getUnitName(source.primaryUnit),
    assignedUnits,
  };
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-background p-4">
      <div className="mt-0.5 rounded-md bg-muted p-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="break-words text-sm text-foreground">{value || "—"}</p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        setLoading(true);
        setError(null);

        const response = await authFetch("/api/users/profile", {
          method: "GET",
        });

        if (!response.ok) {
          throw new Error(`Failed to load profile (${response.status})`);
        }

        const data: RawProfileResponse = await response.json();

        if (!cancelled) {
          setProfile(normalizeProfile(data));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Something went wrong while loading your profile.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  const assignedUnitsText = useMemo(() => {
    if (!profile || profile.assignedUnits.length === 0) {
      return "No assigned units available.";
    }

    return profile.assignedUnits.join(", ");
  }, [profile]);

  let content: React.ReactNode;

  if (loading) {
    content = (
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">Loading profile...</p>
      </div>
    );
  } else if (error) {
    content = (
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  } else if (!profile) {
    content = (
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">No profile data found.</div>
        </CardContent>
      </Card>
    );
  } else {
    content = (
      <Card>
        <CardHeader>
          <CardTitle>Your Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <DetailRow icon={User2} label="Full name" value={profile.fullName} />
            <DetailRow icon={Mail} label="Email" value={profile.email} />
            <DetailRow icon={ShieldCheck} label="Role" value={profile.role} />
            <DetailRow icon={Building2} label="Primary unit" value={profile.primaryUnit} />
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users2 className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-medium">Assigned units</h2>
            </div>

            <div className="rounded-lg border bg-background p-4 text-sm text-foreground">
              {assignedUnitsText}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex h-screen w-screen overflow-hidden bg-background">
        <AppSidebar />
        <SidebarInset className="flex h-full min-w-0 flex-1 flex-col">
          <AppHeader />
          <main className="flex-1 overflow-y-auto bg-slate-50/50 p-8">
            <div className="mx-auto max-w-4xl space-y-6">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="md:hidden" />
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight">Profile</h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    View your account details and assigned units.
                  </p>
                </div>
              </div>

              {content}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
