import { ReactNode } from "react";
import { authService } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ProtectedRouteProps {
  children: ReactNode;
  portal: "organization" | "customer" | "admin";
}

export function ProtectedRoute({ children, portal }: ProtectedRouteProps) {
  const user = authService.getCurrentUser();
  const canAccess = authService.canAccessPortal(portal);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <i className="fas fa-lock text-4xl text-gray-400 mb-4"></i>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Acesso Restrito
            </h2>
            <p className="text-gray-600 mb-6">
              Você precisa estar logado para acessar esta área.
            </p>
            <Button onClick={() => window.history.pushState({}, '', `/${portal}/login`)}>
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <i className="fas fa-ban text-4xl text-red-400 mb-4"></i>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Acesso Negado
            </h2>
            <p className="text-gray-600 mb-6">
              Você não tem permissão para acessar o portal {portal === 'organization' ? 'organizacional' : portal === 'customer' ? 'do cliente' : 'administrativo'}.
            </p>
            <div className="space-y-2">
              <div className="text-sm text-gray-500">
                Usuário atual: {user.username} ({user.role})
              </div>
              <div className="text-sm text-gray-500">
                Portal requerido: {portal}
              </div>
            </div>
            <div className="mt-6">
              <Button 
                variant="outline"
                onClick={() => window.history.pushState({}, '', '/')}
              >
                Voltar ao Início
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}