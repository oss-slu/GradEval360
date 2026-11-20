import { LayoutDashboard, CalendarDays, UserCircle2, ClipboardList, BarChart3, Users } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { getUserRole } from "@/lib/auth-client.logic";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navItems = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "My Appointments", to: "/appointments", icon: CalendarDays },
  { label: "Visualizations", to: "/visualizations", icon: BarChart3 },
  { label: "Profile", to: "/profile", icon: UserCircle2 },
];

const adminNavItems = [
  { label: "GA Roster", to: "/admin/ga-roster", icon: Users },
  { label: "Audit Logs", to: "/admin/audit-logs", icon: ClipboardList },
];

export function AppSidebar() {
  const pathname = window.location.pathname;
  const { data: session } = authClient.useSession();
  const userRole = getUserRole(session);

  const items =
    userRole === "Admin"
      ? [...navItems, ...adminNavItems]
      : navItems;

  const visibleNavItems = items.filter((item) => {
    if (item.to === "/visualizations") {
      return userRole === "Admin";
    }

    return true;
  });

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>GradEval360</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleNavItems.map((item) => {
                const isActive = pathname.startsWith(item.to);
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                      <a href={item.to}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export default AppSidebar;
