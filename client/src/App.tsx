import { Switch, Route, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { queryClient, setApiLoadingCallback } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppSidebar } from "@/components/AppSidebar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LoadingModal } from "@/components/LoadingModal";
import Dashboard from "@/pages/Dashboard";
import Invoices from "@/pages/Invoices";
import CreateInvoice from "@/pages/CreateInvoice";
import Clients from "@/pages/Clients";
import Services from "@/pages/Services";
import Onboarding from "@/pages/Onboarding";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/invoices">
        <ProtectedRoute>
          <Invoices />
        </ProtectedRoute>
      </Route>
      <Route path="/invoices/new">
        <ProtectedRoute>
          <CreateInvoice />
        </ProtectedRoute>
      </Route>
      <Route path="/invoices/edit/:id">
        <ProtectedRoute>
          <CreateInvoice />
        </ProtectedRoute>
      </Route>
      <Route path="/clients">
        <ProtectedRoute>
          <Clients />
        </ProtectedRoute>
      </Route>
      <Route path="/services">
        <ProtectedRoute>
          <Services />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthLayout({ children, style }: { children: React.ReactNode; style: React.CSSProperties }) {
  const [location] = useLocation();
  const isAuthPage = location === '/login' || location === '/register';

  if (isAuthPage) {
    return (
      <div className="h-screen w-full">
        {children}
      </div>
    );
  }

  return (
    <SidebarProvider style={style}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center gap-2 px-4 h-14 border-b shrink-0">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  const [isApiLoading, setIsApiLoading] = useState(false);
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  // Connect loading callback to the global API tracker
  useEffect(() => {
    setApiLoadingCallback(setIsApiLoading);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <AuthLayout style={style as React.CSSProperties}>
            <Router />
          </AuthLayout>
          <Toaster />
          <LoadingModal isVisible={isApiLoading} />
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
