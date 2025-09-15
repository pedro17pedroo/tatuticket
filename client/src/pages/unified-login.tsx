import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/lib/auth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";
import { LogIn, Loader2, Shield, ArrowLeft } from "lucide-react";
import type { LoginData } from "@/lib/auth";

export default function UnifiedLoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<LoginData>({
    email: "",
    password: "",
  });
  const { toast } = useToast();
  const { t } = useLanguage();
  const [, navigate] = useLocation();

  const getRedirectPath = (user: any) => {
    // Determine the appropriate portal based on user role and permissions
    if (authService.canAccessPortal('admin')) {
      return '/admin';
    } else if (authService.canAccessPortal('organization')) {
      return '/organization';
    } else if (authService.canAccessPortal('customer')) {
      return '/customer';
    } else {
      return '/'; // Fallback to SaaS portal
    }
  };

  const getWelcomeMessage = (user: any) => {
    if (authService.canAccessPortal('admin')) {
      return t('welcome.admin_portal');
    } else if (authService.canAccessPortal('organization')) {
      return t('welcome.organization_portal');
    } else if (authService.canAccessPortal('customer')) {
      return t('welcome.customer_portal');
    } else {
      return t('welcome.saas_portal');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const user = await authService.login(formData);
      
      const welcomeMessage = getWelcomeMessage(user);
      const redirectPath = getRedirectPath(user);

      toast({
        title: t('login.success'),
        description: `${t('common.welcome')} ${welcomeMessage}`,
      });
      
      // Redirect to appropriate portal
      navigate(redirectPath);
      
    } catch (error: any) {
      toast({
        title: t('login.error'),
        description: error.message || t('login.invalid_credentials'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof LoginData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">TatuTicket</h1>
          <h2 className="mt-2 text-xl text-gray-700 dark:text-gray-300">{t('login.title')}</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t('login.subtitle')}</p>
        </div>

        {/* Login Form */}
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-center">
              <LogIn className="mr-2 h-5 w-5 text-blue-600" />
              {t('nav.login')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">{t('login.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  required
                  data-testid="input-email"
                  className="focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="password">{t('login.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  required
                  data-testid="input-password"
                  className="focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700" 
                disabled={isLoading}
                data-testid="button-submit-login"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('login.loading')}
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    {t('login.submit')}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo Accounts */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-blue-800 mb-3">{t('login.demo_accounts')}</h3>
            <div className="space-y-2 text-sm">
              <div className="bg-white/60 p-2 rounded">
                <strong className="text-red-700">Super Admin:</strong>
                <div className="text-red-600 font-mono">admin@tatuticket.com / admin123</div>
              </div>
              <div className="bg-white/60 p-2 rounded">
                <strong className="text-blue-700">Organização:</strong>
                <div className="text-blue-600 font-mono">agente@test.com / agente123</div>
              </div>
              <div className="bg-white/60 p-2 rounded">
                <strong className="text-green-700">Cliente:</strong>
                <div className="text-green-600 font-mono">cliente@test.com / cliente123</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-gray-600" />
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {t('login.security_notice')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="text-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            data-testid="button-back-home"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('login.back_home')}
          </Button>
        </div>
      </div>
    </div>
  );
}