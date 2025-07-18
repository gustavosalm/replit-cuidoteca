import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  child?: any;
}

export default function ChildModal({ isOpen, onClose, child }: ChildModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    specialNeeds: "",
  });

  useEffect(() => {
    if (child) {
      setFormData({
        name: child.name || "",
        age: child.age?.toString() || "",
        specialNeeds: child.specialNeeds || "",
      });
    } else {
      setFormData({
        name: "",
        age: "",
        specialNeeds: "",
      });
    }
  }, [child]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const url = child ? `/api/children/${child.id}` : "/api/children";
      const method = child ? "PUT" : "POST";
      
      return await apiRequest(method, url, {
        ...data,
        age: parseInt(data.age),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
      toast({
        title: child ? "Criança atualizada" : "Criança cadastrada",
        description: child 
          ? "Os dados da criança foram atualizados com sucesso"
          : "A criança foi cadastrada com sucesso",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar os dados da criança",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.age) {
      toast({
        title: "Dados incompletos",
        description: "Por favor, preencha nome e idade da criança",
        variant: "destructive",
      });
      return;
    }
    mutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {child ? "Editar Criança" : "Cadastrar Criança"}
          </DialogTitle>
          <DialogDescription>
            {child 
              ? "Atualize os dados da criança abaixo"
              : "Preencha os dados da criança para cadastrá-la"
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Criança</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome completo da criança"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="age">Idade</Label>
            <Input
              id="age"
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              placeholder="Idade em anos"
              min="0"
              max="12"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="specialNeeds">Necessidades Especiais</Label>
            <Textarea
              id="specialNeeds"
              value={formData.specialNeeds}
              onChange={(e) => setFormData({ ...formData, specialNeeds: e.target.value })}
              placeholder="Alergias, medicamentos, cuidados especiais..."
              rows={3}
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending 
                ? "Salvando..." 
                : child 
                  ? "Atualizar" 
                  : "Cadastrar"
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
