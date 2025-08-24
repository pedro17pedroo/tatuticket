import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, BookOpen, Eye, X } from "lucide-react";
import { authService } from "@/lib/auth";
import type { KnowledgeArticle } from "@shared/schema";

interface KnowledgeBaseSearchProps {
  onClose?: () => void;
}

export function KnowledgeBaseSearch({ onClose }: KnowledgeBaseSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const tenantId = authService.getTenantId();

  const { data: searchResults, isLoading, refetch } = useQuery<KnowledgeArticle[]>({
    queryKey: ['/api/knowledge-articles/search', tenantId, searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const response = await fetch(`/api/knowledge-articles/search?tenantId=${tenantId}&query=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error('Falha na busca');
      return response.json();
    },
    enabled: false // Only search when user submits
  });

  // Increment article view count
  const incrementViewMutation = useMutation({
    mutationFn: async (articleId: string) => {
      const response = await fetch(`/api/knowledge-articles/${articleId}/view`, {
        method: 'PUT',
      });
      if (!response.ok) throw new Error('Failed to increment view');
      return response.json();
    },
    onSuccess: () => {
      // Refetch search results to update view count
      refetch();
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setHasSearched(true);
      refetch();
    }
  };

  const handleViewArticle = (article: KnowledgeArticle) => {
    setSelectedArticle(article);
    setIsArticleModalOpen(true);
    // Increment view count
    incrementViewMutation.mutate(article.id);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      published: { label: "Publicado", variant: "default" },
      draft: { label: "Rascunho", variant: "secondary" },
      archived: { label: "Arquivado", variant: "outline" },
    };
    
    const statusInfo = statusMap[status] || { label: status, variant: "default" };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold text-gray-900">Base de Conhecimento</h2>
        </div>
        {onClose && (
          <Button variant="ghost" onClick={onClose} data-testid="button-close-knowledge-base">
            ✕
          </Button>
        )}
      </div>

      {/* Search Form */}
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="flex space-x-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Digite sua dúvida ou palavras-chave..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-base"
                data-testid="input-knowledge-search"
              />
            </div>
            <Button 
              type="submit" 
              disabled={!searchQuery.trim() || isLoading}
              data-testid="button-search-knowledge"
            >
              <Search className="h-4 w-4 mr-2" />
              {isLoading ? 'Buscando...' : 'Buscar'}
            </Button>
          </form>
          <p className="text-sm text-gray-500 mt-2">
            Busque por problemas comuns, tutoriais e guias de uso do sistema
          </p>
        </CardContent>
      </Card>

      {/* Search Results */}
      {hasSearched && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Resultados da Busca {searchQuery && `para "${searchQuery}"`}
          </h3>
          
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-3/4 mb-3" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : searchResults && searchResults.length > 0 ? (
            <div className="space-y-4">
              {searchResults.map((article) => (
                <Card key={article.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="text-lg font-semibold text-gray-900 hover:text-primary cursor-pointer">
                        {article.title}
                      </h4>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(article.status)}
                        <div className="flex items-center text-sm text-gray-500">
                          <Eye className="h-4 w-4 mr-1" />
                          {article.viewCount}
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {article.content.length > 200 
                        ? `${article.content.substring(0, 200)}...` 
                        : article.content
                      }
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        Atualizado em {new Date(article.updatedAt || article.createdAt!).toLocaleDateString('pt-BR')}
                      </span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewArticle(article)}
                        data-testid={`button-view-article-${article.id}`}
                      >
                        <BookOpen className="h-4 w-4 mr-2" />
                        Ler Artigo
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : hasSearched ? (
            <Card>
              <CardContent className="p-8 text-center">
                <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum artigo encontrado
                </h3>
                <p className="text-gray-500 mb-4">
                  Não encontramos artigos relacionados à sua busca por "{searchQuery}".
                </p>
                <p className="text-sm text-gray-400">
                  Tente usar palavras-chave diferentes ou criar um ticket para suporte personalizado.
                </p>
                <Button 
                  className="mt-4" 
                  onClick={() => setSearchQuery("")}
                  data-testid="button-clear-search"
                >
                  Nova Busca
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}

      {/* Popular Articles */}
      {!hasSearched && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Artigos Mais Acessados
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Como criar um ticket de suporte</h4>
                <p className="text-sm text-gray-600 mb-3">Guia passo a passo para criar sua primeira solicitação...</p>
                <div className="flex items-center justify-between">
                  <Badge variant="default">Tutorial</Badge>
                  <div className="flex items-center text-sm text-gray-500">
                    <Eye className="h-4 w-4 mr-1" />
                    1.2k
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Entendendo SLAs e prazos</h4>
                <p className="text-sm text-gray-600 mb-3">Saiba como funcionam os tempos de resposta e resolução...</p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">FAQ</Badge>
                  <div className="flex items-center text-sm text-gray-500">
                    <Eye className="h-4 w-4 mr-1" />
                    890
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Article View Modal */}
      <Dialog open={isArticleModalOpen} onOpenChange={setIsArticleModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold text-gray-900">
                {selectedArticle?.title}
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsArticleModalOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          
          {selectedArticle && (
            <div className="space-y-6">
              {/* Article Meta */}
              <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedArticle.status)}
                  {selectedArticle.isPublic ? (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Público
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-orange-600 border-orange-600">
                      Privado
                    </Badge>
                  )}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Eye className="h-4 w-4 mr-1" />
                  {selectedArticle.viewCount || 0} visualizações
                </div>
                <span className="text-sm text-gray-500">
                  Atualizado em {new Date(selectedArticle.updatedAt || selectedArticle.createdAt!).toLocaleDateString('pt-BR')}
                </span>
              </div>

              {/* Article Content */}
              <div className="prose prose-gray max-w-none">
                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                  {selectedArticle.content}
                </div>
              </div>

              {/* Article Actions */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">
                    Este artigo foi útil?
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      👍 Sim
                    </Button>
                    <Button variant="outline" size="sm">
                      👎 Não
                    </Button>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setIsArticleModalOpen(false)}
                >
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}