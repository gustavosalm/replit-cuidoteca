import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: any;
}

export default function EventModal({ isOpen, onClose, event }: EventModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dayOfWeek: "",
    period: "",
    observations: "",
  });

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || "",
        description: event.description || "",
        dayOfWeek: event.dayOfWeek || "",
        period: event.period || "",
        observations: event.observations || "",
      });
    } else {
      setFormData({
        title: "",
        description: "",
        dayOfWeek: "",
        period: "",
        observations: "",
      });
    }
  }, [event]);

  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(eventData),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({
        title: "Evento criado",
        description: "O evento foi criado com sucesso!",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Erro ao criar evento",
        description: "Não foi possível criar o evento.",
        variant: "destructive",
      });
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/events/${event.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(eventData),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({
        title: "Evento atualizado",
        description: "O evento foi atualizado com sucesso!",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar evento",
        description: "Não foi possível atualizar o evento.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.dayOfWeek || !formData.period) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (event) {
      updateEventMutation.mutate(formData);
    } else {
      createEventMutation.mutate(formData);
    }
  };

  const dayOptions = [
    { value: "monday", label: "Segunda-feira" },
    { value: "tuesday", label: "Terça-feira" },
    { value: "wednesday", label: "Quarta-feira" },
    { value: "thursday", label: "Quinta-feira" },
    { value: "friday", label: "Sexta-feira" },
  ];

  const periodOptions = [
    { value: "morning", label: "Manhã" },
    { value: "afternoon", label: "Tarde" },
    { value: "full_day", label: "Dia inteiro" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {event ? "Editar Evento" : "Criar Novo Evento"}
          </DialogTitle>
          <DialogDescription>
            {event
              ? "Edite as informações do evento."
              : "Preencha as informações para criar um novo evento."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Atividade de Arte"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva o evento..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dayOfWeek">Dia da Semana *</Label>
              <Select value={formData.dayOfWeek} onValueChange={(value) => setFormData({ ...formData, dayOfWeek: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o dia" />
                </SelectTrigger>
                <SelectContent>
                  {dayOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="period">Período *</Label>
              <Select value={formData.period} onValueChange={(value) => setFormData({ ...formData, period: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  {periodOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
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
              placeholder="Observações adicionais..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createEventMutation.isPending || updateEventMutation.isPending}
            >
              {createEventMutation.isPending || updateEventMutation.isPending
                ? "Salvando..."
                : event
                ? "Atualizar"
                : "Criar Evento"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}