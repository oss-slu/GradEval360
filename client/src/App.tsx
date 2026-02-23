// client/src/App.tsx
import "./App.css";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";

function App() {
  return (
    <SidebarProvider>

      
      <div className="flex min-h-screen w-full">
        <AppSidebar />

        <div className="flex w-full flex-col">
          <AppHeader />

          <main className="flex-1 p-4">
            * Placeholder until real pages/routes exist *
            <h1 className="text-xl font-semibold">Dashboard</h1>
            <p className="text-muted-foreground">
              //This is the app shell. Pages can be empty for now.
            </p>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default App;

