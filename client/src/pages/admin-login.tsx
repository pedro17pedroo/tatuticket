import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/lib/auth";
import type { LoginData } from "@/lib/auth";

export default function AdminLoginPage() {
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
      
      if (!authService.canAccessPortal('admin')) {
        toast({
          title: "Acesso negado",
          description: "Você não tem permissão de super administrador.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao Portal de Administração",
      });
      
      // Redirect to admin portal
      window.location.href = '/admin';
      
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
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">TatuTicket</h1>
          <h2 className="mt-2 text-xl text-gray-700">Portal de Administração</h2>
          <p className="mt-1 text-sm text-gray-600">Acesso restrito para super administradores</p>
        </div>

        {/* Login Form */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-shield-alt mr-2 text-red-600"></i>
              Login de Administrador
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="admin-email">Email de Administrador</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@tatuticket.com"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  required
                  data-testid="input-admin-email"
                />
              </div>
              <div>
                <Label htmlFor="admin-password">Senha</Label>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  required
                  data-testid="input-admin-password"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-red-600 hover:bg-red-700" 
                disabled={isLoading}
                data-testid="button-submit-admin-login"
              >
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Entrando...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sign-in-alt mr-2"></i>
                    Acessar Administração
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo Accounts */}
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-red-800 mb-2">Conta de Demonstração:</h3>
            <div className="space-y-2 text-sm">
              <div>
                <strong className="text-red-700">Super Admin:</strong>
                <span className="ml-2 text-red-600">admin@tatuticket.com / admin123</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Warning */}
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <i className="fas fa-exclamation-triangle text-yellow-600"></i>
              <p className="text-sm text-yellow-800">
                Esta área é de acesso restrito. Todas as ações são monitoradas e registradas.
              </p>
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