import { Link, useLocation } from "wouter";
import { LayoutDashboard, FileText, Users, Box, Receipt, Moon, Sun, LogOut, Settings } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "@/components/LanguageSelector";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useTheme } from "./ThemeProvider";

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Invoices",
    url: "/invoices",
    icon: FileText,
  },
  {
    title: "Expenses",
    url: "/expenses",
    icon: Receipt,
  },
  {
    title: "Clients",
    url: "/clients",
    icon: Users,
  },
  {
    title: "Services",
    url: "/services",
    icon: Box,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const { t } = useTranslation();
  const [location] = useLocation();
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();

  // Fetch current user
  const { data: userData } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/auth/me");
      return res.json();
    },
  });

  const handleLogout = async () => {
    try {
      console.log('[Logout] Starting logout');
      await apiRequest("POST", "/api/auth/logout");
      console.log('[Logout] Logout successful, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      console.log('[Logout] Redirecting to /login');
      setLocation("/login");
    } catch (error) {
      console.error('[Logout] Logout failed:', error);
    }
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg">InvoiceHub</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("nav.navigation")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={`link-${item.title.toLowerCase()}`}>
                      <item.icon className="w-4 h-4" />
                      <span>{t(`nav.${item.title.toLowerCase()}`)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 space-y-2">
        <LanguageSelector />
        {userData?.email && (
          <div className="px-2 py-2 text-sm border rounded-lg">
            <div className="font-medium truncate">{userData.email}</div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          data-testid="button-theme-toggle"
          className="w-full justify-start"
        >
          {theme === "light" ? (
            <>
              <Moon className="w-4 h-4" />
              <span>{t("nav.darkMode")}</span>
            </>
          ) : (
            <>
              <Sun className="w-4 h-4" />
              <span>{t("nav.lightMode")}</span>
            </>
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="w-full justify-start text-destructive"
        >
          <LogOut className="w-4 h-4" />
          <span>{t("common.logout")}</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
