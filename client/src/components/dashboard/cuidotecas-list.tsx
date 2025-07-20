import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { School, Edit, Trash2, Plus, Users, Clock, Calendar, ExternalLink } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import CuidotecaModal from "@/components/modals/cuidoteca-modal";

export default function CuidotecasList() {
  const [isCuidotecaModalOpen, setIsCuidotecaModalOpen] = useState(false);
  const [editingCuidoteca, setEditingCuidoteca] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: cuidotecas, isLoading } = useQuery({
    queryKey: ["/api/cuidotecas"],
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ["/api/cuidotecas/enrollments"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (cuidotecaId: number) => {
      await apiRequest("DELETE", `/api/cuidotecas/${cuidotecaId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cuidotecas"] });
      toast({
        title: "Cuidoteca removida",
        description: "A cuidoteca foi removida com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao remover cuidoteca",
        description: "Não foi possível remover a cuidoteca",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (cuidoteca: any) => {
    setEditingCuidoteca(cuidoteca);
    setIsCuidotecaModalOpen(true);
  };

  const handleDelete = (cuidotecaId: number) => {
    if (confirm("Tem certeza que deseja remover esta cuidoteca?")) {
      deleteMutation.mutate(cuidotecaId);
    }
  };

  const handleModalClose = () => {
    setIsCuidotecaModalOpen(false);
    setEditingCuidoteca(null);
  };

  const formatDays = (days: string[]) => {
    const dayNames: { [key: string]: string } = {
      monday: 'Seg',
      tuesday: 'Ter',
      wednesday: 'Qua',
      thursday: 'Qui',
      friday: 'Sex',
    };
    return days.map(day => dayNames[day] || day).join(', ');
  };

  if (isLoading) {
    return (
      <section className="mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="space-y-2">
                <div className="h-24 bg-gray-200 rounded"></div>
                <div className="h-24 bg-gray-200 rounded"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <>
      <section className="mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Minhas Cuidotecas</CardTitle>
            <Button onClick={() => setIsCuidotecaModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Cuidoteca
            </Button>
          </CardHeader>
          <CardContent>
            {!cuidotecas?.length ? (
              <div className="text-center py-8">
                <School className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nenhuma cuidoteca criada ainda
                </p>
                <Button
                  onClick={() => setIsCuidotecaModalOpen(true)}
                  className="mt-4"
                >
                  Criar primeira cuidoteca
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {cuidotecas.map((cuidoteca: any) => (
                  <Card key={cuidoteca.id} className="border-border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <School className="h-5 w-5 text-primary" />
                          </div>
                          <div className="ml-3">
                            <h4 
                              className="font-medium text-foreground cursor-pointer hover:text-primary"
                              onClick={() => setLocation(`/cuidotecas/${cuidoteca.id}`)}
                            >
                              {cuidoteca.name}
                            </h4>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setLocation(`/cuidotecas/${cuidoteca.id}`)}
                            title="Ver detalhes"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(cuidoteca)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(cuidoteca.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          <span>{cuidoteca.hours}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>{formatDays(cuidoteca.days)}</span>
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          <span>Máx: {cuidoteca.maxCapacity} crianças</span>
                        </div>
                        <div className="flex items-center">
                          <span className="h-4 w-4 mr-2 text-xs">👶</span>
                          <span>{cuidoteca.minAge || 0}-{cuidoteca.maxAge || 12} anos</span>
                        </div>
                      </div>

                      {cuidoteca.assignedCaretakers?.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-muted-foreground mb-1">Cuidadores:</p>
                          <div className="flex flex-wrap gap-1">
                            {cuidoteca.assignedCaretakers.slice(0, 2).map((caretaker: string, index: number) => (
                              <span
                                key={index}
                                className="inline-block bg-muted text-xs px-2 py-1 rounded"
                              >
                                {caretaker}
                              </span>
                            ))}
                            {cuidoteca.assignedCaretakers.length > 2 && (
                              <span className="inline-block bg-muted text-xs px-2 py-1 rounded">
                                +{cuidoteca.assignedCaretakers.length - 2}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Show enrolled children for confirmed enrollments */}
                      {(() => {
                        const confirmedEnrollments = enrollments.filter(
                          (enrollment: any) => 
                            enrollment.cuidotecaId === cuidoteca.id && 
                            enrollment.status === 'confirmed'
                        );
                        
                        if (confirmedEnrollments.length > 0) {
                          return (
                            <div className="mt-3">
                              <p className="text-xs text-muted-foreground mb-1">Crianças inscritas:</p>
                              <div className="flex flex-wrap gap-1">
                                {confirmedEnrollments.slice(0, 3).map((enrollment: any) => (
                                  <span
                                    key={enrollment.id}
                                    className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded"
                                  >
                                    {enrollment.childName} ({enrollment.childAge}a)
                                  </span>
                                ))}
                                {confirmedEnrollments.length > 3 && (
                                  <span className="inline-block bg-muted text-xs px-2 py-1 rounded">
                                    +{confirmedEnrollments.length - 3}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <CuidotecaModal
        isOpen={isCuidotecaModalOpen}
        onClose={handleModalClose}
        cuidoteca={editingCuidoteca}
      />
    </>
  );
}