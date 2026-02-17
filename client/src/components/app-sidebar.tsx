import { LayoutDashboard, CalendarDays } from "lucide-react"; // Import icons
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
];

export function AppSidebar() {
  const pathname = window.location.pathname;

  return (
    <Sidebar collapsible="icon"> {/* Enables the "Icon Rail" mode when collapsed */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>GradEval360</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname.startsWith(item.to);
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                      <a href={item.to}>
                        <item.icon className="h-4 w-4" /> {/* Icon is now visible */}
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