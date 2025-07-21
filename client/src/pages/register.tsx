import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Heart, Building } from "lucide-react";

export default function Register() {
  const [, setLocation] = useLocation();
  const { register } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [userType, setUserType] = useState<"parent" | "institution" | "cuidador">("parent");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    universityId: "",
    course: "",
    semester: "",
    address: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
    institutionName: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Erro na confirmação",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!formData.agreeToTerms) {
      toast({
        title: "Termos de uso",
        description: "Você precisa aceitar os termos de uso",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (userType === "institution" && !formData.institutionName.trim()) {
      toast({
        title: "Nome da instituição obrigatório",
        description: "Por favor, preencha o nome oficial da instituição",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const baseData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: userType,
      };

      const registrationData = userType === "institution" 
        ? {
            ...baseData,
            institutionName: formData.institutionName,
          }
        : {
            ...baseData,
            phone: formData.phone,
            universityId: formData.universityId,
            course: formData.course,
            semester: formData.semester,
            address: formData.address,
          };

      await register(registrationData);
      setLocation("/");
      toast({
        title: "Cadastro realizado com sucesso!",
        description: userType === "institution" 
          ? "Instituição cadastrada com sucesso!" 
          : "Bem-vinda à Cuidoteca",
      });
    } catch (error: any) {
      // Show specific error message from backend
      const errorMessage = error.message || "Verifique os dados e tente novamente";
      
      // Translate common error messages to Portuguese
      let description = errorMessage;
      let showLoginLink = false;
      
      if (errorMessage === "User already exists") {
        description = "Já existe uma conta com este email.";
        showLoginLink = true;
      } else if (errorMessage.includes("already exists")) {
        description = "Já existe uma conta com este email.";
        showLoginLink = true;
      } else if (errorMessage.includes("validation") || errorMessage.includes("required")) {
        description = "Alguns campos obrigatórios não foram preenchidos corretamente.";
      } else if (errorMessage.includes("password")) {
        description = "Problema com a senha. Verifique se atende aos requisitos.";
      } else if (errorMessage === "Registration failed") {
        description = "Falha no cadastro. Verifique os dados e tente novamente.";
      }
      
      toast({
        title: "Erro no cadastro",
        description: showLoginLink ? 
          `${description} Clique aqui para fazer login.` : 
          description,
        variant: "destructive",
        onClick: showLoginLink ? () => setLocation("/login") : undefined,
        style: showLoginLink ? { cursor: 'pointer' } : undefined,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setLocation("/")}>
            <Heart className="h-6 w-6 text-accent hover:scale-110 transition-transform" />
            <CardTitle className="text-xl hover:text-accent transition-colors">
              {userType === "institution" ? "Cadastro de INSTITUIÇÃO" : 
               userType === "cuidador" ? "Cadastro de CUIDADOR" : "Cadastro de RESPONSÁVEL"}
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/login")}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Type Selection */}
            <div className="space-y-4">
              <Label>Tipo de Perfil</Label>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  type="button"
                  variant={userType === "parent" ? "default" : "outline"}
                  onClick={() => setUserType("parent")}
                  className="h-16 flex-col text-sm"
                >
                  <Heart className="h-5 w-5 mb-1" />
                  RESPONSÁVEL
                </Button>
                <Button
                  type="button"
                  variant={userType === "cuidador" ? "default" : "outline"}
                  onClick={() => setUserType("cuidador")}
                  className="h-16 flex-col text-sm"
                >
                  <Heart className="h-5 w-5 mb-1" />
                  CUIDADOR
                </Button>
                <Button
                  type="button"
                  variant={userType === "institution" ? "default" : "outline"}
                  onClick={() => setUserType("institution")}
                  className="h-16 flex-col text-sm"
                >
                  <Building className="h-5 w-5 mb-1" />
                  INSTITUIÇÃO
                </Button>
              </div>
            </div>
            
            {/* Common Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  {userType === "institution" ? "Nome da Instituição" : "Nome Completo"}
                </Label>
                <Input
                  id="name"
                  placeholder={userType === "institution" ? "Nome da instituição" : "Seu nome completo"}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={userType === "institution" ? "contato@instituicao.edu" : "seu.email@universidade.edu"}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Institution-specific fields */}
            {userType === "institution" && (
              <div className="space-y-2">
                <Label htmlFor="institutionName">Nome Oficial da Instituição</Label>
                <Input
                  id="institutionName"
                  placeholder="Ex: Universidade de São Paulo"
                  value={formData.institutionName}
                  onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                  required
                />
              </div>
            )}
            
            {/* Parent and Cuidador specific fields */}
            {(userType === "parent" || userType === "cuidador") && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(11) 99999-9999"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="universityId">ID/Matrícula Universidade</Label>
                    <Input
                      id="universityId"
                      placeholder="Seu ID da universidade"
                      value={formData.universityId}
                      onChange={(e) => setFormData({ ...formData, universityId: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="course">Curso</Label>
                    <Input
                      id="course"
                      placeholder="Nome do seu curso"
                      value={formData.course}
                      onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="semester">Semestre</Label>
                    <Select value={formData.semester} onValueChange={(value) => setFormData({ ...formData, semester: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o semestre" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1º Semestre</SelectItem>
                        <SelectItem value="2">2º Semestre</SelectItem>
                        <SelectItem value="3">3º Semestre</SelectItem>
                        <SelectItem value="4">4º Semestre</SelectItem>
                        <SelectItem value="5">5º Semestre</SelectItem>
                        <SelectItem value="6">6º Semestre</SelectItem>
                        <SelectItem value="7">7º Semestre</SelectItem>
                        <SelectItem value="8">8º Semestre</SelectItem>
                        <SelectItem value="9">9º Semestre</SelectItem>
                        <SelectItem value="10">10º Semestre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    placeholder="Seu endereço completo"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="agreeToTerms"
                checked={formData.agreeToTerms}
                onCheckedChange={(checked) => setFormData({ ...formData, agreeToTerms: checked as boolean })}
              />
              <Label htmlFor="agreeToTerms" className="text-sm">
                Eu concordo com os{" "}
                <Button variant="link" className="p-0 h-auto text-sm">
                  termos de uso
                </Button>
                {" "}e{" "}
                <Button variant="link" className="p-0 h-auto text-sm">
                  política de privacidade
                </Button>
              </Label>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/login")}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Criando conta..." : "Criar Conta"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
