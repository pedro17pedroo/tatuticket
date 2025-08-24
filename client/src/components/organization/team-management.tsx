import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { authService } from "@/lib/auth";
import type { Team, Department, User, InsertTeam } from "@shared/schema";

interface TeamFormData {
  name: string;
  departmentId: string;
  leaderId?: string;
  maxCapacity: number;
  specialties: string[];
  status: "active" | "inactive";
}

const availableSpecialties = [
  "Suporte Técnico",
  "Desenvolvimento",
  "Infraestrutura",
  "Segurança",
  "Mobile",
  "Web",
  "DevOps",
  "QA",
  "UX/UI",
  "Vendas",
  "Financeiro",
  "RH",
  "Marketing"
];

export function TeamManagement() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const tenantId = authService.getTenantId();
  
  const [formData, setFormData] = useState<TeamFormData>({
    name: "",
    departmentId: "",
    leaderId: "",
    maxCapacity: 5,
    specialties: [],
    status: "active"
  });

  // Fetch teams with department and leader info
  const { data: teams = [], isLoading: loadingTeams } = useQuery<(Team & { department: Department; leader?: User })[]>({
    queryKey: ['/api/teams', tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/teams?tenantId=${tenantId}&include=department,leader`);
      return response.json();
    },
    enabled: !!tenantId,
  });

  // Fetch departments for dropdown
  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['/api/departments', tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/departments?tenantId=${tenantId}`);
      return response.json();
    },
    enabled: !!tenantId,
  });

  // Fetch users for team leader dropdown
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users', tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/users?tenantId=${tenantId}&role=agent,manager`);
      return response.json();
    },
    enabled: !!tenantId && (isCreateOpen || editingTeam),
  });

  // Create team mutation
  const createTeamMutation = useMutation({
    mutationFn: async (data: TeamFormData) => {
      const teamData: Partial<InsertTeam> = {
        name: data.name,
        departmentId: data.departmentId,
        leaderId: data.leaderId || undefined,
        maxCapacity: data.maxCapacity,
        specialties: data.specialties,
        status: data.status,
        tenantId: tenantId!
      };
      
      const response = await apiRequest("POST", "/api/teams", teamData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      toast({
        title: "Equipe criada!",
        description: "A equipe foi criada com sucesso.",
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar equipe",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  // Update team mutation
  const updateTeamMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TeamFormData }) => {
      const response = await apiRequest("PATCH", `/api/teams/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      toast({
        title: "Equipe atualizada!",
        description: "As alterações foram salvas com sucesso.",
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar equipe",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (editingTeam) {
        await updateTeamMutation.mutateAsync({ 
          id: editingTeam.id, 
          data: formData 
        });
      } else {
        await createTeamMutation.mutateAsync(formData);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsCreateOpen(false);
    setEditingTeam(null);
    setFormData({
      name: "",
      departmentId: "",
      leaderId: "",
      maxCapacity: 5,
      specialties: [],
      status: "active"
    });
  };

  const handleEdit = (team: Team) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      departmentId: team.departmentId,
      leaderId: team.leaderId || "",
      maxCapacity: team.maxCapacity || 5,
      specialties: team.specialties || [],
      status: team.status as "active" | "inactive"
    });
    setIsCreateOpen(true);
  };

  const toggleSpecialty = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Equipes</h2>
          <p className="text-gray-600">Gerencie equipes e suas especializações</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} data-testid="button-create-team">
          <i className="fas fa-users mr-2"></i>
          Nova Equipe
        </Button>
      </div>

      {/* Team Cards */}
      <div className="grid lg:grid-cols-2 gap-6">
        {loadingTeams ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))
        ) : teams.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-12 text-center">
              <i className="fas fa-users text-4xl text-gray-300 mb-4"></i>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma equipe encontrada</h3>
              <p className="text-gray-600 mb-6">Crie equipes para organizar seus agentes por especialização e departamento.</p>
              <Button onClick={() => setIsCreateOpen(true)} data-testid="button-create-first-team">
                <i className="fas fa-users mr-2"></i>
                Criar Primeira Equipe
              </Button>
            </CardContent>
          </Card>
        ) : (
          teams.map((team) => (
            <Card key={team.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center">
                      <i className="fas fa-users text-primary mr-2"></i>
                      {team.name}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{team.department.name}</p>
                  </div>
                  <div className="flex gap-1">
                    <Badge variant={team.status === 'active' ? 'default' : 'secondary'}>
                      {team.status === 'active' ? 'Ativa' : 'Inativa'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(team)}
                      data-testid={`button-edit-team-${team.id}`}
                    >
                      <i className="fas fa-edit"></i>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Team Leader */}
                {team.leader && (
                  <div className="flex items-center mb-4 p-3 bg-gray-50 rounded-lg">
                    <Avatar className="w-8 h-8 mr-3">
                      <AvatarFallback>
                        {team.leader.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium">{team.leader.username}</div>
                      <div className="text-xs text-gray-600">Líder da Equipe</div>
                    </div>
                  </div>
                )}

                {/* Capacity */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium">Capacidade:</span>
                  <Badge variant="outline">
                    {team.currentSize || 0} / {team.maxCapacity || 5} membros
                  </Badge>
                </div>

                {/* Specialties */}
                {team.specialties && team.specialties.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Especializações:</div>
                    <div className="flex flex-wrap gap-1">
                      {team.specialties.map((specialty, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    data-testid={`button-manage-members-${team.id}`}
                  >
                    <i className="fas fa-user-plus mr-1"></i>
                    Membros
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    data-testid={`button-view-tickets-${team.id}`}
                  >
                    <i className="fas fa-ticket-alt mr-1"></i>
                    Tickets
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Team Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTeam ? 'Editar Equipe' : 'Nova Equipe'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome da Equipe *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Suporte Mobile"
                  required
                  data-testid="input-team-name"
                />
              </div>
              
              <div>
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
                >
                  <SelectTrigger data-testid="select-team-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativa</SelectItem>
                    <SelectItem value="inactive">Inativa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="departmentId">Departamento *</Label>
                <Select 
                  value={formData.departmentId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, departmentId: value }))}
                >
                  <SelectTrigger data-testid="select-team-department">
                    <SelectValue placeholder="Selecione o departamento..." />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(dept => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="leaderId">Líder da Equipe</Label>
                <Select 
                  value={formData.leaderId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, leaderId: value }))}
                >
                  <SelectTrigger data-testid="select-team-leader">
                    <SelectValue placeholder="Selecione o líder..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sem líder</SelectItem>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.username} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="maxCapacity">Capacidade Máxima</Label>
              <Input
                id="maxCapacity"
                type="number"
                min="1"
                max="50"
                value={formData.maxCapacity}
                onChange={(e) => setFormData(prev => ({ ...prev, maxCapacity: Number(e.target.value) }))}
                data-testid="input-team-capacity"
              />
            </div>

            {/* Specialties */}
            <div>
              <Label>Especializações (selecione as aplicáveis)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {availableSpecialties.map(specialty => (
                  <label
                    key={specialty}
                    className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={formData.specialties.includes(specialty)}
                      onChange={() => toggleSpecialty(specialty)}
                      className="rounded border-gray-300"
                      data-testid={`checkbox-specialty-${specialty.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                    />
                    <span className="text-sm">{specialty}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading || !formData.departmentId} className="flex-1" data-testid="button-save-team">
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Salvando...
                  </>
                ) : editingTeam ? (
                  'Salvar Alterações'
                ) : (
                  'Criar Equipe'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}