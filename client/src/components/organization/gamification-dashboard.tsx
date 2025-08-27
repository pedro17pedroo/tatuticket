import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Agent {
  id: string;
  name: string;
  avatar?: string;
  level: number;
  xp: number;
  nextLevelXp: number;
  badges: Badge[];
  stats: {
    ticketsResolved: number;
    avgResponseTime: number;
    customerRating: number;
    streakDays: number;
  };
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: Date;
}

interface Quest {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  reward: {
    xp: number;
    badge?: Badge;
  };
  expiresAt?: Date;
}

const mockAgents: Agent[] = [
  {
    id: '1',
    name: 'Maria Silva',
    level: 15,
    xp: 2450,
    nextLevelXp: 2700,
    badges: [
      { id: 'speed', name: 'Resposta Rápida', description: 'Respondeu 100 tickets em menos de 1h', icon: 'fas fa-bolt', rarity: 'rare' },
      { id: 'helper', name: 'Ajudante', description: 'Resolveu 500 tickets', icon: 'fas fa-helping-hand', rarity: 'common' }
    ],
    stats: {
      ticketsResolved: 542,
      avgResponseTime: 12,
      customerRating: 4.8,
      streakDays: 15
    }
  },
  {
    id: '2',
    name: 'João Santos',
    level: 12,
    xp: 1890,
    nextLevelXp: 2100,
    badges: [
      { id: 'night', name: 'Coruja', description: 'Trabalhou 20 madrugadas', icon: 'fas fa-moon', rarity: 'epic' }
    ],
    stats: {
      ticketsResolved: 423,
      avgResponseTime: 18,
      customerRating: 4.6,
      streakDays: 8
    }
  }
];

const mockQuests: Quest[] = [
  {
    id: '1',
    title: 'Velocista Semanal',
    description: 'Resolva 25 tickets esta semana',
    progress: 18,
    target: 25,
    reward: { xp: 200, badge: { id: 'weekly', name: 'Velocista', description: 'Completou quest semanal', icon: 'fas fa-trophy', rarity: 'rare' } },
    expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
  },
  {
    id: '2',
    title: 'Satisfação Máxima',
    description: 'Mantenha rating 5 estrelas por 10 tickets consecutivos',
    progress: 7,
    target: 10,
    reward: { xp: 300 },
    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
  }
];

const getRarityColor = (rarity: string) => {
  const colors = {
    common: 'bg-gray-100 text-gray-800 border-gray-300',
    rare: 'bg-blue-100 text-blue-800 border-blue-300',
    epic: 'bg-purple-100 text-purple-800 border-purple-300',
    legendary: 'bg-yellow-100 text-yellow-800 border-yellow-300'
  };
  return colors[rarity as keyof typeof colors] || colors.common;
};

