import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { authService } from "@/lib/auth";
import type { Department, InsertDepartment } from "@shared/schema";

interface DepartmentFormData {
  name: string;
  description: string;
  managerEmail: string;
  slaConfig: {
    criticalHours: number;
    highHours: number;
    mediumHours: number;
    lowHours: number;
  };
  status: "active" | "inactive";
}

export function DepartmentManagement() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const tenantId = authService.getTenantId();
  
  const [formData, setFormData] = useState<DepartmentFormData>({
    name: "",
    description: "",
    managerEmail: "",
    slaConfig: {
      criticalHours: 2,
      highHours: 8,
      mediumHours: 24,
      lowHours: 72
    },
    status: "active"
  });

  // Fetch departments
  const { data: departments = [], isLoading: loadingDepartments } = useQuery<Department[]>({
    queryKey: ['/api/departments', tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/departments?tenantId=${tenantId}`);
      return response.json();
    },
    enabled: !!tenantId,
  });

  // Create department mutation
  const createDepartmentMutation = useMutation({
    mutationFn: async (data: DepartmentFormData) => {
      const departmentData: Partial<InsertDepartment> = {
        name: data.name,
        description: data.description,
        managerEmail: data.managerEmail,
        slaConfig: data.slaConfig,
        status: data.status,
        tenantId: tenantId!
      };
      
      const response = await apiRequest("POST", "/api/departments", departmentData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/departments'] });
      toast({
        title: "Departamento criado!",
        description: "O departamento foi criado com sucesso.",
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar departamento",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  // Update department mutation
  const updateDepartmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: DepartmentFormData }) => {
      const response = await apiRequest("PATCH", `/api/departments/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/departments'] });
      toast({
        title: "Departamento atualizado!",
        description: "As alterações foram salvas com sucesso.",
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar departamento",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  // Delete department mutation
  const deleteDepartmentMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/departments/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/departments'] });
      toast({
        title: "Departamento removido!",
        description: "O departamento foi removido com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover departamento",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (editingDepartment) {
        await updateDepartmentMutation.mutateAsync({ 
          id: editingDepartment.id, 
          data: formData 
        });
      } else {
        await createDepartmentMutation.mutateAsync(formData);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsCreateOpen(false);
    setEditingDepartment(null);
    setFormData({
      name: "",
      description: "",
      managerEmail: "",
      slaConfig: {
        criticalHours: 2,
        highHours: 8,
        mediumHours: 24,
        lowHours: 72
      },
      status: "active"
    });
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      description: department.description || "",
      managerEmail: department.managerEmail || "",
      slaConfig: department.slaConfig || {
        criticalHours: 2,
        highHours: 8,
        mediumHours: 24,
        lowHours: 72
      },
      status: department.status as "active" | "inactive"
    });
    setIsCreateOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja remover este departamento? Esta ação não pode ser desfeita.")) {
      await deleteDepartmentMutation.mutateAsync(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Departamentos</h2>
          <p className="text-gray-600">Gerencie departamentos e suas configurações de SLA</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} data-testid="button-create-department">
          <i className="fas fa-plus mr-2"></i>
          Novo Departamento
        </Button>
      </div>

      {/* Department Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loadingDepartments ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))
        ) : departments.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-12 text-center">
              <i className="fas fa-building text-4xl text-gray-300 mb-4"></i>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum departamento encontrado</h3>
              <p className="text-gray-600 mb-6">Crie departamentos para organizar sua equipe e configurar SLAs específicos.</p>
              <Button onClick={() => setIsCreateOpen(true)} data-testid="button-create-first-department">
                <i className="fas fa-plus mr-2"></i>
                Criar Primeiro Departamento
              </Button>
            </CardContent>
          </Card>
        ) : (
          departments.map((department) => (
            <Card key={department.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{department.name}</CardTitle>
                    <Badge variant={department.status === 'active' ? 'default' : 'secondary'}>
                      {department.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(department)}
                      data-testid={`button-edit-${department.id}`}
                    >
                      <i className="fas fa-edit"></i>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(department.id)}
                      data-testid={`button-delete-${department.id}`}
                    >
                      <i className="fas fa-trash text-red-600"></i>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {department.description && (
                  <p className="text-gray-600 text-sm mb-4">{department.description}</p>
                )}
                
                {department.managerEmail && (
                  <div className="flex items-center text-sm text-gray-600 mb-3">
                    <i className="fas fa-user-tie mr-2"></i>
                    {department.managerEmail}
                  </div>
                )}

                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-900">SLAs Configurados:</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-red-600">Crítico:</span>
                      <span>{department.slaConfig?.criticalHours || 2}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-orange-600">Alto:</span>
                      <span>{department.slaConfig?.highHours || 8}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-600">Médio:</span>
                      <span>{department.slaConfig?.mediumHours || 24}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-600">Baixo:</span>
                      <span>{department.slaConfig?.lowHours || 72}h</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Department Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingDepartment ? 'Editar Departamento' : 'Novo Departamento'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Suporte Técnico"
                  required
                  data-testid="input-department-name"
                />
              </div>
              
              <div>
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
                >
                  <SelectTrigger data-testid="select-department-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva as responsabilidades deste departamento..."
                rows={3}
                data-testid="textarea-department-description"
              />
            </div>

            <div>
              <Label htmlFor="managerEmail">Email do Gerente</Label>
              <Input
                id="managerEmail"
                type="email"
                value={formData.managerEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, managerEmail: e.target.value }))}
                placeholder="gerente@empresa.com"
                data-testid="input-manager-email"
              />
            </div>

            {/* SLA Configuration */}
            <div>
              <Label className="text-base font-semibold">Configurações de SLA (em horas)</Label>
              <div className="grid md:grid-cols-2 gap-4 mt-3">
                <div>
                  <Label htmlFor="criticalHours" className="text-sm text-red-600">Prioridade Crítica</Label>
                  <Input
                    id="criticalHours"
                    type="number"
                    min="1"
                    value={formData.slaConfig.criticalHours}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      slaConfig: { ...prev.slaConfig, criticalHours: Number(e.target.value) }
                    }))}
                    data-testid="input-critical-hours"
                  />
                </div>
                <div>
                  <Label htmlFor="highHours" className="text-sm text-orange-600">Prioridade Alta</Label>
                  <Input
                    id="highHours"
                    type="number"
                    min="1"
                    value={formData.slaConfig.highHours}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      slaConfig: { ...prev.slaConfig, highHours: Number(e.target.value) }
                    }))}
                    data-testid="input-high-hours"
                  />
                </div>
                <div>
                  <Label htmlFor="mediumHours" className="text-sm text-yellow-600">Prioridade Média</Label>
                  <Input
                    id="mediumHours"
                    type="number"
                    min="1"
                    value={formData.slaConfig.mediumHours}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      slaConfig: { ...prev.slaConfig, mediumHours: Number(e.target.value) }
                    }))}
                    data-testid="input-medium-hours"
                  />
                </div>
                <div>
                  <Label htmlFor="lowHours" className="text-sm text-green-600">Prioridade Baixa</Label>
                  <Input
                    id="lowHours"
                    type="number"
                    min="1"
                    value={formData.slaConfig.lowHours}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      slaConfig: { ...prev.slaConfig, lowHours: Number(e.target.value) }
                    }))}
                    data-testid="input-low-hours"
                  />
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1" data-testid="button-save-department">
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Salvando...
                  </>
                ) : editingDepartment ? (
                  'Salvar Alterações'
                ) : (
                  'Criar Departamento'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}