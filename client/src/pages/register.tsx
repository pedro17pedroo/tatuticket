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