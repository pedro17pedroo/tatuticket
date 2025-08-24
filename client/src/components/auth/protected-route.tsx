import { authService } from "@/lib/auth";
import type { PortalType } from "@/types/portal";

interface ProtectedRouteProps {
  portal: PortalType;
  children: React.ReactNode;
  onLoginRequired: () => void;
}

export function ProtectedRoute({ portal, children, onLoginRequired }: ProtectedRouteProps) {
  const canAccess = authService.canAccessPortal(portal);

  if (!canAccess) {
    onLoginRequired();
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
