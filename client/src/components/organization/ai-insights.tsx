import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Brain,
  TrendingUp,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  BarChart3,
  PieChart,
  Target,
  Zap,
  MessageSquare,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { useQuery } from '@tanstack/react-query';

// Mock AI Insights Data
const MOCK_AI_INSIGHTS = {
  sentiment: {
    overview: {
      positive: 68,
      neutral: 22,
      negative: 10,
      trend: 'improving'
    },
    data: [
      { period: 'Jan', positive: 60, neutral: 25, negative: 15 },
      { period: 'Feb', positive: 65, neutral: 23, negative: 12 },
      { period: 'Mar', positive: 68, neutral: 22, negative: 10 },
    ]
  },
  categories: [
    { name: 'Problemas Técnicos', count: 145, confidence: 0.92, trend: 5 },
    { name: 'Dúvidas sobre Produto', count: 89, confidence: 0.88, trend: -3 },
    { name: 'Problemas de Billing', count: 67, confidence: 0.95, trend: 8 },
    { name: 'Solicitações de Feature', count: 45, confidence: 0.85, trend: 12 },
    { name: 'Problemas de Login', count: 34, confidence: 0.91, trend: -15 }
  ],
  predictions: [
    {
      id: '1',
      type: 'volume',
      title: 'Aumento de tickets previsto',
      description: 'Esperamos um aumento de 25% nos tickets na próxima semana',
      confidence: 0.87,
      impact: 'high',
      suggestions: [
        'Adicionar 2 agentes temporários',
        'Preparar artigos de conhecimento sobre problemas comuns',
        'Configurar automações para triagem'
      ]
    },
    {
      id: '2',
      type: 'sla_risk',
      title: 'Risco de violação de SLA',
      description: '15 tickets críticos podem violar SLA nas próximas 4 horas',
      confidence: 0.94,
      impact: 'critical',
      suggestions: [
        'Escalar tickets críticos imediatamente',
        'Notificar gerentes de equipe',
        'Ativar modo de urgência'
      ]
    },
    {
      id: '3',
      type: 'satisfaction',
      title: 'Melhoria na satisfação',
      description: 'Mudanças recentes resultaram em 15% mais avaliações positivas',
      confidence: 0.82,
      impact: 'positive',
      suggestions: [
        'Documentar as práticas que funcionaram',
        'Aplicar melhorias em outros departamentos',
        'Comunicar sucesso à equipe'
      ]
    }
  ],
  agentInsights: [
    {
      id: 'agent1',
      name: 'Ana Silva',
      performance: {
        resolutionRate: 94,
        avgResponseTime: 12,
        satisfactionScore: 4.7,
        trend: 'up'
      },
      strengths: ['Resolução rápida', 'Comunicação clara', 'Conhecimento técnico'],
      improvements: ['Documentação de soluções', 'Follow-up proativo']
    },
    {
      id: 'agent2',
      name: 'Carlos Santos',
      performance: {
        resolutionRate: 87,
        avgResponseTime: 18,
        satisfactionScore: 4.3,
        trend: 'stable'
      },
      strengths: ['Paciência com clientes', 'Atenção aos detalhes'],
      improvements: ['Velocidade de resposta', 'Conhecimento de produto']
    }
  ],
  automationOpportunities: [
    {
      id: '1',
      title: 'Redefinição de senha',
      description: '78% dos tickets de login podem ser automatizados',
      potential: 'high',
      effort: 'low',
      impact: 'Redução de 156 tickets/mês'
    },
    {
      id: '2',
      title: 'Status de pedidos',
      description: 'Consultas de status representam 45% dos tickets de billing',
      potential: 'medium',
      effort: 'medium',
      impact: 'Redução de 89 tickets/mês'
    },
    {
      id: '3',
      title: 'FAQ Automatizada',
      description: 'IA pode responder 60% das perguntas frequentes',
      potential: 'high',
      effort: 'high',
      impact: 'Redução de 234 tickets/mês'
    }
  ]
};

