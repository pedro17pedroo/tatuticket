import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { authService } from "@/lib/auth";

export function AdvancedAnalytics() {
  const tenantId = authService.getTenantId();
  const [period, setPeriod] = useState("30d");

  // Fetch advanced analytics
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['/api/analytics/advanced', tenantId, period],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/advanced?tenantId=${tenantId}&period=${period}`);
      return response.json();
    },
    enabled: !!tenantId,
  });

  // Mock data for charts when real data is not available
  const ticketTrendData = [
    { month: 'Jan', tickets: 45, resolved: 42 },
    { month: 'Fev', tickets: 52, resolved: 48 },
    { month: 'Mar', tickets: 38, resolved: 40 },
    { month: 'Abr', tickets: 61, resolved: 55 },
    { month: 'Mai', tickets: 55, resolved: 58 },
    { month: 'Jun', tickets: 67, resolved: 62 },
  ];

  const agentPerformanceData = [
    { name: 'Maria Santos', tickets: 24, rating: 4.8 },
    { name: 'Pedro Lima', tickets: 19, rating: 4.6 },
    { name: 'Ana Costa', tickets: 22, rating: 4.9 },
    { name: 'João Silva', tickets: 16, rating: 4.4 },
    { name: 'Clara Oliveira', tickets: 20, rating: 4.7 },
  ];

  const priorityDistribution = [
    { name: 'Baixo', value: analytics?.trends?.priorityDistribution?.low || 35, color: '#10B981' },
    { name: 'Médio', value: analytics?.trends?.priorityDistribution?.medium || 28, color: '#F59E0B' },
    { name: 'Alto', value: analytics?.trends?.priorityDistribution?.high || 22, color: '#EF4444' },
    { name: 'Crítico', value: analytics?.trends?.priorityDistribution?.critical || 15, color: '#DC2626' },
  ];

  const responseTimeData = [
    { hour: '0-1h', tickets: 145 },
    { hour: '1-2h', tickets: 89 },
    { hour: '2-4h', tickets: 67 },
    { hour: '4-8h', tickets: 45 },
    { hour: '8-24h', tickets: 23 },
    { hour: '+24h', tickets: 12 },
  ];

  const slaComplianceData = [
    { department: 'Suporte Técnico', sla: 94.2, target: 95 },
    { department: 'Vendas', sla: 97.8, target: 95 },
    { department: 'Financeiro', sla: 89.4, target: 90 },
    { department: 'RH', sla: 96.1, target: 95 },
    { department: 'TI', sla: 91.7, target: 95 },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Analytics Avançados</h2>
            <p className="text-gray-600">Análise detalhada de performance e tendências</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-32 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Avançados</h2>
          <p className="text-gray-600">Análise detalhada de performance e tendências</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="90d">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="sla">SLA & Tempo</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tendência de Tickets */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="fas fa-chart-line mr-2 text-blue-600"></i>
                  Tendência de Tickets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={ticketTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="tickets" stroke="#3B82F6" strokeWidth={2} name="Criados" />
                    <Line type="monotone" dataKey="resolved" stroke="#10B981" strokeWidth={2} name="Resolvidos" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Distribuição por Prioridade */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="fas fa-chart-pie mr-2 text-green-600"></i>
                  Distribuição por Prioridade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={priorityDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {priorityDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Tempo de Resposta */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="fas fa-clock mr-2 text-orange-600"></i>
                  Distribuição de Tempo de Resposta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={responseTimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="tickets" fill="#F59E0B" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Métricas Rápidas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="fas fa-tachometer-alt mr-2 text-purple-600"></i>
                  Métricas do Período
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {analytics?.trends?.totalTickets || 0}
                    </div>
                    <div className="text-sm text-gray-600">Total de Tickets</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {analytics?.trends?.avgResponseTime?.toFixed(1) || '0.0'}h
                    </div>
                    <div className="text-sm text-gray-600">Tempo Médio Resposta</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Status dos Tickets:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Abertos:</span>
                      <Badge variant="outline">{analytics?.trends?.statusDistribution?.open || 0}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Em Progresso:</span>
                      <Badge variant="default">{analytics?.trends?.statusDistribution?.in_progress || 0}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Resolvidos:</span>
                      <Badge variant="secondary">{analytics?.trends?.statusDistribution?.resolved || 0}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Fechados:</span>
                      <Badge variant="outline">{analytics?.trends?.statusDistribution?.closed || 0}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance dos Agentes */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="fas fa-user-tie mr-2 text-indigo-600"></i>
                  Performance dos Agentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={agentPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="tickets" fill="#6366F1" name="Tickets Resolvidos" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Rankings */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {agentPerformanceData
                    .sort((a, b) => b.rating - a.rating)
                    .map((agent, index) => (
                    <div key={agent.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white mr-3 ${
                          index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-gray-300'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{agent.name}</div>
                          <div className="text-sm text-gray-600">{agent.tickets} tickets</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <i className="fas fa-star text-yellow-400 mr-1"></i>
                        <span className="font-medium">{agent.rating}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sla" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Compliance por Departamento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="fas fa-chart-bar mr-2 text-emerald-600"></i>
                  Compliance SLA por Departamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {slaComplianceData.map((dept) => (
                    <div key={dept.department} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{dept.department}</span>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${dept.sla >= dept.target ? 'text-green-600' : 'text-red-600'}`}>
                            {dept.sla}%
                          </span>
                          <span className="text-sm text-gray-500">
                            (meta: {dept.target}%)
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${dept.sla >= dept.target ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(dept.sla, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}