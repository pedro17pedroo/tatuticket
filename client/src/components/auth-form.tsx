import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AuthFormProps {
  onLogin: (user: any) => void;
  title?: string;
  subtitle?: string;
}

export function AuthForm({ onLogin, title = "Login", subtitle = "Entre com suas credenciais" }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Fetch demo credentials for easy testing
  const { data: demoCredentials } = useQuery({
    queryKey: ['/api/auth/demo-credentials'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  type DemoCredentials = {
    superAdmin: { email: string; password: string; role: string };
    empresa: { email: string; password: string; role: string };
    cliente: { email: string; password: string; role: string };
    agent: { email: string; password: string; role: string };
    manager: { email: string; password: string; role: string };
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Erro",
        description: "Email e senha são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      toast({
        title: "Login realizado com sucesso!",
        description: `Bem-vindo(a), ${data.user.username}`,
      });

      onLogin(data.user);
    } catch (error: any) {
      toast({
        title: "Erro no login",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (credentials: { email: string; password: string; role: string }) => {
    setEmail(credentials.email);
    setPassword(credentials.password);
    
    // Auto-submit after setting credentials
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) {
        form.requestSubmit();
      }
    }, 100);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <div className="w-full max-w-md space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">{title}</CardTitle>
            <p className="text-muted-foreground">{subtitle}</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="input-email"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    data-testid="input-password"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
                data-testid="button-login"
              >
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo Credentials */}
        {demoCredentials && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🧪 Credenciais de Demonstração</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Use estas credenciais para testar os diferentes portais do sistema.
                </AlertDescription>
              </Alert>
              
              <div className="grid gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDemoLogin((demoCredentials as DemoCredentials).superAdmin)}
                  data-testid="button-demo-superadmin"
                  className="justify-start"
                >
                  <span className="font-semibold">Super Admin:</span>&nbsp;
                  {(demoCredentials as DemoCredentials).superAdmin.email}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDemoLogin((demoCredentials as DemoCredentials).empresa)}
                  data-testid="button-demo-empresa"
                  className="justify-start"
                >
                  <span className="font-semibold">Empresa:</span>&nbsp;
                  {(demoCredentials as DemoCredentials).empresa.email}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDemoLogin((demoCredentials as DemoCredentials).cliente)}
                  data-testid="button-demo-cliente"
                  className="justify-start"
                >
                  <span className="font-semibold">Cliente:</span>&nbsp;
                  {(demoCredentials as DemoCredentials).cliente.email}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDemoLogin((demoCredentials as DemoCredentials).agent)}
                  data-testid="button-demo-agent"
                  className="justify-start"
                >
                  <span className="font-semibold">Agente:</span>&nbsp;
                  {(demoCredentials as DemoCredentials).agent.email}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDemoLogin((demoCredentials as DemoCredentials).manager)}
                  data-testid="button-demo-manager"
                  className="justify-start"
                >
                  <span className="font-semibold">Gerente:</span>&nbsp;
                  {(demoCredentials as DemoCredentials).manager.email}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}