export function AIInsights() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');

  const { data: insights = MOCK_AI_INSIGHTS, isLoading } = useQuery<typeof MOCK_AI_INSIGHTS>({
    queryKey: ['/api/ai/insights', 'tenant-1', selectedTimeframe],
    enabled: true,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="ai-insights">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center">
            <Brain className="w-8 h-8 mr-3 text-primary" />
            Insights de IA
          </h2>
          <p className="text-muted-foreground">
            Análises inteligentes para otimizar seu suporte
          </p>
        </div>
        <div className="flex space-x-2">
          {['7d', '30d', '90d'].map((period) => (
            <Button
              key={period}
              variant={selectedTimeframe === period ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTimeframe(period)}
              data-testid={`button-timeframe-${period}`}
            >
              {period === '7d' ? '7 dias' : period === '30d' ? '30 dias' : '90 dias'}
            </Button>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Sentimento Geral</p>
                <p className="text-2xl font-bold text-green-600">
                  {insights.sentiment.overview.positive}%
                </p>
                <p className="text-xs text-muted-foreground">Positivo</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Categorias Detectadas</p>
                <p className="text-2xl font-bold">{insights.categories.length}</p>
                <p className="text-xs text-muted-foreground">Automáticas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Previsões Ativas</p>
                <p className="text-2xl font-bold">{insights.predictions.length}</p>
                <p className="text-xs text-muted-foreground">Críticas: 1</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Automação</p>
                <p className="text-2xl font-bold">
                  {insights.automationOpportunities.reduce((acc, opp) => 
                    acc + parseInt(opp.impact.split(' ')[1] || '0'), 0
                  )}
                </p>
                <p className="text-xs text-muted-foreground">Tickets/mês</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="predictions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="predictions" data-testid="tab-predictions">
            Previsões
          </TabsTrigger>
          <TabsTrigger value="sentiment" data-testid="tab-sentiment">
            Análise de Sentimento
          </TabsTrigger>
          <TabsTrigger value="categories" data-testid="tab-categories">
            Categorização
          </TabsTrigger>
          <TabsTrigger value="agents" data-testid="tab-agent-insights">
            Performance de Agentes
          </TabsTrigger>
          <TabsTrigger value="automation" data-testid="tab-automation">
            Oportunidades
          </TabsTrigger>
        </TabsList>

        <TabsContent value="predictions" className="space-y-4">
          <div className="grid gap-4">
            {insights.predictions.map((prediction) => (
              <Card key={prediction.id} className={`border-l-4 ${
                prediction.impact === 'critical' ? 'border-l-red-500' :
                prediction.impact === 'high' ? 'border-l-orange-500' :
                prediction.impact === 'positive' ? 'border-l-green-500' :
                'border-l-blue-500'
              }`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {prediction.impact === 'critical' ? (
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                      ) : prediction.impact === 'positive' ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      ) : (
                        <TrendingUp className="w-6 h-6 text-blue-500" />
                      )}
                      <div>
                        <CardTitle className="text-lg" data-testid={`prediction-title-${prediction.id}`}>
                          {prediction.title}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {prediction.description}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={
                        prediction.impact === 'critical' ? 'destructive' :
                        prediction.impact === 'positive' ? 'default' : 'secondary'
                      }>
                        {Math.round(prediction.confidence * 100)}% confiança
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center">
                      <Lightbulb className="w-4 h-4 mr-2" />
                      Sugestões:
                    </h4>
                    <ul className="space-y-1">
                      {prediction.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-center text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                    <div className="flex space-x-2 mt-4">
                      <Button size="sm" data-testid={`button-apply-${prediction.id}`}>
                        Aplicar Sugestões
                      </Button>
                      <Button variant="outline" size="sm">
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sentiment" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Sentimento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ThumbsUp className="w-4 h-4 text-green-500" />
                      <span>Positivo</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{insights.sentiment.overview.positive}%</span>
                      <Progress value={insights.sentiment.overview.positive} className="w-20" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="w-4 h-4 text-gray-500" />
                      <span>Neutro</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{insights.sentiment.overview.neutral}%</span>
                      <Progress value={insights.sentiment.overview.neutral} className="w-20" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ThumbsDown className="w-4 h-4 text-red-500" />
                      <span>Negativo</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{insights.sentiment.overview.negative}%</span>
                      <Progress value={insights.sentiment.overview.negative} className="w-20" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Evolução do Sentimento</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={insights.sentiment.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="positive" 
                      stroke="#10b981" 
                      name="Positivo"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="negative" 
                      stroke="#ef4444" 
                      name="Negativo"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Categorias Mais Frequentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.categories.map((category, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium" data-testid={`category-name-${index}`}>
                          {category.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {category.count} tickets • {Math.round(category.confidence * 100)}% confiança
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={category.trend > 0 ? 'default' : category.trend < 0 ? 'destructive' : 'secondary'}>
                        {category.trend > 0 ? '+' : ''}{category.trend}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <div className="grid gap-6">
            {insights.agentInsights.map((agent) => (
              <Card key={agent.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle data-testid={`agent-name-${agent.id}`}>{agent.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Performance geral: {agent.performance.satisfactionScore}/5.0
                        </p>
                      </div>
                    </div>
                    <Badge variant={
                      agent.performance.trend === 'up' ? 'default' :
                      agent.performance.trend === 'down' ? 'destructive' : 'secondary'
                    }>
                      {agent.performance.trend === 'up' ? '↗' : 
                       agent.performance.trend === 'down' ? '↘' : '→'} Tendência
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {agent.performance.resolutionRate}%
                      </p>
                      <p className="text-sm text-muted-foreground">Taxa de Resolução</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {agent.performance.avgResponseTime}min
                      </p>
                      <p className="text-sm text-muted-foreground">Tempo Médio</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {agent.performance.satisfactionScore}
                      </p>
                      <p className="text-sm text-muted-foreground">Satisfação</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-green-700 mb-2">Pontos Fortes:</h4>
                      <ul className="space-y-1">
                        {agent.strengths.map((strength, index) => (
                          <li key={index} className="flex items-center text-sm">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-orange-700 mb-2">Oportunidades:</h4>
                      <ul className="space-y-1">
                        {agent.improvements.map((improvement, index) => (
                          <li key={index} className="flex items-center text-sm">
                            <Target className="w-4 h-4 text-orange-500 mr-2" />
                            {improvement}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <div className="grid gap-4">
            {insights.automationOpportunities.map((opportunity) => (
              <Card key={opportunity.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg" data-testid={`automation-title-${opportunity.id}`}>
                        {opportunity.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {opportunity.description}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Badge variant={opportunity.potential === 'high' ? 'default' : 'secondary'}>
                        {opportunity.potential === 'high' ? 'Alto Potencial' : 'Médio Potencial'}
                      </Badge>
                      <Badge variant="outline">
                        {opportunity.effort === 'low' ? 'Baixo Esforço' : 
                         opportunity.effort === 'medium' ? 'Médio Esforço' : 'Alto Esforço'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Zap className="w-5 h-5 text-yellow-500" />
                      <span className="font-medium">Impacto:</span>
                      <span className="text-green-600">{opportunity.impact}</span>
                    </div>
                    <Button size="sm" data-testid={`button-implement-${opportunity.id}`}>
                      Implementar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}