import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { PortalType } from "@/types/portal";
import { authService } from "@/lib/auth";
import { useLanguage, type Language } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocation } from "wouter";
import { Ticket, ChevronDown, Check, Moon, Sun, LogOut, LogIn, Menu } from "lucide-react";

interface PortalNavigationProps {
  currentPortal: PortalType;
  onPortalChange: (portal: PortalType) => void;
}

// Language options
const languageOptions = [
  { code: 'pt' as Language, label: 'Português', flag: '🇵🇹' },
  { code: 'en' as Language, label: 'English', flag: '🇺🇸' },
  { code: 'es' as Language, label: 'Español', flag: '🇪🇸' },
];

export function PortalNavigation({ currentPortal, onPortalChange }: PortalNavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const user = authService.getCurrentUser();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [, navigate] = useLocation();

  // Dynamic portal configuration based on translations and user access
  const getPortalConfig = () => {
    const portals = [
      { id: 'saas' as PortalType, label: t('nav.saas_portal'), public: true }
    ];

    // Only show other portals if user is logged in and has access
    if (user) {
      if (authService.canAccessPortal('organization')) {
        portals.push({ id: 'organization' as PortalType, label: t('nav.organization_portal'), public: false });
      }
      if (authService.canAccessPortal('customer')) {
        portals.push({ id: 'customer' as PortalType, label: t('nav.customer_portal'), public: false });
      }
    }

    return portals;
  };

  const availablePortals = getPortalConfig();

  return (
    <div className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Left side - Logo and Navigation */}
          <div className="flex items-center space-x-3 sm:space-x-6">
            <div className="text-xl sm:text-2xl font-bold text-primary flex items-center flex-shrink-0">
              <Ticket className="mr-1 sm:mr-2 h-5 w-5 sm:h-6 sm:w-6" />
              <span className="hidden sm:inline">TatuTicket</span>
              <span className="sm:hidden">TT</span>
            </div>
            {/* Show portal navigation only if there are multiple portals or user has access */}
            {availablePortals.length > 1 && (
              <div className="hidden lg:flex space-x-1">
                {availablePortals.map((portal) => (
                  <Button
                    key={portal.id}
                    onClick={() => onPortalChange(portal.id)}
                    variant={currentPortal === portal.id ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "portal-btn transition-colors font-medium text-xs sm:text-sm px-2 sm:px-3",
                      currentPortal === portal.id && "bg-primary text-white shadow-md"
                    )}
                    data-testid={`button-portal-${portal.id}`}
                  >
                    {portal.label}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Right side - Controls and User */}
          <div className="flex items-center space-x-1 sm:space-x-3">
            {/* Language Selector - Hidden on smallest screens */}
            <div className="hidden sm:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center space-x-1 px-2"
                    data-testid="button-language-selector"
                  >
                    <span className="text-base sm:text-lg">
                      {languageOptions.find(lang => lang.code === language)?.flag}
                    </span>
                    <span className="hidden lg:inline text-sm font-medium text-gray-700 dark:text-gray-300">
                      {languageOptions.find(lang => lang.code === language)?.label}
                    </span>
                    <ChevronDown className="h-3 w-3 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  {languageOptions.map((lang) => (
                    <DropdownMenuItem
                      key={lang.code}
                      onClick={() => setLanguage(lang.code)}
                      className={cn(
                        "flex items-center space-x-2 cursor-pointer",
                        language === lang.code && "bg-blue-50 dark:bg-blue-900"
                      )}
                      data-testid={`option-language-${lang.code}`}
                    >
                      <span className="text-lg">{lang.flag}</span>
                      <span className="font-medium">{lang.label}</span>
                      {language === lang.code && (
                        <Check className="h-4 w-4 text-blue-600 ml-auto" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="flex items-center px-2"
              data-testid="button-theme-toggle"
              title={theme === 'light' ? t('nav.theme_dark') : t('nav.theme_light')}
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              ) : (
                <Sun className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              )}
              <span className="hidden lg:inline text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">
                {theme === 'light' ? t('nav.theme_dark') : t('nav.theme_light')}
              </span>
            </Button>

            {/* User Section */}
            {user ? (
              <div className="hidden lg:flex items-center space-x-2 pl-2 sm:pl-3 border-l border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold uppercase">
                      {user.username.charAt(0)}
                    </span>
                  </div>
                  <div className="text-sm hidden xl:block">
                    <div className="text-gray-600 dark:text-gray-400 text-xs">{t('nav.hello')},</div>
                    <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">{user.username}</div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => authService.logout()}
                  data-testid="button-logout"
                  className="bg-red-50 hover:bg-red-100 text-red-600 border-red-200 hover:border-red-300 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 dark:border-red-800 px-2 sm:px-3"
                >
                  <LogOut className="mr-0 sm:mr-1 h-4 w-4" />
                  <span className="hidden sm:inline">{t('nav.logout')}</span>
                </Button>
              </div>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate('/login')}
                data-testid="button-login"
                className="bg-blue-600 hover:bg-blue-700 text-white px-2 sm:px-3"
              >
                <LogIn className="mr-0 sm:mr-1 h-4 w-4" />
                <span className="hidden sm:inline">{t('nav.login')}</span>
              </Button>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden ml-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              <Menu className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </Button>
          </div>
        </div>
        
        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="space-y-4 px-3">
              {/* Portal Navigation - Only show if there are multiple portals */}
              {availablePortals.length > 1 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2 py-1">
                    {t('nav.home')}
                  </div>
                  <div className="space-y-1">
                    {availablePortals.map((portal) => (
                      <Button
                        key={portal.id}
                        onClick={() => {
                          onPortalChange(portal.id);
                          setIsMobileMenuOpen(false);
                        }}
                        variant={currentPortal === portal.id ? "default" : "ghost"}
                        className="w-full justify-start text-sm"
                        data-testid={`button-mobile-portal-${portal.id}`}
                      >
                        {portal.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Settings Section */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2 py-1">
                  {t('common.settings')}
                </div>
                
                {/* Language Selection */}
                <div className="space-y-1">
                  {languageOptions.map((lang) => (
                    <Button
                      key={lang.code}
                      onClick={() => setLanguage(lang.code)}
                      variant={language === lang.code ? "default" : "ghost"}
                      className="w-full justify-start text-sm"
                      data-testid={`button-mobile-language-${lang.code}`}
                    >
                      <span className="mr-2 text-base">{lang.flag}</span>
                      {lang.label}
                      {language === lang.code && (
                        <Check className="ml-auto h-4 w-4" />
                      )}
                    </Button>
                  ))}
                </div>

                {/* Theme Toggle */}
                <Button
                  onClick={toggleTheme}
                  variant="ghost"
                  className="w-full justify-start text-sm"
                  data-testid="button-mobile-theme-toggle"
                >
                  {theme === 'light' ? (
                    <Moon className="mr-2 h-4 w-4" />
                  ) : (
                    <Sun className="mr-2 h-4 w-4" />
                  )}
                  {theme === 'light' ? t('nav.theme_dark') : t('nav.theme_light')}
                </Button>
              </div>

              {/* User Actions */}
              {user ? (
                <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3 px-2 py-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold uppercase">
                        {user.username.charAt(0)}
                      </span>
                    </div>
                    <div className="text-sm">
                      <div className="text-gray-600 dark:text-gray-400">{t('nav.hello')},</div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">{user.username}</div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20 text-sm"
                    onClick={() => {
                      authService.logout();
                      setIsMobileMenuOpen(false);
                    }}
                    data-testid="button-mobile-logout"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('nav.logout')}
                  </Button>
                </div>
              ) : (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="default"
                    className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-sm"
                    onClick={() => {
                      navigate('/login');
                      setIsMobileMenuOpen(false);
                    }}
                    data-testid="button-mobile-login"
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    {t('nav.login')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
