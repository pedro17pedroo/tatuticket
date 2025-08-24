import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/lib/auth";
import type { LoginData } from "@/lib/auth";

export default function OrganizationLoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<LoginData>({
    email: "",
    password: "",
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const user = await authService.login(formData);
      
      if (!authService.canAccessPortal('organization')) {
        toast({
          title: "Acesso negado",
          description: "Você não tem permissão para acessar o Portal das Organizações.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao Portal das Organizações",
      });
      
      // Redirect to organization portal
      window.location.href = '/organization';
      
    } catch (error: any) {
      toast({
        title: "Erro no login",
        description: error.message || "Credenciais inválidas. Tente novamente.",
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">TatuTicket</h1>
          <h2 className="mt-2 text-xl text-gray-700">Portal das Organizações</h2>
          <p className="mt-1 text-sm text-gray-600">Acesse o painel de gestão da sua empresa</p>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-building mr-2 text-primary"></i>
              Login Empresarial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="org-email">Email Corporativo</Label>
                <Input
                  id="org-email"
                  type="email"
                  placeholder="seu@empresa.com"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  required
                  data-testid="input-org-email"
                />
              </div>
              <div>
                <Label htmlFor="org-password">Senha</Label>
                <Input
                  id="org-password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  required
                  data-testid="input-org-password"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
                data-testid="button-submit-org-login"
              >
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Entrando...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sign-in-alt mr-2"></i>
                    Acessar Portal
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo Accounts */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-blue-800 mb-2">Contas de Demonstração:</h3>
            <div className="space-y-2 text-sm">
              <div>
                <strong className="text-blue-700">Empresa:</strong>
                <span className="ml-2 text-blue-600">empresa@test.com / empresa123</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="text-center">
          <Button 
            variant="ghost" 
            onClick={() => window.location.href = '/'}
            data-testid="button-back-home"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Voltar ao Início
          </Button>
        </div>
      </div>
    </div>
  );
}