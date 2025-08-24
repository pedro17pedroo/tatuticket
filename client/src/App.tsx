import { Switch, Route, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PortalNavigation } from "@/components/portal-navigation";
import { ProgressTracker } from "@/components/progress-tracker";
import { LoginForm } from "@/components/auth/login-form";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { SaasPortal } from "@/pages/saas-portal";
import { OrganizationPortal } from "@/pages/organization-portal";
import { CustomerPortal } from "@/pages/customer-portal";
import { AdminPortal } from "@/pages/admin-portal";
import NotFound from "@/pages/not-found";
import { authService } from "@/lib/auth";
import type { PortalType } from "@/types/portal";

const progressData = {
  'saas': { status: 'Portal SaaS Ativo', percentage: 75 },
  'organization': { status: 'Portal Empresas Ativo', percentage: 60 },
  'customer': { status: 'Portal Clientes Ativo', percentage: 65 },
  'admin': { status: 'Portal Admin Ativo', percentage: 70 }
};

function Router() {
  const [location] = useLocation();
  const [currentPortal, setCurrentPortal] = useState<PortalType>('saas');
  const [showLogin, setShowLogin] = useState(false);
  const user = authService.getCurrentUser();

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
    if (!authService.canAccessPortal(portal) && portal !== 'saas') {
      setShowLogin(true);
      return;
    }
    
    const routes = {
      'saas': '/',
      'organization': '/organization',
      'customer': '/customer',
      'admin': '/admin'
    };
    
    window.history.pushState({}, '', routes[portal]);
    setCurrentPortal(portal);
  };

  return (
    <div className="min-h-screen bg-background">
      <PortalNavigation 
        currentPortal={currentPortal} 
        onPortalChange={handlePortalChange} 
      />
      <ProgressTracker 
        currentPortal={currentPortal} 
        progress={progressData[currentPortal]} 
      />
      
      <Switch>
        <Route path="/" component={SaasPortal} />
        
        <Route path="/organization">
          <ProtectedRoute 
            portal="organization" 
            onLoginRequired={() => setShowLogin(true)}
          >
            <OrganizationPortal />
          </ProtectedRoute>
        </Route>
        
        <Route path="/customer">
          <ProtectedRoute 
            portal="customer" 
            onLoginRequired={() => setShowLogin(true)}
          >
            <CustomerPortal />
          </ProtectedRoute>
        </Route>
        
        <Route path="/admin">
          <ProtectedRoute 
            portal="admin" 
            onLoginRequired={() => setShowLogin(true)}
          >
            <AdminPortal />
          </ProtectedRoute>
        </Route>
        
        <Route component={NotFound} />
      </Switch>

      {showLogin && (
        <LoginForm 
          isOpen={showLogin} 
          onClose={() => setShowLogin(false)}
          onSuccess={() => {
            setShowLogin(false);
            // Refresh to update portal access
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
