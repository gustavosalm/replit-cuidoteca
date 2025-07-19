import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { X } from "lucide-react";

interface CuidotecaModalProps {
  isOpen: boolean;
  onClose: () => void;
  cuidoteca?: any;
}

const DAYS_OPTIONS = [
  { id: 'monday', label: 'Segunda-feira' },
  { id: 'tuesday', label: 'Terça-feira' },
  { id: 'wednesday', label: 'Quarta-feira' },
  { id: 'thursday', label: 'Quinta-feira' },
  { id: 'friday', label: 'Sexta-feira' },
];

export default function CuidotecaModal({ isOpen, onClose, cuidoteca }: CuidotecaModalProps) {
  const [formData, setFormData] = useState({
    name: cuidoteca?.name || '',
    hours: cuidoteca?.hours || '',
    days: cuidoteca?.days || [],
    assignedCaretakers: cuidoteca?.assignedCaretakers || [],
    maxCapacity: cuidoteca?.maxCapacity || 20,
  });
  const [caretakerInput, setCaretakerInput] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/cuidotecas", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cuidotecas"] });
      toast({
        title: "Cuidoteca criada!",
        description: "A nova cuidoteca foi criada com sucesso.",
      });
      onClose();
      resetForm();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível criar a cuidoteca.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PUT", `/api/cuidotecas/${cuidoteca.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cuidotecas"] });
      toast({
        title: "Cuidoteca atualizada!",
        description: "A cuidoteca foi atualizada com sucesso.",
      });
      onClose();
      resetForm();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a cuidoteca.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      hours: '',
      days: [],
      assignedCaretakers: [],
      maxCapacity: 20,
    });
    setCaretakerInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.hours || formData.days.length === 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome, horário e pelo menos um dia.",
        variant: "destructive",
      });
      return;
    }

    if (cuidoteca) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDayChange = (dayId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      days: checked 
        ? [...prev.days, dayId]
        : prev.days.filter(d => d !== dayId)
    }));
  };

  const addCaretaker = () => {
    if (caretakerInput.trim()) {
      setFormData(prev => ({
        ...prev,
        assignedCaretakers: [...prev.assignedCaretakers, caretakerInput.trim()]
      }));
      setCaretakerInput('');
    }
  };

  const removeCaretaker = (index: number) => {
    setFormData(prev => ({
      ...prev,
      assignedCaretakers: prev.assignedCaretakers.filter((_, i) => i !== index)
    }));
  };

  const handleClose = () => {
    onClose();
    if (!cuidoteca) {
      resetForm();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {cuidoteca ? 'Editar Cuidoteca' : 'Nova Cuidoteca'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome da Cuidoteca *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Turma da Manhã"
              required
            />
          </div>

          <div>
            <Label htmlFor="hours">Horário de Funcionamento *</Label>
            <Input
              id="hours"
              value={formData.hours}
              onChange={(e) => setFormData(prev => ({ ...prev, hours: e.target.value }))}
              placeholder="Ex: 08:00-12:00"
              required
            />
          </div>

          <div>
            <Label>Dias de Funcionamento *</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {DAYS_OPTIONS.map((day) => (
                <div key={day.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={day.id}
                    checked={formData.days.includes(day.id)}
                    onCheckedChange={(checked) => handleDayChange(day.id, checked as boolean)}
                  />
                  <Label htmlFor={day.id} className="text-sm">
                    {day.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="maxCapacity">Capacidade Máxima</Label>
            <Input
              id="maxCapacity"
              type="number"
              value={formData.maxCapacity}
              onChange={(e) => setFormData(prev => ({ ...prev, maxCapacity: parseInt(e.target.value) || 20 }))}
              min="1"
              max="50"
            />
          </div>

          <div>
            <Label>Cuidadores Designados</Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={caretakerInput}
                onChange={(e) => setCaretakerInput(e.target.value)}
                placeholder="Nome do cuidador"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCaretaker())}
              />
              <Button type="button" onClick={addCaretaker} variant="outline">
                Adicionar
              </Button>
            </div>
            {formData.assignedCaretakers.length > 0 && (
              <div className="mt-2 space-y-1">
                {formData.assignedCaretakers.map((caretaker, index) => (
                  <div key={index} className="flex items-center justify-between bg-muted px-3 py-2 rounded">
                    <span className="text-sm">{caretaker}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCaretaker(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {cuidoteca ? 'Atualizar' : 'Criar'} Cuidoteca
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}