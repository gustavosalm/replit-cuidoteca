import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Baby, Edit, Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ChildModal from "@/components/modals/child-modal";

export default function ChildrenList() {
  const [isChildModalOpen, setIsChildModalOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: children, isLoading } = useQuery({
    queryKey: ["/api/children"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (childId: number) => {
      await apiRequest("DELETE", `/api/children/${childId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
      toast({
        title: "Criança removida",
        description: "A criança foi removida com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao remover criança",
        description: "Não foi possível remover a criança",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (child: any) => {
    setEditingChild(child);
    setIsChildModalOpen(true);
  };

  const handleDelete = (childId: number) => {
    if (confirm("Tem certeza que deseja remover esta criança?")) {
      deleteMutation.mutate(childId);
    }
  };

  const handleModalClose = () => {
    setIsChildModalOpen(false);
    setEditingChild(null);
  };

  if (isLoading) {
    return (
      <section className="mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="space-y-2">
                <div className="h-16 bg-gray-200 rounded"></div>
                <div className="h-16 bg-gray-200 rounded"></div>
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
            <CardTitle>Minhas Crianças</CardTitle>
            <Button onClick={() => setIsChildModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Criança
            </Button>
          </CardHeader>
          <CardContent>
            {!children?.length ? (
              <div className="text-center py-8">
                <Baby className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nenhuma criança cadastrada ainda
                </p>
                <Button
                  onClick={() => setIsChildModalOpen(true)}
                  className="mt-4"
                >
                  Cadastrar primeira criança
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {children.map((child: any) => (
                  <div
                    key={child.id}
                    className="flex items-center p-4 border border-border rounded-lg"
                  >
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Baby className="h-6 w-6 text-primary" />
                    </div>
                    <div className="ml-4 flex-1">
                      <h4 className="font-medium text-foreground">{child.name}</h4>
                      <p className="text-sm text-muted-foreground">{child.age} anos</p>
                      {child.specialNeeds && (
                        <p className="text-sm text-muted-foreground">
                          {child.specialNeeds}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(child)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(child.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <ChildModal
        isOpen={isChildModalOpen}
        onClose={handleModalClose}
        child={editingChild}
      />
    </>
  );
}
