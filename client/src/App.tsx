import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/app-sidebar";
import { AppHeader } from "./components/app-header";

export default function App() {
  return (
    <SidebarProvider defaultOpen={false}>
      {/* Container must be h-screen w-screen to prevent black gaps */}
      <div className="flex h-screen w-screen bg-background overflow-hidden">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 min-w-0 h-full">
          <AppHeader />
          {/* Main content area should be scrollable */}
          <main className="flex-1 overflow-y-auto p-8 bg-slate-50/50"> 
            <div className="mx-auto max-w-6xl">
              <div className="flex items-center gap-4 mb-6">
                <SidebarTrigger className="md:hidden" />
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              </div>
              
              <div className="grid gap-6 md:grid-cols-3">
                <div className="h-40 rounded-xl border-2 border-dashed bg-muted/50" />
                <div className="h-40 rounded-xl border-2 border-dashed bg-muted/50" />
                <div className="h-40 rounded-xl border-2 border-dashed bg-muted/50" />
              </div>
              <div className="mt-8 h-[500px] rounded-xl border bg-card shadow-sm" />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}