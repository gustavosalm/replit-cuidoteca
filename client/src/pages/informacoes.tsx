import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertInstitutionDocumentSchema, type InstitutionDocument } from "@shared/schema";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { FileText, Download, Upload, Trash2, Calendar, User, Building2 } from "lucide-react";
import { z } from "zod";

const documentFormSchema = insertInstitutionDocumentSchema.omit({
  institutionId: true,
  fileUrl: true,
  fileSize: true,
  fileType: true,
});

type DocumentFormData = z.infer<typeof documentFormSchema>;

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function Informacoes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['/api/documents'],
  });

  const form = useForm<DocumentFormData>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: {
      title: "",
      description: "",
      fileName: "",
      isPublic: true,
    },
  });

  const createDocumentMutation = useMutation({
    mutationFn: async (data: DocumentFormData & { fileUrl: string; fileSize: number; fileType: string }) => {
      console.log('Making API request to /api/documents with data length:', JSON.stringify(data).length);
      const response = await apiRequest('POST', '/api/documents', data);
      const result = await response.json();
      console.log('API request successful:', result);
      return result;
    },
    onSuccess: () => {
      console.log('Document upload successful');
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      toast({
        title: "Sucesso",
        description: "Documento enviado com sucesso!",
      });
      setDialogOpen(false);
      form.reset();
      setSelectedFile(null);
    },
    onError: (error: any) => {
      console.error('Document upload failed:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao enviar documento",
        variant: "destructive",
      });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/documents/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      toast({
        title: "Sucesso",
        description: "Documento removido com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao remover documento",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        toast({
          title: "Erro",
          description: "Arquivo muito grande. Tamanho máximo: 10MB",
          variant: "destructive",
        });
        event.target.value = ''; // Clear the input
        return;
      }
      
      setSelectedFile(file);
      form.setValue('fileName', file.name);
      
      // Also set a default title if empty
      if (!form.getValues('title')) {
        form.setValue('title', file.name);
      }
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const onSubmit = async (data: DocumentFormData) => {
    if (!selectedFile) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Starting file upload process...');
      console.log('File details:', {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type
      });
      
      const fileBase64 = await convertToBase64(selectedFile);
      console.log('File converted to base64, length:', fileBase64.length);
      
      const documentData = {
        ...data,
        fileUrl: fileBase64,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
      };
      
      console.log('Submitting document data:', {
        title: documentData.title,
        fileName: documentData.fileName,
        fileSize: documentData.fileSize,
        fileType: documentData.fileType,
        isPublic: documentData.isPublic
      });
      
      await createDocumentMutation.mutateAsync(documentData);
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: "Erro",
        description: `Falha ao enviar documento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive",
      });
    }
  };

  const downloadDocument = (doc: InstitutionDocument) => {
    try {
      const link = document.createElement('a');
      link.href = doc.fileUrl;
      link.download = doc.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao baixar o documento",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Informações e Documentos</h1>
          <p className="text-muted-foreground mt-2">
            {user?.role === 'institution' 
              ? 'Gerencie documentos e informações da sua instituição'
              : 'Acesse documentos e informações das instituições'
            }
          </p>
        </div>

        {user?.role === 'institution' && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="w-4 h-4 mr-2" />
                Enviar Documento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Enviar Novo Documento</DialogTitle>
                <DialogDescription>
                  Adicione um novo documento para compartilhar informações importantes.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do documento" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descrição opcional do documento"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormItem>
                    <FormLabel>Arquivo</FormLabel>
                    <FormControl>
                      <Input 
                        type="file"
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                      />
                    </FormControl>
                    <FormDescription>
                      Formatos aceitos: PDF, DOC, DOCX, TXT, JPG, PNG (máx. 10MB)
                    </FormDescription>
                  </FormItem>

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createDocumentMutation.isPending}
                    >
                      {createDocumentMutation.isPending ? "Enviando..." : "Enviar"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-muted rounded w-full mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !documents || (documents as any[]).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum documento encontrado</h3>
            <p className="text-muted-foreground text-center">
              {user?.role === 'institution' 
                ? 'Comece enviando o primeiro documento da sua instituição.'
                : 'Ainda não há documentos disponíveis das instituições.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(documents as Array<InstitutionDocument & { institutionName?: string; authorName?: string }>).map((document) => (
            <Card key={document.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-start justify-between">
                  <span className="truncate">{document.title}</span>
                  {user?.role === 'institution' && document.institutionId === user.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteDocumentMutation.mutate(document.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </CardTitle>
                <CardDescription>
                  <div className="space-y-1 text-xs">
                    {document.institutionName && (
                      <div className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {document.institutionName}
                      </div>
                    )}
                    {document.authorName && (
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {document.authorName}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(document.createdAt.toString())}
                    </div>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                {document.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {document.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                  <span>{document.fileName}</span>
                  <span>{formatFileSize(document.fileSize)}</span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadDocument(document)}
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}