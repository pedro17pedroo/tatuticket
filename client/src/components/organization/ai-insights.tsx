import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Brain, TrendingUp, AlertTriangle, CheckCircle, Clock, Target, Lightbulb, Activity } from "lucide-react";
import { authService } from "@/lib/auth";

interface AIInsights {
  insights: string[];
  trends: Array<{
    type: string;
    description: string;
    impact: 'positive' | 'negative' | 'neutral';
  }>;
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    action: string;
    rationale: string;
  }>;
  performance_score: number;
  predictions: Array<{
    metric: string;
    prediction: string;
    confidence: number;
  }>;
}

export function AIInsights() {
  const [activeTab, setActiveTab] = useState("insights");
  const tenantId = authService.getTenantId();

  const { data: aiInsights, isLoading, refetch } = useQuery<AIInsights>({
    queryKey: ['/api/ai/insights', tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/ai/insights?tenantId=${tenantId}`);
      if (!response.ok) throw new Error('Failed to fetch AI insights');
      return response.json();
    },
    enabled: !!tenantId,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'positive': return 'text-green-600 bg-green-50 border-green-200';
      case 'negative': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'positive': return <TrendingUp className="h-5 w-5 text-green-600" />;
      case 'negative': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default: return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-full mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Brain className="h-6 w-6 mr-2 text-purple-600" />
            Insights de IA
          </h1>
          <p className="text-gray-600">Análises inteligentes e recomendações baseadas em dados</p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          <Activity className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Performance Score */}
      {aiInsights?.performance_score && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Score de Performance</h3>
                <p className="text-gray-600">Avaliação geral do atendimento baseada em IA</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-purple-600">
                  {Math.round(aiInsights.performance_score)}%
                </div>
                <p className="text-sm text-gray-500">Performance Geral</p>
              </div>
            </div>
            <Progress value={aiInsights.performance_score} className="w-full" />
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="insights">
            <Lightbulb className="h-4 w-4 mr-2" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="trends">
            <TrendingUp className="h-4 w-4 mr-2" />
            Tendências
          </TabsTrigger>
          <TabsTrigger value="recommendations">
            <Target className="h-4 w-4 mr-2" />
            Recomendações
          </TabsTrigger>
          <TabsTrigger value="predictions">
            <Clock className="h-4 w-4 mr-2" />
            Previsões
          </TabsTrigger>
        </TabsList>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          {aiInsights?.insights && aiInsights.insights.length > 0 ? (
            <div className="grid gap-4">
              {aiInsights.insights.map((insight, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <Lightbulb className="h-5 w-5 text-yellow-500 mt-0.5" />
                      <p className="text-gray-800 leading-relaxed">{insight}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Brain className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aguardando Dados
                </h3>
                <p className="text-gray-500">
                  Crie alguns tickets para gerar insights inteligentes sobre o atendimento.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          {aiInsights?.trends && aiInsights.trends.length > 0 ? (
            <div className="grid gap-4">
              {aiInsights.trends.map((trend, index) => (
                <Card key={index} className={`border-l-4 ${getImpactColor(trend.impact)}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          {getImpactIcon(trend.impact)}
                          <h4 className="text-lg font-semibold text-gray-900 ml-2">{trend.type}</h4>
                        </div>
                        <p className="text-gray-700">{trend.description}</p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={getImpactColor(trend.impact)}
                      >
                        {trend.impact}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Analisando Tendências
                </h3>
                <p className="text-gray-500">
                  Aguarde mais dados para identificar padrões e tendências.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          {aiInsights?.recommendations && aiInsights.recommendations.length > 0 ? (
            <div className="grid gap-4">
              {aiInsights.recommendations.map((rec, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      <div className={`w-2 h-2 rounded-full mt-2 ${getPriorityColor(rec.priority)}`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-lg font-semibold text-gray-900">{rec.action}</h4>
                          <Badge 
                            variant="outline"
                            className={
                              rec.priority === 'high' 
                                ? 'text-red-600 border-red-600' 
                                : rec.priority === 'medium'
                                ? 'text-yellow-600 border-yellow-600'
                                : 'text-green-600 border-green-600'
                            }
                          >
                            {rec.priority === 'high' ? 'Alta' : rec.priority === 'medium' ? 'Média' : 'Baixa'}
                          </Badge>
                        </div>
                        <p className="text-gray-700">{rec.rationale}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Gerando Recomendações
                </h3>
                <p className="text-gray-500">
                  A IA está analisando dados para gerar recomendações personalizadas.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-4">
          {aiInsights?.predictions && aiInsights.predictions.length > 0 ? (
            <div className="grid gap-4">
              {aiInsights.predictions.map((pred, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">{pred.metric}</h4>
                        <p className="text-gray-700 mb-3">{pred.prediction}</p>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">Confiança:</span>
                          <Progress value={pred.confidence * 100} className="w-24" />
                          <span className="text-sm font-medium">{Math.round(pred.confidence * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Calculando Previsões
                </h3>
                <p className="text-gray-500">
                  Modelos preditivos estão sendo calibrados com base nos dados históricos.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}