import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, DollarSign, AlertTriangle, TrendingUp } from "lucide-react";
import { authService } from "@/lib/auth";

interface SlaInfo {
  ticketId: string;
  ticketNumber: string;
  priority: string;
  timeRemaining: number; // hours
  totalTime: number; // hours
  status: string;
}

interface HoursBankInfo {
  available: number;
  used: number;
  total: number;
  monthlyUsage: number;
}

export function SlaHoursDashboard() {
  const user = authService.getCurrentUser();
  const tenantId = authService.getTenantId();

  // Fetch real SLA data for user's tickets
  const { data: userTickets } = useQuery({
    queryKey: ['/api/tickets', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/tickets?customerId=${user?.id}`);
      if (!response.ok) throw new Error('Erro ao carregar tickets');
      return response.json();
    },
    enabled: !!user?.id,
  });

  // Calculate SLA status from real tickets
  const activeSlas: SlaInfo[] = userTickets ? userTickets
    .filter((ticket: any) => ticket.status === 'open' || ticket.status === 'in_progress')
    .map((ticket: any) => {
      const createdAt = new Date(ticket.createdAt);
      const now = new Date();
      const hoursElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      
      // Default SLA times by priority
      const slaTimeMap: Record<string, number> = {
        critical: 4,
        high: 8, 
        medium: 24,
        low: 72
      };
      const slaHours = slaTimeMap[ticket.priority] || 24;
      
      const timeRemaining = Math.max(0, slaHours - hoursElapsed);
      
      return {
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        priority: ticket.priority,
        timeRemaining,
        totalTime: slaHours,
        status: ticket.status
      };
    }) : [];

  // Mock hours bank data - in real implementation, fetch from customer API
  const hoursBankInfo: HoursBankInfo = {
    available: 42.5,
    used: 7.5,
    total: 50,
    monthlyUsage: 7.5
  };

  const getSlaUrgency = (timeRemaining: number, totalTime: number) => {
    const percentage = (timeRemaining / totalTime) * 100;
    if (percentage <= 10) return { level: 'critical', color: 'text-red-600', bgColor: 'bg-red-100' };
    if (percentage <= 25) return { level: 'warning', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { level: 'normal', color: 'text-green-600', bgColor: 'bg-green-100' };
  };

  const formatTimeRemaining = (hours: number) => {
    if (hours < 1) {
      const minutes = Math.floor(hours * 60);
      return `${minutes}min`;
    }
    return `${Math.floor(hours)}h ${Math.floor((hours % 1) * 60)}min`;
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* SLA Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-primary" />
            <span>Status dos SLAs</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeSlas.length > 0 ? (
            activeSlas.map((sla) => {
              const urgency = getSlaUrgency(sla.timeRemaining, sla.totalTime);
              const percentage = (sla.timeRemaining / sla.totalTime) * 100;
              
              return (
                <div key={sla.ticketId} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm">{sla.ticketNumber}</span>
                      <Badge 
                        variant={sla.priority === 'critical' ? 'destructive' : 'outline'}
                        className="text-xs"
                      >
                        {sla.priority}
                      </Badge>
                    </div>
                    <span className={`text-sm font-medium ${urgency.color}`}>
                      {formatTimeRemaining(sla.timeRemaining)} restantes
                    </span>
                  </div>
                  <Progress 
                    value={percentage} 
                    className={`h-2 ${urgency.level === 'critical' ? 'bg-red-100' : urgency.level === 'warning' ? 'bg-yellow-100' : 'bg-green-100'}`}
                  />
                  {urgency.level === 'critical' && (
                    <div className="flex items-center space-x-1 text-xs text-red-600">
                      <AlertTriangle className="h-3 w-3" />
                      <span>SLA em risco!</span>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-6">
              <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Nenhum ticket ativo no momento</p>
              <p className="text-sm text-gray-400">Seus SLAs aparecerão aqui quando houver tickets em andamento</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hours Bank */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <span>Bolsa de Horas</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Balance */}
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Saldo Disponível</span>
            <span className="text-2xl font-bold text-primary" data-testid="text-available-hours">
              {hoursBankInfo.available}h
            </span>
          </div>
          
          {/* Usage This Month */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Usado este Mês</span>
              <span className="text-lg font-semibold text-gray-900" data-testid="text-used-hours">
                {hoursBankInfo.monthlyUsage}h
              </span>
            </div>
            <Progress 
              value={(hoursBankInfo.monthlyUsage / hoursBankInfo.total) * 100} 
              className="h-3" 
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0h</span>
              <span>{hoursBankInfo.total}h (limite mensal)</span>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Utilizado:</span>
              <span className="font-medium">{hoursBankInfo.used}h</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Economia estimada:</span>
              <span className="font-medium text-green-600">
                R$ {((hoursBankInfo.total - hoursBankInfo.used) * 150).toLocaleString('pt-BR')}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Button className="w-full" data-testid="button-reload-hours">
              <TrendingUp className="h-4 w-4 mr-2" />
              Recarregar Bolsa
            </Button>
            <Button variant="outline" className="w-full" data-testid="button-view-history">
              Ver Histórico de Uso
            </Button>
          </div>

          {/* Low balance warning */}
          {hoursBankInfo.available < 10 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">Saldo Baixo</span>
              </div>
              <p className="text-xs text-yellow-700 mt-1">
                Considere recarregar sua bolsa para evitar interrupções no suporte
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}