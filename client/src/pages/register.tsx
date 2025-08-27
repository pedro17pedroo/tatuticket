import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { OnboardingWizard } from "@/components/saas/onboarding-wizard";
import { ArrowLeft } from "lucide-react";

export function RegisterPage() {
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string>("pro");
  const { toast } = useToast();

  const handleOnboardingComplete = (data: any) => {
    console.log('Onboarding completed:', data);
    toast({
      title: "Conta criada com sucesso!",
      description: "Bem-vindo ao TatuTicket! Sua organização foi configurada.",
    });
    // Redirect to organization portal after successful registration
    window.location.href = '/organization';
  };

  const handleBackToHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={handleBackToHome}
                className="mr-4"
                data-testid="button-back-home"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Início
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">T</span>
                </div>
                <span className="text-xl font-bold text-gray-900">TatuTicket</span>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Já tem uma conta? 
              <Button variant="link" className="p-0 ml-1 h-auto" data-testid="link-login">
                Fazer Login
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Crie sua Conta TatuTicket
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Configure sua organização em poucos passos e comece a revolucionar seu atendimento ao cliente
          </p>
        </div>

        {/* Benefits Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-rocket text-xl"></i>
              </div>
              <h3 className="text-lg font-semibold mb-2">Configuração Rápida</h3>
              <p className="text-gray-600">Configure sua organização em menos de 5 minutos</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-shield-alt text-xl"></i>
              </div>
              <h3 className="text-lg font-semibold mb-2">100% Seguro</h3>
              <p className="text-gray-600">Seus dados protegidos com criptografia AES-256</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-headset text-xl"></i>
              </div>
              <h3 className="text-lg font-semibold mb-2">Suporte 24/7</h3>
              <p className="text-gray-600">Nossa equipe está sempre disponível para ajudar</p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Onboarding Wizard - Always open on this page */}
      <OnboardingWizard
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        initialPlan={selectedPlan}
        onComplete={handleOnboardingComplete}
      />
    </div>
  );
}