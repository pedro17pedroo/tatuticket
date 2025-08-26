import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichEditor } from "@/components/ui/rich-editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { BookOpen, Plus, Edit, Trash2, Eye, Globe, Lock, Search, FileText, Users, TrendingUp, Clock, CheckCircle, XCircle, History } from "lucide-react";
import { authService } from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";
import type { KnowledgeArticle } from "@shared/schema";

interface ArticleFormData {
  title: string;
  content: string;
  slug: string;
  status: string;
  isPublic: boolean;
  changeNote?: string;
}

interface ApprovalWorkflow {
  id: string;
  resourceId: string;
  requesterUsername: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  comment?: string;
}

interface KnowledgeStats {
  total: number;
  published: number;
  draft: number;
  archived: number;
  totalViews: number;
}

export function KnowledgeManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<KnowledgeArticle | null>(null);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ArticleFormData>({
    title: "",
    content: "",
    slug: "",
    status: "draft",
    isPublic: false,
    changeNote: ""
  });

  const tenantId = authService.getTenantId();
  const currentUser = authService.getCurrentUser();

  // Fetch articles
  const { data: articles, isLoading: isLoadingArticles, refetch } = useQuery<KnowledgeArticle[]>({
    queryKey: ['/api/knowledge-articles', tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/knowledge-articles?tenantId=${tenantId}`);
      if (!response.ok) throw new Error('Failed to fetch articles');
      return response.json();
    },
    enabled: !!tenantId,
  });

  // Create article mutation
  const createArticleMutation = useMutation({
    mutationFn: async (articleData: any) => {
      const response = await fetch('/api/knowledge-articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...articleData,
          tenantId,
          authorId: currentUser?.id,
        }),
      });
      if (!response.ok) throw new Error('Failed to create article');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Artigo criado com sucesso!" });
      setIsCreateDialogOpen(false);
      resetForm();
      refetch();
    },
    onError: () => {
      toast({ title: "Erro ao criar artigo", variant: "destructive" });
    },
  });

  // Update article mutation
  const updateArticleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/knowledge-articles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update article');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Artigo atualizado com sucesso!" });
      setIsEditDialogOpen(false);
      setEditingArticle(null);
      resetForm();
      refetch();
    },
    onError: () => {
      toast({ title: "Erro ao atualizar artigo", variant: "destructive" });
    },
  });

  // Delete article mutation
  const deleteArticleMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/knowledge-articles/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete article');
    },
    onSuccess: () => {
      toast({ title: "Artigo excluído com sucesso!" });
      refetch();
    },
    onError: () => {
      toast({ title: "Erro ao excluir artigo", variant: "destructive" });
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await fetch(`/api/knowledge-articles/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Status atualizado com sucesso!" });
      refetch();
    },
    onError: () => {
      toast({ title: "Erro ao atualizar status", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      slug: "",
      status: "draft",
      isPublic: false
    });
  };

  const handleEdit = (article: KnowledgeArticle) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      content: article.content,
      slug: article.slug,
      status: article.status,
      isPublic: article.isPublic || false
    });
    setIsEditDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.content) {
      toast({ title: "Título e conteúdo são obrigatórios", variant: "destructive" });
      return;
    }

    const slug = formData.slug || formData.title.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-');

    const articleData = {
      ...formData,
      slug
    };

    if (editingArticle) {
      updateArticleMutation.mutate({ id: editingArticle.id, data: articleData });
    } else {
      createArticleMutation.mutate(articleData);
    }
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

  // Filter articles
  const filteredArticles = articles?.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === "all" || article.status === selectedStatus;
    return matchesSearch && matchesStatus;
  }) || [];

  // Calculate stats
  const stats: KnowledgeStats = articles ? {
    total: articles.length,
    published: articles.filter(a => a.status === 'published').length,
    draft: articles.filter(a => a.status === 'draft').length,
    archived: articles.filter(a => a.status === 'archived').length,
    totalViews: articles.reduce((sum, a) => sum + (a.viewCount || 0), 0)
  } : { total: 0, published: 0, draft: 0, archived: 0, totalViews: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <BookOpen className="h-6 w-6 mr-2 text-primary" />
            Base de Conhecimento
          </h1>
          <p className="text-gray-600">Gerencie artigos e documentação da sua organização</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Artigo
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Publicados</p>
                <p className="text-2xl font-bold text-green-600">{stats.published}</p>
              </div>
              <Globe className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Rascunhos</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.draft}</p>
              </div>
              <Edit className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Arquivados</p>
                <p className="text-2xl font-bold text-gray-600">{stats.archived}</p>
              </div>
              <Lock className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Visualizações</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalViews}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar artigos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="published">Publicado</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="archived">Arquivado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Articles List */}
      <Card>
        <CardHeader>
          <CardTitle>Artigos ({filteredArticles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingArticles ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredArticles.length > 0 ? (
            <div className="space-y-4">
              {filteredArticles.map((article) => (
                <div key={article.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{article.title}</h3>
                        {getStatusBadge(article.status)}
                        {article.isPublic ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <Globe className="h-3 w-3 mr-1" />
                            Público
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-orange-600 border-orange-600">
                            <Lock className="h-3 w-3 mr-1" />
                            Privado
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {article.content.length > 150 
                          ? `${article.content.substring(0, 150)}...` 
                          : article.content
                        }
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Eye className="h-4 w-4 mr-1" />
                          {article.viewCount || 0} visualizações
                        </span>
                        <span>
                          Atualizado em {new Date(article.updatedAt || article.createdAt!).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {article.status === 'draft' && (
                        <Button
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({ id: article.id, status: 'published' })}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Globe className="h-4 w-4 mr-1" />
                          Publicar
                        </Button>
                      )}
                      {article.status === 'published' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatusMutation.mutate({ id: article.id, status: 'archived' })}
                        >
                          <Lock className="h-4 w-4 mr-1" />
                          Arquivar
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(article)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteArticleMutation.mutate(article.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery || selectedStatus !== "all" ? "Nenhum artigo encontrado" : "Nenhum artigo criado"}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchQuery || selectedStatus !== "all" 
                  ? "Tente ajustar os filtros ou busca."
                  : "Crie o primeiro artigo para começar a construir sua base de conhecimento."
                }
              </p>
              {!searchQuery && selectedStatus === "all" && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Artigo
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingArticle ? "Editar Artigo" : "Novo Artigo"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Título do artigo"
            />
          </div>
          
          <div>
            <Label htmlFor="slug">Slug (URL)</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="url-amigavel (deixe vazio para gerar automaticamente)"
            />
          </div>

          <div>
            <Label htmlFor="content">Conteúdo *</Label>
            <RichEditor
              content={formData.content}
              onChange={(content) => setFormData({ ...formData, content })}
              className="mt-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="pending_approval">Aguardando Aprovação</SelectItem>
                  <SelectItem value="published">Publicado</SelectItem>
                  <SelectItem value="archived">Arquivado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2 pt-6">
              <Switch
                id="isPublic"
                checked={formData.isPublic}
                onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
              />
              <Label htmlFor="isPublic">Público (visível para clientes)</Label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setIsEditDialogOpen(false);
                setEditingArticle(null);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createArticleMutation.isPending || updateArticleMutation.isPending}
            >
              {editingArticle ? "Atualizar" : "Criar"} Artigo
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Artigo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Título *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Título do artigo"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-slug">Slug (URL)</Label>
              <Input
                id="edit-slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="url-amigavel"
              />
            </div>

            <div>
              <Label htmlFor="edit-content">Conteúdo *</Label>
              <Textarea
                id="edit-content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Conteúdo do artigo"
                rows={12}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="published">Publicado</SelectItem>
                    <SelectItem value="archived">Arquivado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2 pt-6">
                <Switch
                  id="edit-isPublic"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
                />
                <Label htmlFor="edit-isPublic">Público (visível para clientes)</Label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingArticle(null);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={updateArticleMutation.isPending}
              >
                Atualizar Artigo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}