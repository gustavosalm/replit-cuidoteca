import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import MobileNav from "@/components/layout/mobile-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChevronUp, ChevronDown, MessageCircle, User, Send, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Community() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newPost, setNewPost] = useState("");

  // Get user's connections to check if they're connected to any institution
  const { data: userConnections } = useQuery({
    queryKey: ["/api/users/connections"],
    enabled: !!user,
  });

  // Get user's first connected institution details
  const firstInstitutionId = userConnections?.[0]?.institutionId;
  const { data: institutionDetails } = useQuery({
    queryKey: ["/api/institutions", firstInstitutionId],
    enabled: !!firstInstitutionId,
  });

  const { data: posts, isLoading } = useQuery({
    queryKey: ["/api/posts"],
  });

  const createPostMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest("POST", "/api/posts", { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setNewPost("");
      toast({
        title: "Post criado!",
        description: "Sua mensagem foi compartilhada com a comunidade",
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || "Não foi possível criar o post";
      toast({
        title: "Erro ao criar post",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const upvoteMutation = useMutation({
    mutationFn: async (postId: number) => {
      return await apiRequest("PUT", `/api/posts/${postId}/upvote`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
  });

  const downvoteMutation = useMutation({
    mutationFn: async (postId: number) => {
      return await apiRequest("PUT", `/api/posts/${postId}/downvote`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      return await apiRequest("DELETE", `/api/posts/${postId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "Post excluído",
        description: "Sua mensagem foi removida da comunidade",
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || "Não foi possível excluir o post";
      toast({
        title: "Erro ao excluir post",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleCreatePost = () => {
    if (!userConnections || userConnections.length === 0) {
      toast({
        title: "Conecte-se à sua instituição",
        description: "Conecte-se à sua instituição para começar a postar",
        variant: "destructive",
      });
      return;
    }

    if (!newPost.trim()) {
      toast({
        title: "Mensagem vazia",
        description: "Digite uma mensagem para compartilhar",
        variant: "destructive",
      });
      return;
    }
    createPostMutation.mutate(newPost.trim());
  };

  const handleDeletePost = (postId: number, postContent: string) => {
    const confirmMessage = postContent.length > 50 
      ? `Tem certeza que deseja excluir este post?\n\n"${postContent.substring(0, 50)}..."`
      : `Tem certeza que deseja excluir este post?\n\n"${postContent}"`;
    
    if (confirm(confirmMessage)) {
      deletePostMutation.mutate(postId);
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "agora";
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    return `${Math.floor(diffInHours / 24)}d atrás`;
  };

  return (
    <div className="min-h-screen bg-neutral">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                Comunidade {institutionDetails?.name || institutionDetails?.institutionName || "Cuidoteca"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(!userConnections || userConnections.length === 0) ? (
                <div className="text-center p-6">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Conecte-se à sua instituição para começar a postar
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Textarea
                    placeholder="Compartilhe algo com a comunidade..."
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    rows={3}
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={handleCreatePost}
                      disabled={createPostMutation.isPending || !newPost.trim()}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {createPostMutation.isPending ? "Publicando..." : "Publicar"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-24"></div>
                          <div className="h-3 bg-gray-200 rounded w-16"></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !posts?.length ? (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                {(!userConnections || userConnections.length === 0) ? (
                  <div>
                    <p className="text-muted-foreground mb-4">
                      Conecte-se à sua instituição para ver as mensagens da comunidade
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Acesse sua instituição para começar a participar!
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-muted-foreground mb-4">
                      Ainda não há mensagens na comunidade
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Seja a primeira pessoa a compartilhar algo!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            posts.map((post: any) => (
              <Card key={post.id}>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-3">
                    <button
                      className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors cursor-pointer"
                      onClick={() => {
                        // Navigate to user profile
                        window.location.href = `/profile/${post.authorId}`;
                      }}
                    >
                      <User className="h-5 w-5 text-primary" />
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <button
                            className="font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
                            onClick={() => {
                              // Navigate to user profile
                              window.location.href = `/profile/${post.authorId}`;
                            }}
                          >
                            {post.author?.name}
                          </button>
                          <span className="text-sm text-muted-foreground">
                            {formatTimeAgo(post.createdAt)}
                          </span>
                        </div>
                        {user && post.authorId === user.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePost(post.id, post.content)}
                            disabled={deletePostMutation.isPending}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                            title="Excluir post"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <p className="text-foreground mb-4 whitespace-pre-wrap">
                        {post.content}
                      </p>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => upvoteMutation.mutate(post.id)}
                            disabled={upvoteMutation.isPending || downvoteMutation.isPending}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <ChevronUp className="h-4 w-4" />
                            <span className="ml-1">{post.upvotes || 0}</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downvoteMutation.mutate(post.id)}
                            disabled={upvoteMutation.isPending || downvoteMutation.isPending}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <ChevronDown className="h-4 w-4" />
                            <span className="ml-1">{post.downvotes || 0}</span>
                          </Button>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            // TODO: Implement reply functionality
                            toast({
                              title: "Em desenvolvimento",
                              description: "A funcionalidade de resposta está sendo desenvolvida."
                            });
                          }}
                        >
                          <MessageCircle className="h-4 w-4 mr-1" />
                          Responder
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
