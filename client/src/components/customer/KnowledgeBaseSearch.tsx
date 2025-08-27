import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Search,
  BookOpen,
  Star,
  ThumbsUp,
  ThumbsDown,
  Filter,
  ArrowUpDown,
  Eye,
  Clock,
  Tag,
  User,
  HelpCircle,
  FileText,
  Video,
  Download,
  Share,
  Bookmark,
  MessageCircle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface Article {
  id: string;
  title: string;
  content: string;
  summary: string;
  category: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  type: 'article' | 'video' | 'tutorial' | 'faq';
  rating: number;
  views: number;
  likes: number;
  dislikes: number;
  author: string;
  createdAt: Date;
  updatedAt: Date;
  featured: boolean;
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
  }>;
}

interface SearchFilters {
  category: string;
  difficulty: string;
  type: string;
  rating: number;
  sortBy: 'relevance' | 'rating' | 'views' | 'date';
  sortOrder: 'asc' | 'desc';
}

const MOCK_ARTICLES: Article[] = [
  {
    id: '1',
    title: 'Como configurar sua conta pela primeira vez',
    content: 'Guia completo para configuração inicial da conta...',
    summary: 'Aprenda a configurar sua conta TatuTicket do zero com este guia passo a passo.',
    category: 'Getting Started',
    tags: ['configuração', 'primeiros passos', 'conta'],
    difficulty: 'beginner',
    type: 'tutorial',
    rating: 4.8,
    views: 1250,
    likes: 98,
    dislikes: 5,
    author: 'Equipe TatuTicket',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
    featured: true,
    attachments: [
      { name: 'Configuração-conta.pdf', url: '/files/config.pdf', type: 'pdf' }
    ]
  },
  {
    id: '2',
    title: 'Gestão avançada de SLAs',
    content: 'Como configurar e gerenciar SLAs complexos...',
    summary: 'Domine a configuração de SLAs para diferentes tipos de clientes e serviços.',
    category: 'SLA Management',
    tags: ['sla', 'configuração', 'avançado'],
    difficulty: 'advanced',
    type: 'article',
    rating: 4.6,
    views: 850,
    likes: 67,
    dislikes: 8,
    author: 'João Silva',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-18'),
    featured: false
  },
  {
    id: '3',
    title: 'Integração com Slack - Tutorial em vídeo',
    content: 'Vídeo mostrando como integrar o TatuTicket com Slack...',
    summary: 'Vídeo passo a passo para configurar notificações no Slack.',
    category: 'Integrations',
    tags: ['slack', 'integração', 'notificações'],
    difficulty: 'intermediate',
    type: 'video',
    rating: 4.9,
    views: 2100,
    likes: 156,
    dislikes: 3,
    author: 'Maria Santos',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05'),
    featured: true
  },
  {
    id: '4',
    title: 'FAQ - Problemas comuns de login',
    content: 'Respostas para as dúvidas mais frequentes sobre login...',
    summary: 'Soluções rápidas para os problemas mais comuns de autenticação.',
    category: 'Authentication',
    tags: ['login', 'senha', 'autenticação'],
    difficulty: 'beginner',
    type: 'faq',
    rating: 4.4,
    views: 3200,
    likes: 89,
    dislikes: 12,
    author: 'Suporte TatuTicket',
    createdAt: new Date('2023-12-20'),
    updatedAt: new Date('2024-01-15'),
    featured: false
  },
  {
    id: '5',
    title: 'Automatização de tickets com IA',
    content: 'Como usar IA para automatizar processos de tickets...',
    summary: 'Descubra como a IA pode otimizar seu fluxo de trabalho de suporte.',
    category: 'AI & Automation',
    tags: ['ia', 'automação', 'tickets'],
    difficulty: 'advanced',
    type: 'article',
    rating: 4.7,
    views: 1800,
    likes: 134,
    dislikes: 9,
    author: 'Dr. Carlos Tech',
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-22'),
    featured: true
  }
];

const CATEGORIES = [
  'All Categories',
  'Getting Started',
  'SLA Management', 
  'Integrations',
  'Authentication',
  'AI & Automation',
  'Billing',
  'Troubleshooting'
];

