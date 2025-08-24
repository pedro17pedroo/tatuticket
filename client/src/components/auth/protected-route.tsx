import { authService } from "@/lib/auth";
import type { PortalType } from "@/types/portal";

interface ProtectedRouteProps {
  portal: PortalType;
  children: React.ReactNode;
}

export function ProtectedRoute({ portal, children }: ProtectedRouteProps) {
  const canAccess = authService.canAccessPortal(portal);

  if (!canAccess) {
    // Redirect to appropriate login page
    const loginRoutes = {
      'organization': '/organization/login',
      'customer': '/customer/login',
      'admin': '/admin/login',
      'saas': '/'
    };
    
    window.location.href = loginRoutes[portal];
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecionando para o login...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
