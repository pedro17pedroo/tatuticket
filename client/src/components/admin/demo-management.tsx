import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Calendar, 
  Clock, 
  User, 
  Building, 
  Phone, 
  Mail, 
  MessageSquare, 
  Edit, 
  Check,
  X,
  AlertCircle
} from "lucide-react";

interface DemoRequest {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  preferredDate: string;
  preferredTime: string;
  message?: string;
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled';
  assignedAdminId?: string;
  scheduledDate?: string;
  meetingLink?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export function DemoManagement() {
  const [selectedDemo, setSelectedDemo] = useState<DemoRequest | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editNotes, setEditNotes] = useState("");
  const [editMeetingLink, setEditMeetingLink] = useState("");
  const [editScheduledDate, setEditScheduledDate] = useState("");
  const [editStatus, setEditStatus] = useState<DemoRequest['status']>('pending');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch demo requests
  const { data: demos, isLoading } = useQuery<{ data: DemoRequest[] }>({
    queryKey: ['/api/demo-requests'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Update demo request mutation
  const updateDemoMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DemoRequest> }) => {
      const response = await fetch(`/api/demo-requests/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update demo request');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/demo-requests'] });
      setIsEditDialogOpen(false);
      toast({
        title: "Demo atualizada com sucesso!",
        description: "As informações da demo foram atualizadas.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar demo",
        description: "Tente novamente ou contacte o suporte técnico.",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (demo: DemoRequest) => {
    setSelectedDemo(demo);
    setEditNotes(demo.notes || "");
    setEditMeetingLink(demo.meetingLink || "");
    setEditScheduledDate(demo.scheduledDate || "");
    setEditStatus(demo.status);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedDemo) return;

    updateDemoMutation.mutate({
      id: selectedDemo.id,
      data: {
        status: editStatus,
        notes: editNotes,
        meetingLink: editMeetingLink,
        scheduledDate: editScheduledDate ? editScheduledDate : undefined,
      },
    });
  };

  const getStatusColor = (status: DemoRequest['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: DemoRequest['status']) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="h-4 w-4" />;
      case 'scheduled':
        return <Calendar className="h-4 w-4" />;
      case 'completed':
        return <Check className="h-4 w-4" />;
      case 'cancelled':
        return <X className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gestão de Demos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando demos...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const demoRequests = demos?.data || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Gestão de Demos
          </CardTitle>
          <p className="text-sm text-gray-600">
            Gerencie todas as solicitações de demonstração da plataforma
          </p>
        </CardHeader>
        <CardContent>
          {demoRequests.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhuma demo agendada no momento</p>
            </div>
          ) : (
            <div className="space-y-4">
              {demoRequests.map((demo) => (
                <Card key={demo.id} className="border-l-4 border-l-primary">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <Badge className={`${getStatusColor(demo.status)} flex items-center gap-1`}>
                          {getStatusIcon(demo.status)}
                          {demo.status === 'pending' && 'Pendente'}
                          {demo.status === 'scheduled' && 'Agendada'}
                          {demo.status === 'completed' && 'Concluída'}
                          {demo.status === 'cancelled' && 'Cancelada'}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {new Date(demo.createdAt).toLocaleDateString('pt-PT')}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(demo)}
                        data-testid={`button-edit-demo-${demo.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{demo.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{demo.email}</span>
                        </div>
                        {demo.company && (
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">{demo.company}</span>
                          </div>
                        )}
                        {demo.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">{demo.phone}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">
                            Data preferida: {demo.preferredDate}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">
                            Horário preferido: {demo.preferredTime}
                          </span>
                        </div>
                        {demo.scheduledDate && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium text-green-700">
                              Agendada para: {new Date(demo.scheduledDate).toLocaleString('pt-PT')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {demo.message && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="h-4 w-4 text-gray-500 mt-0.5" />
                          <p className="text-sm">{demo.message}</p>
                        </div>
                      </div>
                    )}

                    {demo.notes && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-700">
                          <strong>Notas internas:</strong> {demo.notes}
                        </p>
                      </div>
                    )}

                    {demo.meetingLink && (
                      <div className="mt-4">
                        <a
                          href={demo.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          🔗 Link da reunião
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Demo</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <select
                id="edit-status"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as DemoRequest['status'])}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                data-testid="select-edit-status"
              >
                <option value="pending">Pendente</option>
                <option value="scheduled">Agendada</option>
                <option value="completed">Concluída</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-scheduled-date">Data/Hora Agendada</Label>
              <Input
                id="edit-scheduled-date"
                type="datetime-local"
                value={editScheduledDate}
                onChange={(e) => setEditScheduledDate(e.target.value)}
                data-testid="input-edit-scheduled-date"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-meeting-link">Link da Reunião</Label>
              <Input
                id="edit-meeting-link"
                placeholder="https://meet.google.com/..."
                value={editMeetingLink}
                onChange={(e) => setEditMeetingLink(e.target.value)}
                data-testid="input-edit-meeting-link"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notas Internas</Label>
              <Textarea
                id="edit-notes"
                placeholder="Adicione notas internas sobre esta demo..."
                rows={3}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                data-testid="textarea-edit-notes"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="flex-1"
                data-testid="button-cancel-edit-demo"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleUpdate}
                disabled={updateDemoMutation.isPending}
                className="flex-1"
                data-testid="button-save-edit-demo"
              >
                {updateDemoMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}