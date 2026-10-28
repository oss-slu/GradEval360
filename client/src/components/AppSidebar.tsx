import { LayoutDashboard, CalendarDays, UserCircle2, ClipboardList } from "lucide-react";
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
  { label: "Profile", to: "/profile", icon: UserCircle2 },
];

const adminNavItems = [
  { label: "Audit Logs", to: "/admin/audit-logs", icon: ClipboardList },
];

export function AppSidebar() {
  const pathname = window.location.pathname;
  const { data: session } = authClient.useSession();
  const items = getUserRole(session) === "Admin" ? [...navItems, ...adminNavItems] : navItems;

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>GradEval360</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
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
