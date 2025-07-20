import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";


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

const HOUR_OPTIONS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00'
];

const AGE_OPTIONS = [
  { value: 0, label: '0 anos' },
  { value: 1, label: '1 ano' },
  { value: 2, label: '2 anos' },
  { value: 3, label: '3 anos' },
  { value: 4, label: '4 anos' },
  { value: 5, label: '5 anos' },
  { value: 6, label: '6 anos' },
  { value: 7, label: '7 anos' },
  { value: 8, label: '8 anos' },
  { value: 9, label: '9 anos' },
  { value: 10, label: '10 anos' },
  { value: 11, label: '11 anos' },
  { value: 12, label: '12 anos' },
];

export default function CuidotecaModal({ isOpen, onClose, cuidoteca }: CuidotecaModalProps) {
  const [formData, setFormData] = useState({
    name: cuidoteca?.name || '',
    hours: cuidoteca?.hours || '',
    days: cuidoteca?.days || [],
    maxCapacity: cuidoteca?.maxCapacity || 20,
    minAge: cuidoteca?.minAge || 0,
    maxAge: cuidoteca?.maxAge || 12,
  });
  const [openingHour, setOpeningHour] = useState(cuidoteca?.hours?.split('-')[0] || '');
  const [closingHour, setClosingHour] = useState(cuidoteca?.hours?.split('-')[1] || '');

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
      maxCapacity: 20,
      minAge: 0,
      maxAge: 12,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !openingHour || !closingHour || formData.days.length === 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome, horários e pelo menos um dia.",
        variant: "destructive",
      });
      return;
    }

    if (formData.minAge > formData.maxAge) {
      toast({
        title: "Faixa etária inválida",
        description: "A idade mínima não pode ser maior que a idade máxima.",
        variant: "destructive",
      });
      return;
    }

    const hours = `${openingHour}-${closingHour}`;
    const dataToSubmit = { ...formData, hours };

    if (cuidoteca) {
      updateMutation.mutate(dataToSubmit);
    } else {
      createMutation.mutate(dataToSubmit);
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Horário de Abertura *</Label>
              <Select value={openingHour} onValueChange={setOpeningHour}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {HOUR_OPTIONS.map((hour) => (
                    <SelectItem key={hour} value={hour}>
                      {hour}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Horário de Fechamento *</Label>
              <Select value={closingHour} onValueChange={setClosingHour}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {HOUR_OPTIONS.map((hour) => (
                    <SelectItem key={hour} value={hour}>
                      {hour}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Idade Mínima *</Label>
              <Select value={formData.minAge.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, minAge: parseInt(value) }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {AGE_OPTIONS.map((age) => (
                    <SelectItem key={age.value} value={age.value.toString()}>
                      {age.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Idade Máxima *</Label>
              <Select value={formData.maxAge.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, maxAge: parseInt(value) }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {AGE_OPTIONS.map((age) => (
                    <SelectItem key={age.value} value={age.value.toString()}>
                      {age.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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