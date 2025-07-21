import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, MessageCircle, User } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function CommunityPreview() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const { data: posts, isLoading } = useQuery({
    queryKey: ["/api/posts"],
    select: (data) => data.slice(0, 3), // Show only first 3 posts
  });

  const handleGoToPost = (postId: number) => {
    setLocation(`/community?post=${postId}`);
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "agora";
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    return `${Math.floor(diffInHours / 24)}d atrás`;
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
    <section className="mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Comunidade - Últimas Mensagens</CardTitle>
          <Button
            variant="outline"
            onClick={() => setLocation("/community")}
          >
            Ver Todas
          </Button>
        </CardHeader>
        <CardContent>
          {!posts?.length ? (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Nenhuma mensagem ainda
              </p>
              <Button
                onClick={() => setLocation("/community")}
                className="mt-4"
              >
                Começar conversa
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post: any) => (
                <div
                  key={post.id}
                  className="flex items-start p-4 bg-muted rounded-lg"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-foreground">
                        {post.author?.name}
                      </h4>
                      <span className="text-sm text-muted-foreground">
                        {formatTimeAgo(post.createdAt)}
                      </span>
                    </div>
                    {post.flagged && user?.role !== 'institution' ? (
                      <p className="text-sm text-muted-foreground mb-2 italic">
                        Este post foi sinalizado pelo admin
                      </p>
                    ) : (
                      <p className="text-sm text-foreground mb-2">
                        {post.content}
                      </p>
                    )}
                    <div className="flex items-center justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleGoToPost(post.id)}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Ver post
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
