import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authService } from "@/lib/auth";

interface AIInsight {
  id: string;
  type: "prediction" | "recommendation" | "anomaly" | "sentiment";
  title: string;
  description: string;
  confidence: number;
  priority: "low" | "medium" | "high" | "critical";
  category: string;
  createdAt: string;
  actionable: boolean;
  relatedTickets?: string[];
}

interface PredictiveAnalytics {
  ticketVolumeNext7Days: {
    predicted: number;
    current: number;
    trend: "increase" | "decrease" | "stable";
    confidence: number;
  };
  slaRiskTickets: {
    count: number;
    tickets: Array<{
      id: string;
      number: string;
      subject: string;
      riskLevel: number;
      timeToDeadline: number;
    }>;
  };
  categoryTrends: {
    category: string;
    trend: "increasing" | "decreasing" | "stable";
    change: number;
    ticketsCount: number;
  }[];
  customerSatisfaction: {
    predicted: number;
    current: number;
    factorsInfluencing: string[];
  };
}

export function AIInsights() {
  const [timeRange, setTimeRange] = useState("7d");
  const [insightFilter, setInsightFilter] = useState("all");
  
  const tenantId = authService.getTenantId();

  // Fetch AI insights
  const { data: insights = [], isLoading: insightsLoading } = useQuery<AIInsight[]>({
    queryKey: ['/api/ai/insights', tenantId, timeRange],
    enabled: !!tenantId,
  });

  // Fetch predictive analytics
  const { data: predictiveData = {
    ticketVolumeNext7Days: { predicted: 0, current: 0, trend: 'stable' as const, confidence: 0 },
    slaRiskTickets: { count: 0, tickets: [] },
    categoryTrends: [],
    customerSatisfaction: { predicted: 0, current: 0, factorsInfluencing: [] }
  }, isLoading: predictiveLoading } = useQuery<PredictiveAnalytics>({
    queryKey: ['/api/ai/predictive-analytics', tenantId, timeRange],
    enabled: !!tenantId,
  });

  // Fetch sentiment analysis
  const { data: sentimentData = {
    overall: { score: 0, trend: 'stable' as const },
    positive: 0,
    neutral: 0,
    negative: 0
  } } = useQuery<{
    overall: { score: number; trend: string };
    positive: number;
    neutral: number;
    negative: number;
  }>({
    queryKey: ['/api/ai/sentiment-analysis', tenantId, timeRange],
    enabled: !!tenantId,
  });

  const filteredInsights = insights.filter((insight: AIInsight) => {
    if (insightFilter === "all") return true;
    return insight.type === insightFilter;
  });

  const getInsightTypeIcon = (type: string) => {
    switch (type) {
      case 'prediction': return 'fa-crystal-ball';
      case 'recommendation': return 'fa-lightbulb';
      case 'anomaly': return 'fa-exclamation-triangle';
      case 'sentiment': return 'fa-heart';
      default: return 'fa-chart-line';
    }
  };

  const getInsightTypeColor = (type: string) => {
    switch (type) {
      case 'prediction': return 'bg-purple-100 text-purple-800';
      case 'recommendation': return 'bg-blue-100 text-blue-800';
      case 'anomaly': return 'bg-orange-100 text-orange-800';
      case 'sentiment': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increase':
      case 'increasing': return 'fa-arrow-up text-red-600';
      case 'decrease':
      case 'decreasing': return 'fa-arrow-down text-green-600';
      case 'stable': return 'fa-minus text-gray-600';
      default: return 'fa-minus text-gray-600';
    }
  };

  if (insightsLoading || predictiveLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <i className="fas fa-spinner fa-spin text-2xl text-gray-400"></i>
          <span className="ml-3 text-gray-600">Analisando dados com IA...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Insights de IA</h1>
          <p className="text-gray-600">Análises preditivas e recomendações inteligentes</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40" data-testid="select-time-range">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Últimas 24h</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" data-testid="button-refresh-insights">
            <i className="fas fa-sync mr-2"></i>
            Atualizar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="insights" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="insights" data-testid="tab-insights">
            <i className="fas fa-lightbulb mr-2"></i>
            Insights
          </TabsTrigger>
          <TabsTrigger value="predictions" data-testid="tab-predictions">
            <i className="fas fa-crystal-ball mr-2"></i>
            Predições
          </TabsTrigger>
          <TabsTrigger value="sentiment" data-testid="tab-sentiment">
            <i className="fas fa-heart mr-2"></i>
            Sentimento
          </TabsTrigger>
          <TabsTrigger value="automation" data-testid="tab-automation">
            <i className="fas fa-robot mr-2"></i>
            Automação
          </TabsTrigger>
        </TabsList>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Insights Recentes ({filteredInsights.length})</h2>
            <Select value={insightFilter} onValueChange={setInsightFilter}>
              <SelectTrigger className="w-48" data-testid="select-insight-filter">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="prediction">Predições</SelectItem>
                <SelectItem value="recommendation">Recomendações</SelectItem>
                <SelectItem value="anomaly">Anomalias</SelectItem>
                <SelectItem value="sentiment">Sentimento</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {filteredInsights.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <i className="fas fa-robot text-4xl text-gray-300 mb-4"></i>
                    <p className="text-lg font-medium text-gray-600 mb-2">
                      Nenhum insight disponível
                    </p>
                    <p className="text-gray-500">
                      A IA está coletando dados para gerar insights. Volte em breve.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredInsights.map((insight: AIInsight) => (
                <Card key={insight.id} className="hover:shadow-md transition-shadow" data-testid={`insight-${insight.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="p-3 bg-gray-100 rounded-full">
                          <i className={`fas ${getInsightTypeIcon(insight.type)} text-gray-600`}></i>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                            <Badge className={getInsightTypeColor(insight.type)}>
                              {insight.type}
                            </Badge>
                            <Badge className={getPriorityColor(insight.priority)}>
                              {insight.priority}
                            </Badge>
                          </div>
                          
                          <p className="text-gray-600 mb-3">{insight.description}</p>
                          
                          <div className="flex items-center space-x-6 text-sm text-gray-500">
                            <span>
                              <i className="fas fa-chart-bar mr-1"></i>
                              Confiança: {insight.confidence}%
                            </span>
                            <span>
                              <i className="fas fa-tag mr-1"></i>
                              {insight.category}
                            </span>
                            <span>
                              <i className="fas fa-clock mr-1"></i>
                              {formatDate(insight.createdAt)}
                            </span>
                            {insight.relatedTickets && insight.relatedTickets.length > 0 && (
                              <span>
                                <i className="fas fa-ticket-alt mr-1"></i>
                                {insight.relatedTickets.length} tickets relacionados
                              </span>
                            )}
                          </div>
                          
                          <div className="mt-3">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-sm text-gray-600">Nível de confiança:</span>
                            </div>
                            <Progress value={insight.confidence} className="h-2" />
                          </div>
                        </div>
                      </div>
                      
                      {insight.actionable && (
                        <div className="ml-4">
                          <Button size="sm" data-testid={`button-act-on-insight-${insight.id}`}>
                            <i className="fas fa-play mr-2"></i>
                            Agir
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-6">
          {predictiveData && (
            <>
              {/* Volume Prediction */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <i className="fas fa-chart-line mr-2"></i>
                    Previsão de Volume de Tickets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-2">Volume Atual</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {predictiveData.ticketVolumeNext7Days.current}
                      </p>
                      <p className="text-sm text-gray-500">tickets</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-2">Previsão (7 dias)</p>
                      <p className="text-3xl font-bold text-blue-600">
                        {predictiveData.ticketVolumeNext7Days.predicted}
                      </p>
                      <div className="flex items-center justify-center mt-1">
                        <i className={`fas ${getTrendIcon(predictiveData.ticketVolumeNext7Days.trend)} mr-1`}></i>
                        <span className="text-sm text-gray-600">
                          {predictiveData.ticketVolumeNext7Days.trend}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-2">Confiança</p>
                      <p className="text-3xl font-bold text-green-600">
                        {predictiveData.ticketVolumeNext7Days.confidence}%
                      </p>
                      <Progress 
                        value={predictiveData.ticketVolumeNext7Days.confidence} 
                        className="h-2 mt-2" 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* SLA Risk Tickets */}
              {predictiveData.slaRiskTickets.count > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-orange-700">
                      <i className="fas fa-exclamation-triangle mr-2"></i>
                      Tickets em Risco de SLA ({predictiveData.slaRiskTickets.count})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {predictiveData.slaRiskTickets.tickets.map((ticket: any) => (
                        <div key={ticket.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">#{ticket.number}</p>
                            <p className="text-sm text-gray-600">{ticket.subject}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-orange-700">
                              Risco: {ticket.riskLevel}%
                            </p>
                            <p className="text-xs text-gray-500">
                              {Math.floor(ticket.timeToDeadline / 60)}h restantes
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Category Trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <i className="fas fa-chart-bar mr-2"></i>
                    Tendências por Categoria
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {predictiveData.categoryTrends.map((trend: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{trend.category}</p>
                          <p className="text-sm text-gray-600">{trend.ticketsCount} tickets</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`text-sm font-medium ${trend.change > 0 ? 'text-red-600' : trend.change < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                            {trend.change > 0 ? '+' : ''}{trend.change}%
                          </span>
                          <i className={`fas ${getTrendIcon(trend.trend)}`}></i>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Sentiment Analysis Tab */}
        <TabsContent value="sentiment" className="space-y-6">
          {sentimentData && (
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <i className="fas fa-smile mr-2"></i>
                    Análise de Sentimento Geral
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl mb-4">
                      {sentimentData.overall.score >= 0.7 ? '😊' : sentimentData.overall.score >= 0.4 ? '😐' : '😞'}
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mb-2">
                      {(sentimentData.overall.score * 100).toFixed(1)}%
                    </p>
                    <p className="text-gray-600">Satisfação geral dos clientes</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Distribuição de Sentimentos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center">
                      <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                      Positivo
                    </span>
                    <span className="font-medium">{sentimentData.positive}%</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="flex items-center">
                      <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                      Neutro
                    </span>
                    <span className="font-medium">{sentimentData.neutral}%</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="flex items-center">
                      <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                      Negativo
                    </span>
                    <span className="font-medium">{sentimentData.negative}%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Automation Tab */}
        <TabsContent value="automation" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="fas fa-robot mr-2"></i>
                  Automações Ativas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div>
                      <p className="font-medium text-green-900">Categorização Automática</p>
                      <p className="text-sm text-green-700">Classifica tickets por conteúdo</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div>
                      <p className="font-medium text-blue-900">Priorização Inteligente</p>
                      <p className="text-sm text-blue-700">Define prioridade por urgência</p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">Ativo</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div>
                      <p className="font-medium text-yellow-900">Roteamento Automático</p>
                      <p className="text-sm text-yellow-700">Atribui tickets para equipes</p>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">Configurando</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="fas fa-chart-line mr-2"></i>
                  Performance da Automação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Taxa de Acerto</span>
                      <span className="font-medium">87%</span>
                    </div>
                    <Progress value={87} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Tickets Processados</span>
                      <span className="font-medium">1,234</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Tempo Economizado</span>
                      <span className="font-medium">48h</span>
                    </div>
                    <Progress value={90} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}