import { AppSidebar } from "../AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "../ThemeProvider";

export default function AppSidebarExample() {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>
    </ThemeProvider>
  );
}
