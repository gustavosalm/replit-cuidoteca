import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  School, 
  Clock, 
  Calendar, 
  Users,
  UserPlus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface CuidotecasSectionProps {
  institutionId: number;
  user: any;
}

export default function CuidotecasSection({ institutionId, user }: CuidotecasSectionProps) {
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [selectedCuidoteca, setSelectedCuidoteca] = useState<any>(null);
  const [selectedChild, setSelectedChild] = useState<string>("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [fromHour, setFromHour] = useState<string>("");
  const [untilHour, setUntilHour] = useState<string>("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: allCuidotecas = [], isLoading: loadingCuidotecas } = useQuery({
    queryKey: ["/api/cuidotecas"],
  });

  // Filter cuidotecas by institution
  const cuidotecas = allCuidotecas.filter((c: any) => c.institutionId === institutionId);

  const { data: children = [] } = useQuery({
    queryKey: ["/api/children"],
    enabled: user?.role === 'parent',
  });

  const enrollMutation = useMutation({
    mutationFn: async ({ cuidotecaId, childId, requestedDays, requestedHours }: { 
      cuidotecaId: number; 
      childId: number; 
      requestedDays: string[]; 
      requestedHours: string 
    }) => {
      return await apiRequest(`/api/cuidotecas/${cuidotecaId}/enroll`, {
        method: "POST",
        body: JSON.stringify({ childId, requestedDays, requestedHours }),
        headers: { "Content-Type": "application/json" }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cuidotecas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
      setEnrollModalOpen(false);
      setSelectedChild("");
      setSelectedCuidoteca(null);
      setSelectedDays([]);
      setFromHour("");
      setUntilHour("");
      toast({
        title: "Inscrição enviada!",
        description: "Aguarde a aprovação da instituição.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível enviar a inscrição.",
        variant: "destructive",
      });
    },
  });

  const handleEnrollClick = (cuidoteca: any) => {
    setSelectedCuidoteca(cuidoteca);
    setSelectedChild("");
    setSelectedDays([]);
    setFromHour("");
    setUntilHour("");
    setEnrollModalOpen(true);
  };

  const handleEnroll = () => {
    if (!selectedChild || !selectedCuidoteca || selectedDays.length === 0 || !fromHour || !untilHour) return;
    
    const requestedHours = `${fromHour}-${untilHour}`;
    
    enrollMutation.mutate({
      cuidotecaId: selectedCuidoteca.id,
      childId: parseInt(selectedChild),
      requestedDays: selectedDays,
      requestedHours: requestedHours
    });
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

  // Helper function to parse cuidoteca hours and generate available hours
  const getAvailableHours = (hoursString: string) => {
    if (!hoursString) return [];
    
    // Parse hours like "08:00-17:00" or "8:00-17:00"
    const match = hoursString.match(/(\d{1,2}):?(\d{0,2})-(\d{1,2}):?(\d{0,2})/);
    if (!match) return [];
    
    const startHour = parseInt(match[1]);
    const endHour = parseInt(match[3]);
    
    const hours = [];
    for (let hour = startHour; hour <= endHour; hour++) {
      hours.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    
    return hours;
  };

  if (loadingCuidotecas) {
    return (
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
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <School className="h-5 w-5 mr-2" />
            Cuidotecas Disponíveis ({cuidotecas.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cuidotecas.length === 0 ? (
            <div className="text-center py-8">
              <School className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma cuidoteca disponível</h3>
              <p className="text-muted-foreground">
                Esta instituição ainda não criou cuidotecas.
              </p>
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
                          <h4 className="font-medium text-foreground">{cuidoteca.name}</h4>
                        </div>
                      </div>
                      {user?.role === 'parent' && (
                        <Button 
                          size="sm" 
                          onClick={() => handleEnrollClick(cuidoteca)}
                          disabled={enrollMutation.isPending}
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Inscrever
                        </Button>
                      )}
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
                    </div>

                    {cuidoteca.assignedCaretakers?.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-muted-foreground mb-1">Cuidadores:</p>
                        <div className="flex flex-wrap gap-1">
                          {cuidoteca.assignedCaretakers.slice(0, 2).map((caretaker: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {caretaker}
                            </Badge>
                          ))}
                          {cuidoteca.assignedCaretakers.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{cuidoteca.assignedCaretakers.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enrollment Modal */}
      <Dialog open={enrollModalOpen} onOpenChange={setEnrollModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Inscrever Criança na Cuidoteca</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Cuidoteca: <strong>{selectedCuidoteca?.name}</strong>
              </p>
              <p className="text-sm text-muted-foreground">
                Horário: {selectedCuidoteca?.hours}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">Selecione a criança:</label>
              <Select value={selectedChild} onValueChange={setSelectedChild}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Escolha uma criança" />
                </SelectTrigger>
                <SelectContent>
                  {children.map((child: any) => (
                    <SelectItem key={child.id} value={child.id.toString()}>
                      {child.name} ({child.age} anos)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-3 block">Selecione os dias:</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'monday', label: 'Segunda' },
                  { id: 'tuesday', label: 'Terça' },
                  { id: 'wednesday', label: 'Quarta' },
                  { id: 'thursday', label: 'Quinta' },
                  { id: 'friday', label: 'Sexta' },
                ].filter(day => 
                  selectedCuidoteca?.days?.includes(day.id)
                ).map((day) => (
                  <div key={day.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={day.id}
                      checked={selectedDays.includes(day.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedDays([...selectedDays, day.id]);
                        } else {
                          setSelectedDays(selectedDays.filter(d => d !== day.id));
                        }
                      }}
                    />
                    <Label htmlFor={day.id} className="text-sm">
                      {day.label}
                    </Label>
                  </div>
                ))}
              </div>
              {selectedCuidoteca?.days?.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum dia disponível para esta cuidoteca.</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Horário de chegada:</label>
                <Select value={fromHour} onValueChange={setFromHour}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Escolha horário" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableHours(selectedCuidoteca?.hours || "").slice(0, -1).map((hour) => (
                      <SelectItem key={hour} value={hour}>
                        {hour}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Horário de saída:</label>
                <Select value={untilHour} onValueChange={setUntilHour}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Escolha horário" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableHours(selectedCuidoteca?.hours || "")
                      .filter(hour => {
                        if (!fromHour) return true;
                        const fromHourNum = parseInt(fromHour.split(':')[0]);
                        const hourNum = parseInt(hour.split(':')[0]);
                        return hourNum > fromHourNum;
                      })
                      .map((hour) => (
                        <SelectItem key={hour} value={hour}>
                          {hour}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Cuidoteca funciona: {selectedCuidoteca?.hours}
            </p>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => {
                setEnrollModalOpen(false);
                setSelectedChild("");
                setSelectedCuidoteca(null);
                setSelectedDays([]);
                setFromHour("");
                setUntilHour("");
              }}>
                Cancelar
              </Button>
              <Button 
                onClick={handleEnroll}
                disabled={!selectedChild || selectedDays.length === 0 || !fromHour || !untilHour || enrollMutation.isPending}
              >
                {enrollMutation.isPending ? "Enviando..." : "Inscrever"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}