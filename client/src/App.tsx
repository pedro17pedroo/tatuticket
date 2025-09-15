import { Switch, Route, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { PortalNavigation } from "@/components/portal-navigation";
import UnifiedLoginPage from "@/pages/unified-login";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { SaasPortal } from "@/pages/saas-portal";
import { OrganizationPortal } from "@/pages/organization-portal";
import { CustomerPortal } from "@/pages/customer-portal";
import { AdminPortal } from "@/pages/admin-portal";
import { RegisterPage } from "@/pages/register";
import NotFound from "@/pages/not-found";
import { authService } from "@/lib/auth";
import { usePWA } from "@/hooks/use-pwa";
import type { PortalType } from "@/types/portal";

function Router() {
  const [location, navigate] = useLocation();
  const [currentPortal, setCurrentPortal] = useState<PortalType>('saas');
  
  // Initialize PWA
  usePWA();

  // Determine current portal from URL
  useEffect(() => {
    if (location.startsWith('/organization')) {
      setCurrentPortal('organization');
    } else if (location.startsWith('/customer')) {
      setCurrentPortal('customer');
    } else if (location.startsWith('/admin')) {
      setCurrentPortal('admin');
    } else {
      setCurrentPortal('saas');
    }
  }, [location]);

  const handlePortalChange = (portal: PortalType) => {
    if (portal === 'saas') {
      navigate('/');
      setCurrentPortal(portal);
      return;
    }
    
    if (!authService.canAccessPortal(portal)) {
      // Redirect to unified login page
      navigate('/login');
      return;
    }
    
    const routes = {
      'organization': '/organization',
      'customer': '/customer',
      'admin': '/admin'
    };
    
    navigate(routes[portal as keyof typeof routes]);
    setCurrentPortal(portal);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Only show navigation on non-register pages */}
      {!location.startsWith('/register') && (
        <PortalNavigation 
          currentPortal={currentPortal} 
          onPortalChange={handlePortalChange} 
        />
      )}
      
      <Switch>
        <Route path="/" component={SaasPortal} />
        <Route path="/login" component={UnifiedLoginPage} />
        <Route path="/register" component={RegisterPage} />
        
        {/* Organization Portal Routes */}
        <Route path="/organization">
          <ProtectedRoute portal="organization">
            <OrganizationPortal />
          </ProtectedRoute>
        </Route>
        
        {/* Customer Portal Routes */}
        <Route path="/customer">
          <ProtectedRoute portal="customer">
            <CustomerPortal />
          </ProtectedRoute>
        </Route>
        
        {/* Admin Portal Routes */}
        <Route path="/admin">
          <ProtectedRoute portal="admin">
            <AdminPortal />
          </ProtectedRoute>
        </Route>
        
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