export function GamificationDashboard() {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sistema de Gamificação</h2>
          <p className="text-gray-600">Motivação e engajamento da equipe</p>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" data-testid="button-leaderboard-config">
            <i className="fas fa-cog mr-2"></i>
            Configurar
          </Button>
          <Button data-testid="button-create-quest">
            <i className="fas fa-plus mr-2"></i>
            Nova Quest
          </Button>
        </div>
      </div>

      <Tabs defaultValue="leaderboard" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="leaderboard">Ranking</TabsTrigger>
          <TabsTrigger value="quests">Quests Ativas</TabsTrigger>
          <TabsTrigger value="badges">Conquistas</TabsTrigger>
          <TabsTrigger value="analytics">Análises</TabsTrigger>
        </TabsList>

        {/* Ranking dos Agentes */}
        <TabsContent value="leaderboard">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>🏆 Ranking Mensal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockAgents.map((agent, index) => (
                    <div key={agent.id} className="flex items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                         onClick={() => setSelectedAgent(agent)}
                         data-testid={`agent-ranking-${index}`}>
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="text-2xl font-bold text-gray-400">
                          #{index + 1}
                        </div>
                        
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={agent.avatar} />
                          <AvatarFallback>{agent.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <h3 className="font-semibold">{agent.name}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>Level {agent.level}</span>
                            <span>{agent.stats.ticketsResolved} tickets</span>
                            <span>⭐ {agent.stats.customerRating}</span>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-600">{agent.xp} XP</div>
                          <Progress value={(agent.xp / agent.nextLevelXp) * 100} className="w-24 mt-1" />
                        </div>
                      </div>
                      
                      <div className="flex space-x-1 ml-4">
                        {agent.badges.slice(0, 3).map((badge) => (
                          <div key={badge.id} 
                               className={`w-8 h-8 rounded-full flex items-center justify-center border ${getRarityColor(badge.rarity)}`}
                               title={badge.name}>
                            <i className={`${badge.icon} text-xs`}></i>
                          </div>
                        ))}
                        {agent.badges.length > 3 && (
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs">
                            +{agent.badges.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Quests Ativas */}
        <TabsContent value="quests">
          <div className="grid gap-4">
            {mockQuests.map((quest) => (
              <Card key={quest.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{quest.title}</h3>
                      <p className="text-gray-600">{quest.description}</p>
                    </div>
                    {quest.expiresAt && (
                      <Badge variant="outline">
                        <i className="fas fa-clock mr-1"></i>
                        {Math.ceil((quest.expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000))} dias
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progresso: {quest.progress}/{quest.target}</span>
                      <span>{Math.round((quest.progress / quest.target) * 100)}%</span>
                    </div>
                    
                    <Progress value={(quest.progress / quest.target) * 100} />
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <i className="fas fa-star text-yellow-500"></i>
                        <span>{quest.reward.xp} XP</span>
                        {quest.reward.badge && (
                          <>
                            <span>+</span>
                            <div className={`px-2 py-1 rounded-full text-xs ${getRarityColor(quest.reward.badge.rarity)}`}>
                              <i className={`${quest.reward.badge.icon} mr-1`}></i>
                              {quest.reward.badge.name}
                            </div>
                          </>
                        )}
                      </div>
                      
                      <Button variant="outline" size="sm" data-testid={`button-quest-${quest.id}`}>
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Conquistas e Badges */}
        <TabsContent value="badges">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from(new Set(mockAgents.flatMap(agent => agent.badges.map(b => b.id)))).map(badgeId => {
              const badge = mockAgents.flatMap(agent => agent.badges).find(b => b.id === badgeId);
              if (!badge) return null;
              return (
              <Card key={badge.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-center">
                  <div className={`w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center ${getRarityColor(badge.rarity)}`}>
                    <i className={`${badge.icon} text-2xl`}></i>
                  </div>
                  
                  <h3 className="font-semibold mb-1">{badge.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{badge.description}</p>
                  
                  <Badge variant="outline" className={getRarityColor(badge.rarity)}>
                    {badge.rarity.charAt(0).toUpperCase() + badge.rarity.slice(1)}
                  </Badge>
                </CardContent>
              </Card>
            );
            }).filter(Boolean)}
          </div>
        </TabsContent>

        {/* Análises de Gamificação */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Engajamento Médio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">89%</div>
                <p className="text-xs text-gray-600">+5% em relação ao mês anterior</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Quests Completadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">47</div>
                <p className="text-xs text-gray-600">Este mês</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Badges Conquistadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">23</div>
                <p className="text-xs text-gray-600">Total da equipe</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de Detalhes do Agente */}
      {selectedAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedAgent(null)}>
          <Card className="max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedAgent.avatar} />
                  <AvatarFallback>{selectedAgent.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{selectedAgent.name}</CardTitle>
                  <p className="text-sm text-gray-600">Level {selectedAgent.level} • {selectedAgent.xp} XP</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Estatísticas</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Tickets Resolvidos:</span>
                      <div className="font-semibold">{selectedAgent.stats.ticketsResolved}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Tempo Médio:</span>
                      <div className="font-semibold">{selectedAgent.stats.avgResponseTime}min</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Rating Cliente:</span>
                      <div className="font-semibold">⭐ {selectedAgent.stats.customerRating}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Sequência:</span>
                      <div className="font-semibold">{selectedAgent.stats.streakDays} dias</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Conquistas</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedAgent.badges.map((badge) => (
                      <div key={badge.id} className={`px-2 py-1 rounded-full text-xs ${getRarityColor(badge.rarity)}`}>
                        <i className={`${badge.icon} mr-1`}></i>
                        {badge.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}