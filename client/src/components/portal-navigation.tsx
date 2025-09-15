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

  // Dynamic portal configuration based on translations
  const getPortalConfig = () => [
    { id: 'saas' as PortalType, label: t('nav.saas_portal'), public: true },
    { id: 'organization' as PortalType, label: t('nav.organization_portal'), public: false },
    { id: 'customer' as PortalType, label: t('nav.customer_portal'), public: false },
    // Admin portal is hidden from navigation - only accessible via direct URL
  ];

  const availablePortals = getPortalConfig();

  return (
    <div className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo and Navigation */}
          <div className="flex items-center space-x-6">
            <div className="text-2xl font-bold text-primary flex items-center">
              <Ticket className="mr-2 h-6 w-6" />
              TatuTicket
            </div>
            <div className="hidden md:flex space-x-1">
              {availablePortals.map((portal) => (
                <Button
                  key={portal.id}
                  onClick={() => onPortalChange(portal.id)}
                  variant={currentPortal === portal.id ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "portal-btn transition-colors font-medium",
                    currentPortal === portal.id && "bg-primary text-white shadow-md"
                  )}
                  data-testid={`button-portal-${portal.id}`}
                >
                  {portal.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Right side - Controls and User */}
          <div className="flex items-center space-x-3">
            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-1"
                  data-testid="button-language-selector"
                >
                  <span className="text-lg">
                    {languageOptions.find(lang => lang.code === language)?.flag}
                  </span>
                  <span className="hidden sm:inline text-sm font-medium text-gray-700 dark:text-gray-300">
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

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="flex items-center space-x-1"
              data-testid="button-theme-toggle"
              title={theme === 'light' ? t('nav.theme_dark') : t('nav.theme_light')}
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              ) : (
                <Sun className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              )}
              <span className="hidden sm:inline text-sm font-medium text-gray-700 dark:text-gray-300">
                {theme === 'light' ? t('nav.theme_dark') : t('nav.theme_light')}
              </span>
            </Button>

            {/* User Section */}
            {user ? (
              <div className="hidden md:flex items-center space-x-3 pl-3 border-l border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2">
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
                  size="sm"
                  onClick={() => authService.logout()}
                  data-testid="button-logout"
                  className="bg-red-50 hover:bg-red-100 text-red-600 border-red-200 hover:border-red-300 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 dark:border-red-800"
                >
                  <LogOut className="mr-1 h-4 w-4" />
                  {t('nav.logout')}
                </Button>
              </div>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate('/login')}
                data-testid="button-login"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <LogIn className="mr-1 h-4 w-4" />
                {t('nav.login')}
              </Button>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              <Menu className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </Button>
          </div>
        </div>
        
        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="space-y-3 px-2">
              {/* Portal Navigation */}
              <div className="space-y-1">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2 py-1">
                  {t('nav.home')}
                </div>
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
              </div>

              {/* Language Selection */}
              <div className="space-y-1">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2 py-1">
                  {t('common.language')}
                </div>
                {languageOptions.map((lang) => (
                  <Button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    variant={language === lang.code ? "default" : "ghost"}
                    className="w-full justify-start"
                    data-testid={`button-mobile-language-${lang.code}`}
                  >
                    <span className="mr-2">{lang.flag}</span>
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
                className="w-full justify-start"
                data-testid="button-mobile-theme-toggle"
              >
                {theme === 'light' ? (
                  <Moon className="mr-2 h-4 w-4" />
                ) : (
                  <Sun className="mr-2 h-4 w-4" />
                )}
                {theme === 'light' ? t('nav.theme_dark') : t('nav.theme_light')}
              </Button>

              {/* User Actions */}
              {user ? (
                <div className="space-y-1 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="px-2 py-2 text-sm text-gray-600 dark:text-gray-400">
                    {t('nav.hello')}, <span className="font-medium text-gray-900 dark:text-gray-100">{user.username}</span>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
                    onClick={() => authService.logout()}
                    data-testid="button-mobile-logout"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('nav.logout')}
                  </Button>
                </div>
              ) : (
                <Button
                  variant="default"
                  className="w-full justify-start bg-blue-600 hover:bg-blue-700"
                  onClick={() => navigate('/login')}
                  data-testid="button-mobile-login"
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  {t('nav.login')}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
