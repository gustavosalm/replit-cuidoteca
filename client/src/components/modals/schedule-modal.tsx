import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule?: any;
}

export default function ScheduleModal({ isOpen, onClose, schedule }: ScheduleModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    childId: "",
    dayOfWeek: "",
    period: "",
    observations: "",
  });

  const { data: children } = useQuery({
    queryKey: ["/api/children"],
  });

  useEffect(() => {
    if (schedule) {
      setFormData({
        childId: schedule.childId?.toString() || "",
        dayOfWeek: schedule.dayOfWeek || "",
        period: schedule.period || "",
        observations: schedule.observations || "",
      });
    } else {
      setFormData({
        childId: "",
        dayOfWeek: "",
        period: "",
        observations: "",
      });
    }
  }, [schedule]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const url = schedule ? `/api/schedules/${schedule.id}` : "/api/schedules";
      const method = schedule ? "PUT" : "POST";
      
      return await apiRequest(method, url, {
        ...data,
        childId: parseInt(data.childId),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      toast({
        title: schedule ? "Agendamento atualizado" : "Agendamento criado",
        description: schedule 
          ? "O agendamento foi atualizado com sucesso"
          : "O agendamento foi criado com sucesso",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o agendamento",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.childId || !formData.dayOfWeek || !formData.period) {
      toast({
        title: "Dados incompletos",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }
    mutation.mutate(formData);
  };

  const dayOptions = [
    { value: "monday", label: "Segunda-feira" },
    { value: "tuesday", label: "Terça-feira" },
    { value: "wednesday", label: "Quarta-feira" },
    { value: "thursday", label: "Quinta-feira" },
    { value: "friday", label: "Sexta-feira" },
  ];

  const periodOptions = [
    { value: "morning", label: "Manhã (08:00 - 12:00)" },
    { value: "afternoon", label: "Tarde (14:00 - 18:00)" },
    { value: "full_day", label: "Integral (08:00 - 18:00)" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {schedule ? "Editar Agendamento" : "Novo Agendamento"}
          </DialogTitle>
          <DialogDescription>
            {schedule 
              ? "Atualize os dados do agendamento abaixo"
              : "Preencha os dados para criar um novo agendamento"
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="childId">Selecione a criança</Label>
            <Select value={formData.childId} onValueChange={(value) => setFormData({ ...formData, childId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma criança" />
              </SelectTrigger>
              <SelectContent>
                {children?.map((child: any) => (
                  <SelectItem key={child.id} value={child.id.toString()}>
                    {child.name} ({child.age} anos)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dayOfWeek">Dia da Semana</Label>
              <Select value={formData.dayOfWeek} onValueChange={(value) => setFormData({ ...formData, dayOfWeek: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o dia" />
                </SelectTrigger>
                <SelectContent>
                  {dayOptions.map((day) => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="period">Período</Label>
              <Select value={formData.period} onValueChange={(value) => setFormData({ ...formData, period: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  {periodOptions.map((period) => (
                    <SelectItem key={period.value} value={period.value}>
                      {period.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="observations">Observações</Label>
            <Textarea
              id="observations"
              value={formData.observations}
              onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
              placeholder="Informações adicionais sobre o agendamento..."
              rows={3}
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending 
                ? "Salvando..." 
                : schedule 
                  ? "Atualizar Agendamento" 
                  : "Confirmar Agendamento"
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
