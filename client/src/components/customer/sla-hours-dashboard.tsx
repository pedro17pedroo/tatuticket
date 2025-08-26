import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { authService } from "@/lib/auth";

interface HoursBalance {
  id: string;
  customerId: string;
  totalHours: number;
  usedHours: number;
  remainingHours: number;
  expirationDate?: string;
  isActive: boolean;
}

interface SLAStatus {
  ticketId: string;
  ticketNumber: string;
  subject: string;
  slaName: string;
  deadline: string;
  remainingTime: number; // minutes
  status: "on_time" | "warning" | "critical" | "breached";
  progress: number; // percentage
}

export function SLAHoursDashboard() {
  const user = authService.getCurrentUser();
  const customerId = user?.customerId;

  // Fetch hours balance
  const { data: hoursBalance } = useQuery({
    queryKey: ['/api/customers/hours-balance', customerId],
    enabled: !!customerId,
  });

  // Fetch active SLA status
  const { data: slaStatus = [] } = useQuery({
    queryKey: ['/api/customers/sla-status', customerId],
    enabled: !!customerId,
  });

  // Fetch hours usage history
  const { data: hoursUsage = [] } = useQuery({
    queryKey: ['/api/customers/hours-usage', customerId],
    enabled: !!customerId,
  });

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours}h`;
    return `${hours}h ${remainingMinutes}min`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSLAStatusColor = (status: string) => {
    switch (status) {
      case 'on_time': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-orange-100 text-orange-800';
      case 'breached': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSLAStatusLabel = (status: string) => {
    switch (status) {
      case 'on_time': return 'No Prazo';
      case 'warning': return 'Atenção';
      case 'critical': return 'Crítico';
      case 'breached': return 'Violado';
      default: return status;
    }
  };

  const getSLAProgressColor = (status: string) => {
    switch (status) {
      case 'on_time': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-orange-500';
      case 'breached': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const calculateUsagePercentage = (balance: HoursBalance) => {
    if (!balance || balance.totalHours === 0) return 0;
    return (balance.usedHours / balance.totalHours) * 100;
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-orange-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-6">
      {/* Hours Balance Overview */}
      {hoursBalance && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Horas Totais</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {hoursBalance.totalHours}h
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <i className="fas fa-clock text-blue-600"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Horas Utilizadas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {hoursBalance.usedHours}h
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <i className="fas fa-hourglass-half text-orange-600"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Horas Restantes</p>
                  <p className={`text-2xl font-bold ${getUsageColor(calculateUsagePercentage(hoursBalance))}`}>
                    {hoursBalance.remainingHours}h
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <i className="fas fa-battery-three-quarters text-green-600"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <Badge className={hoursBalance.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {hoursBalance.isActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                  {hoursBalance.expirationDate && (
                    <p className="text-xs text-gray-500 mt-1">
                      Vence em {formatDate(hoursBalance.expirationDate)}
                    </p>
                  )}
                </div>
                <div className={`p-3 rounded-full ${hoursBalance.isActive ? 'bg-green-100' : 'bg-red-100'}`}>
                  <i className={`fas ${hoursBalance.isActive ? 'fa-check-circle' : 'fa-times-circle'} ${hoursBalance.isActive ? 'text-green-600' : 'text-red-600'}`}></i>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Usage Progress */}
      {hoursBalance && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-chart-line mr-2"></i>
              Consumo da Bolsa de Horas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Progresso do Uso
                </span>
                <span className={`text-sm font-bold ${getUsageColor(calculateUsagePercentage(hoursBalance))}`}>
                  {calculateUsagePercentage(hoursBalance).toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={calculateUsagePercentage(hoursBalance)} 
                className="h-3"
                data-testid="hours-progress"
              />
              <div className="flex justify-between text-sm text-gray-600">
                <span>{hoursBalance.usedHours}h utilizadas</span>
                <span>{hoursBalance.totalHours}h disponíveis</span>
              </div>
              
              {calculateUsagePercentage(hoursBalance) >= 75 && (
                <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center">
                    <i className="fas fa-exclamation-triangle text-orange-600 mr-2"></i>
                    <span className="text-sm font-medium text-orange-800">
                      Atenção: Você está próximo do limite da sua bolsa de horas
                    </span>
                  </div>
                  {calculateUsagePercentage(hoursBalance) >= 90 && (
                    <div className="mt-2">
                      <Button size="sm" data-testid="button-recharge-hours">
                        <i className="fas fa-plus mr-2"></i>
                        Recarregar Bolsa
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active SLA Timers */}
      {slaStatus.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-stopwatch mr-2"></i>
              SLAs Ativos ({slaStatus.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {slaStatus.map((sla: SLAStatus) => (
                <Card key={sla.ticketId} className="bg-gray-50" data-testid={`sla-timer-${sla.ticketNumber}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          Ticket #{sla.ticketNumber}
                        </h4>
                        <p className="text-sm text-gray-600">{sla.subject}</p>
                        <p className="text-xs text-gray-500 mt-1">SLA: {sla.slaName}</p>
                      </div>
                      <div className="text-right">
                        <Badge className={getSLAStatusColor(sla.status)}>
                          {getSLAStatusLabel(sla.status)}
                        </Badge>
                        <p className="text-sm font-medium text-gray-900 mt-1">
                          {formatTime(sla.remainingTime)}
                        </p>
                        <p className="text-xs text-gray-500">
                          até {formatDate(sla.deadline)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Progresso do SLA</span>
                        <span className="font-medium">{sla.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${getSLAProgressColor(sla.status)}`}
                          style={{ width: `${sla.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Hours Usage */}
      {hoursUsage.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-history mr-2"></i>
              Histórico de Uso Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {hoursUsage.slice(0, 10).map((usage: any, index: number) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <i className="fas fa-ticket-alt text-blue-600 text-xs"></i>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Ticket #{usage.ticketNumber}</p>
                      <p className="text-sm text-gray-600">{usage.description}</p>
                      <p className="text-xs text-gray-500">{formatDate(usage.date)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{usage.hoursUsed}h</p>
                    <p className="text-sm text-gray-600">R$ {usage.cost}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {hoursUsage.length > 10 && (
              <div className="mt-4 text-center">
                <Button variant="outline" size="sm" data-testid="button-view-all-usage">
                  Ver Todo Histórico
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card className="bg-blue-50">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <i className="fas fa-question-circle text-blue-600"></i>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-2">
                Como Funciona a Bolsa de Horas?
              </h3>
              <div className="text-sm text-blue-700 space-y-2">
                <p>
                  • <strong>SLA-Based:</strong> Custos fixos baseados em tempo de resposta
                </p>
                <p>
                  • <strong>Bolsa de Horas:</strong> Pagamento por uso real de tempo
                </p>
                <p>
                  • <strong>Modelo Híbrido:</strong> Combinação de base fixa + consumo adicional
                </p>
              </div>
              <div className="mt-4">
                <Button variant="outline" size="sm" data-testid="button-learn-more">
                  <i className="fas fa-info-circle mr-2"></i>
                  Saiba Mais
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}