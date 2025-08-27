import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  BookOpen,
  Star,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  Filter,
  Clock,
  User,
  Tag,
  TrendingUp,
  Eye
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

// Mock knowledge base data
const MOCK_ARTICLES = [
  {
    id: '1',
    title: 'Como criar um novo ticket de suporte',
    content: 'Para criar um novo ticket, acesse o painel principal e clique em "Novo Ticket". Preencha as informações necessárias...',
    category: 'Tickets',
    tags: ['tutorial', 'básico', 'tickets'],
    views: 1245,
    rating: 4.8,
    votes: 156,
    author: 'Equipe TatuTicket',
    lastUpdated: new Date('2024-01-15'),
    helpful: true
  },
  {
    id: '2',
    title: 'Problemas de login e recuperação de senha',
    content: 'Se você está enfrentando problemas para acessar sua conta, siga estes passos para resolver...',
    category: 'Conta',
    tags: ['login', 'senha', 'acesso'],
    views: 890,
    rating: 4.6,
    votes: 98,
    author: 'Suporte TatuTicket',
    lastUpdated: new Date('2024-01-10'),
    helpful: false
  },
  {
    id: '3',
    title: 'Configurando notificações por email',
    content: 'Aprenda como personalizar suas notificações por email para receber apenas as informações relevantes...',
    category: 'Configurações',
    tags: ['notificações', 'email', 'configuração'],
    views: 567,
    rating: 4.9,
    votes: 45,
    author: 'Ana Silva',
    lastUpdated: new Date('2024-01-08'),
    helpful: true
  },
  {
    id: '4',
    title: 'Entendendo os níveis de prioridade',
    content: 'Os tickets são categorizados em diferentes níveis de prioridade. Aqui você aprende quando usar cada um...',
    category: 'Tickets',
    tags: ['prioridade', 'categorização', 'urgência'],
    views: 423,
    rating: 4.7,
    votes: 67,
    author: 'Carlos Santos',
    lastUpdated: new Date('2024-01-05'),
    helpful: false
  },
  {
    id: '5',
    title: 'Integração com Slack - Guia completo',
    content: 'Configure a integração com Slack para receber notificações de tickets diretamente no seu workspace...',
    category: 'Integrações',
    tags: ['slack', 'integração', 'notificações'],
    views: 789,
    rating: 4.5,
    votes: 89,
    author: 'Equipe TatuTicket',
    lastUpdated: new Date('2024-01-12'),
    helpful: true
  }
];

const CATEGORIES = [
  { name: 'Todos', count: 25 },
  { name: 'Tickets', count: 8 },
  { name: 'Conta', count: 5 },
  { name: 'Configurações', count: 7 },
  { name: 'Integrações', count: 3 },
  { name: 'API', count: 2 }
];

export function KnowledgeBaseSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [sortBy, setSortBy] = useState('relevance');
  const { toast } = useToast();

  const { data: articles = MOCK_ARTICLES, isLoading } = useQuery({
    queryKey: ['/api/knowledge-articles', searchQuery, selectedCategory, sortBy],
    enabled: true,
  });

  const handleVote = (articleId: string, type: 'up' | 'down') => {
    toast({ 
      title: 'Obrigado pelo feedback!',
      description: type === 'up' ? 'Marcado como útil' : 'Feedback registrado'
    });
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = searchQuery === '' || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'Todos' || article.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const sortedArticles = filteredArticles.sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.rating - a.rating;
      case 'views':
        return b.views - a.views;
      case 'recent':
        return b.lastUpdated.getTime() - a.lastUpdated.getTime();
      default:
        return 0; // relevance (default order)
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="knowledge-base-search">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight flex items-center justify-center">
          <BookOpen className="w-10 h-10 mr-3 text-primary" />
          Base de Conhecimento
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Encontre respostas rápidas para suas dúvidas
        </p>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar artigos, tutoriais ou dúvidas..."
                className="pl-10"
                data-testid="input-search-knowledge"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Categorias</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {CATEGORIES.map((category) => (
                <Button
                  key={category.name}
                  variant={selectedCategory === category.name ? 'default' : 'ghost'}
                  className="w-full justify-between"
                  onClick={() => setSelectedCategory(category.name)}
                  data-testid={`category-${category.name.toLowerCase()}`}
                >
                  <span>{category.name}</span>
                  <Badge variant="secondary">{category.count}</Badge>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Sort Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ordenar por</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { value: 'relevance', label: 'Relevância' },
                { value: 'rating', label: 'Avaliação' },
                { value: 'views', label: 'Visualizações' },
                { value: 'recent', label: 'Mais recente' },
              ].map((option) => (
                <Button
                  key={option.value}
                  variant={sortBy === option.value ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setSortBy(option.value)}
                  data-testid={`sort-${option.value}`}
                >
                  {option.label}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Popular Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tags Populares</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {['tutorial', 'login', 'configuração', 'tickets', 'integração', 'api'].map((tag) => (
                  <Badge 
                    key={tag} 
                    variant="outline" 
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                    onClick={() => setSearchQuery(tag)}
                    data-testid={`tag-${tag}`}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-4">
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">
              {searchQuery ? `Resultados para "${searchQuery}"` : 'Artigos Recentes'}
            </h2>
            <p className="text-muted-foreground">
              {sortedArticles.length} artigos encontrados
            </p>
          </div>

          {/* Articles List */}
          <div className="space-y-4">
            {sortedArticles.map((article) => (
              <Card key={article.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Article Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2 hover:text-primary cursor-pointer" data-testid={`article-title-${article.id}`}>
                          {article.title}
                        </h3>
                        <p className="text-muted-foreground line-clamp-2">
                          {article.content}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Article Meta */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span>{article.author}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{article.lastUpdated.toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Eye className="w-4 h-4" />
                          <span>{article.views} visualizações</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span>{article.rating}</span>
                        </div>
                        <Badge variant="outline">{article.category}</Badge>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {article.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">Este artigo foi útil?</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVote(article.id, 'up')}
                          className={article.helpful ? 'text-green-600' : ''}
                          data-testid={`thumbs-up-${article.id}`}
                        >
                          <ThumbsUp className="w-4 h-4 mr-1" />
                          Sim
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVote(article.id, 'down')}
                          className={!article.helpful ? 'text-red-600' : ''}
                          data-testid={`thumbs-down-${article.id}`}
                        >
                          <ThumbsDown className="w-4 h-4 mr-1" />
                          Não
                        </Button>
                      </div>
                      <Button variant="outline" size="sm" data-testid={`view-article-${article.id}`}>
                        Ler Artigo Completo
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* No Results */}
          {sortedArticles.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum artigo encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  Não encontramos artigos que correspondam à sua pesquisa.
                </p>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Tente:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Button variant="outline" size="sm" onClick={() => setSearchQuery('')}>
                      Ver todos os artigos
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setSelectedCategory('Todos')}>
                      Todas as categorias
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Help */}
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-6 h-6 text-blue-600" />
                <div>
                  <h3 className="font-medium text-blue-800 dark:text-blue-200">
                    Não encontrou o que procurava?
                  </h3>
                  <p className="text-sm text-blue-600 dark:text-blue-300 mb-3">
                    Nossa equipe de suporte está sempre pronta para ajudar!
                  </p>
                  <div className="flex space-x-2">
                    <Button size="sm" data-testid="button-create-ticket">
                      Criar Ticket
                    </Button>
                    <Button variant="outline" size="sm" data-testid="button-contact-support">
                      Falar com Suporte
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}