export function KnowledgeBaseSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({
    category: 'All Categories',
    difficulty: 'all',
    type: 'all',
    rating: 0,
    sortBy: 'relevance',
    sortOrder: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Search and filter articles
  const filteredArticles = useMemo(() => {
    let results = MOCK_ARTICLES;

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(article =>
        article.title.toLowerCase().includes(query) ||
        article.content.toLowerCase().includes(query) ||
        article.summary.toLowerCase().includes(query) ||
        article.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply filters
    if (filters.category !== 'All Categories') {
      results = results.filter(article => article.category === filters.category);
    }

    if (filters.difficulty !== 'all') {
      results = results.filter(article => article.difficulty === filters.difficulty);
    }

    if (filters.type !== 'all') {
      results = results.filter(article => article.type === filters.type);
    }

    if (filters.rating > 0) {
      results = results.filter(article => article.rating >= filters.rating);
    }

    // Apply sorting
    results.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'rating':
          comparison = a.rating - b.rating;
          break;
        case 'views':
          comparison = a.views - b.views;
          break;
        case 'date':
          comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
          break;
        default:
          // Relevance-based sorting (mock implementation)
          comparison = a.featured ? -1 : 1;
      }

      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    return results;
  }, [searchQuery, filters]);

  // Rate article mutation
  const rateArticleMutation = useMutation({
    mutationFn: async ({ articleId, isLike }: { articleId: string; isLike: boolean }) => {
      const response = await fetch(`/api/knowledge-base/${articleId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: isLike ? 'like' : 'dislike' }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to rate article');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Thank you!',
        description: 'Your feedback helps us improve our content.',
      });
    },
  });

  // View article mutation (track analytics)
  const viewArticleMutation = useMutation({
    mutationFn: async (articleId: string) => {
      const response = await fetch(`/api/knowledge-base/${articleId}/view`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to track view');
      }
      
      return response.json();
    },
  });

  const handleArticleClick = (article: Article) => {
    setSelectedArticle(article);
    viewArticleMutation.mutate(article.id);
  };

  const handleRateArticle = (articleId: string, isLike: boolean) => {
    rateArticleMutation.mutate({ articleId, isLike });
  };

  const resetFilters = () => {
    setFilters({
      category: 'All Categories',
      difficulty: 'all',
      type: 'all',
      rating: 0,
      sortBy: 'relevance',
      sortOrder: 'desc'
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'tutorial': return <BookOpen className="h-4 w-4" />;
      case 'faq': return <HelpCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500';
      case 'intermediate': return 'bg-yellow-500';
      case 'advanced': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Knowledge Base</h2>
          <p className="text-muted-foreground">Find answers and learn how to use TatuTicket</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search articles, tutorials, and FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-knowledge"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            data-testid="button-toggle-filters"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Category</Label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    className="w-full p-2 border rounded-md"
                    data-testid="select-category-filter"
                  >
                    {CATEGORIES.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <Label>Difficulty</Label>
                  <select
                    value={filters.difficulty}
                    onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
                    className="w-full p-2 border rounded-md"
                    data-testid="select-difficulty-filter"
                  >
                    <option value="all">All Levels</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                
                <div>
                  <Label>Content Type</Label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    className="w-full p-2 border rounded-md"
                    data-testid="select-type-filter"
                  >
                    <option value="all">All Types</option>
                    <option value="article">Articles</option>
                    <option value="video">Videos</option>
                    <option value="tutorial">Tutorials</option>
                    <option value="faq">FAQs</option>
                  </select>
                </div>
                
                <div>
                  <Label>Sort By</Label>
                  <select
                    value={`${filters.sortBy}-${filters.sortOrder}`}
                    onChange={(e) => {
                      const [sortBy, sortOrder] = e.target.value.split('-');
                      setFilters({ ...filters, sortBy: sortBy as any, sortOrder: sortOrder as any });
                    }}
                    className="w-full p-2 border rounded-md"
                    data-testid="select-sort-filter"
                  >
                    <option value="relevance-desc">Most Relevant</option>
                    <option value="rating-desc">Highest Rated</option>
                    <option value="views-desc">Most Viewed</option>
                    <option value="date-desc">Most Recent</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end mt-4">
                <Button variant="outline" onClick={resetFilters} data-testid="button-reset-filters">
                  Reset Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Featured Articles */}
      {!searchQuery && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Featured Articles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MOCK_ARTICLES.filter(article => article.featured).map((article) => (
              <Card key={article.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(article.type)}
                      <Badge variant="secondary">{article.type}</Badge>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${getDifficultyColor(article.difficulty)}`} />
                  </div>
                  <CardTitle className="text-lg line-clamp-2">{article.title}</CardTitle>
                  <p className="text-sm text-muted-foreground line-clamp-2">{article.summary}</p>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{article.rating}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{article.views}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    className="w-full mt-4"
                    variant="outline"
                    onClick={() => handleArticleClick(article)}
                    data-testid={`button-view-article-${article.id}`}
                  >
                    Read Article
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {searchQuery ? `Search Results (${filteredArticles.length})` : 'All Articles'}
          </h3>
        </div>
        
        <div className="space-y-4">
          {filteredArticles.map((article) => (
            <Card key={article.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getTypeIcon(article.type)}
                      <Badge variant="secondary">{article.type}</Badge>
                      <Badge variant="outline">{article.category}</Badge>
                      <div className={`w-2 h-2 rounded-full ${getDifficultyColor(article.difficulty)}`} />
                    </div>
                    
                    <h4 className="text-lg font-semibold mb-2">{article.title}</h4>
                    <p className="text-muted-foreground mb-3 line-clamp-2">{article.summary}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{article.rating}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{article.views} views</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{article.updatedAt.toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{article.author}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {article.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="ml-4 flex flex-col gap-2">
                    <Button
                      onClick={() => handleArticleClick(article)}
                      data-testid={`button-view-article-${article.id}`}
                    >
                      View
                    </Button>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRateArticle(article.id, true);
                        }}
                        data-testid={`button-like-article-${article.id}`}
                      >
                        <ThumbsUp className="h-4 w-4" />
                        <span className="ml-1">{article.likes}</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRateArticle(article.id, false);
                        }}
                        data-testid={`button-dislike-article-${article.id}`}
                      >
                        <ThumbsDown className="h-4 w-4" />
                        <span className="ml-1">{article.dislikes}</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Article Detail Dialog */}
      <Dialog open={!!selectedArticle} onOpenChange={() => setSelectedArticle(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedArticle && (
            <div>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  {getTypeIcon(selectedArticle.type)}
                  <Badge variant="secondary">{selectedArticle.type}</Badge>
                  <Badge variant="outline">{selectedArticle.category}</Badge>
                  <div className={`w-2 h-2 rounded-full ${getDifficultyColor(selectedArticle.difficulty)}`} />
                </div>
                <DialogTitle className="text-xl">{selectedArticle.title}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{selectedArticle.rating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span>{selectedArticle.views} views</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{selectedArticle.author}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>Updated {selectedArticle.updatedAt.toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="prose max-w-none">
                  <p className="text-lg text-muted-foreground mb-4">{selectedArticle.summary}</p>
                  <div className="whitespace-pre-wrap">{selectedArticle.content}</div>
                </div>
                
                {selectedArticle.attachments && selectedArticle.attachments.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Attachments</h4>
                    <div className="space-y-2">
                      {selectedArticle.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 border rounded">
                          <Download className="h-4 w-4" />
                          <span>{attachment.name}</span>
                          <Button size="sm" variant="outline">
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="flex flex-wrap gap-1">
                    {selectedArticle.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleRateArticle(selectedArticle.id, true)}
                    >
                      <ThumbsUp className="h-4 w-4 mr-1" />
                      Helpful ({selectedArticle.likes})
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleRateArticle(selectedArticle.id, false)}
                    >
                      <ThumbsDown className="h-4 w-4 mr-1" />
                      Not Helpful ({selectedArticle.dislikes})
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}