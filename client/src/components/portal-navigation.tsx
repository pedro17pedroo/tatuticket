import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PortalType } from "@/types/portal";
import { authService } from "@/lib/auth";

interface PortalNavigationProps {
  currentPortal: PortalType;
  onPortalChange: (portal: PortalType) => void;
}

const portalConfig = [
  { id: 'saas' as PortalType, label: 'Portal SaaS', public: true },
  { id: 'organization' as PortalType, label: 'Portal das Organizações', public: false },
  { id: 'customer' as PortalType, label: 'Portal dos Clientes', public: false },
  // Admin portal is hidden from navigation - only accessible via direct URL
];

export function PortalNavigation({ currentPortal, onPortalChange }: PortalNavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const user = authService.getCurrentUser();

  const availablePortals = portalConfig; // Show main portals, admin hidden for security

  return (
    <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="text-2xl font-bold text-primary">TatuTicket</div>
            <div className="hidden md:flex space-x-2">
              {availablePortals.map((portal) => (
                <Button
                  key={portal.id}
                  onClick={() => onPortalChange(portal.id)}
                  variant={currentPortal === portal.id ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "portal-btn transition-colors",
                    currentPortal === portal.id && "bg-primary text-white"
                  )}
                  data-testid={`button-portal-${portal.id}`}
                >
                  {portal.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {user && (
              <div className="hidden md:flex items-center space-x-2">
                <div className="text-sm text-gray-600">
                  Olá, <span className="font-medium">{user.username}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => authService.logout()}
                  data-testid="button-logout"
                >
                  Sair
                </Button>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              <i className="fas fa-bars text-gray-600"></i>
            </Button>
          </div>
        </div>
        
        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="space-y-2">
              {availablePortals.map((portal) => (
                <Button
                  key={portal.id}
                  onClick={() => {
                    onPortalChange(portal.id);
                    setIsMobileMenuOpen(false);
                  }}
                  variant={currentPortal === portal.id ? "default" : "ghost"}
                  className="w-full justify-start"
                  data-testid={`button-mobile-portal-${portal.id}`}
                >
                  {portal.label}
                </Button>
              ))}
              {user && (
                <Button
                  variant="outline"
                  className="w-full justify-start mt-4"
                  onClick={() => authService.logout()}
                  data-testid="button-mobile-logout"
                >
                  Sair
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
