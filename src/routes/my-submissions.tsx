import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/app/Header";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { FileText, Music as MusicIcon, Wrench } from "lucide-react";

type Submission = {
  id: string;
  title: string;
  author: string | null;
  category: string;
  status: string;
  rejection_reason: string | null;
  created_at: string;
};

export const Route = createFileRoute("/my-submissions")({
  component: MySubmissionsPage,
  head: () => ({
    meta: [
      { title: "Minhas submissões — FLAUKI Biblioteca Musical" },
      { name: "description", content: "Acompanhe o estado das músicas que enviou: Pendente, Publicada, Requer correção ou Rejeitada." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

function MySubmissionsPage() {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<Submission[] | null>(null);

  useEffect(() => {
    if (!user) { setItems([]); return; }
    let active = true;
    supabase
      .from("tracks")
      .select("id,title,author,category,status,rejection_reason,created_at")
      .eq("uploaded_by", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) toast.error(error.message);
        setItems((data ?? []) as Submission[]);
      });
    return () => { active = false; };
  }, [user?.id]);

  if (loading) return <div className="min-h-screen bg-background"><Header /><p className="container mx-auto p-8 text-muted-foreground">A carregar...</p></div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 max-w-md">
          <Card>
            <CardContent className="py-10 text-center space-y-4">
              <p>Precisa de iniciar sessão para ver as suas submissões.</p>
              <Button asChild><Link to="/auth">Entrar / Registar</Link></Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <h1 className="mb-1 text-2xl font-bold">Minhas submissões</h1>
        <p className="mb-6 text-sm text-muted-foreground">Estado de cada música que enviou.</p>

        {items === null && <p className="text-muted-foreground">A carregar...</p>}
        {items !== null && items.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center space-y-4">
              <MusicIcon className="mx-auto h-10 w-10 text-muted-foreground" />
              <p>Ainda não enviou nenhuma música.</p>
              <Button asChild><Link to="/upload">Enviar nova música</Link></Button>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {items?.map((t) => (
            <Card key={t.id}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base">
                    <Link to="/track/$id" params={{ id: t.id }} className="hover:underline">{t.title}</Link>
                  </CardTitle>
                  <StatusBadge status={t.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {t.author && <span className="inline-flex items-center gap-1"><FileText className="h-3.5 w-3.5" />Arranjado por: {t.author}</span>}
                  <span>{new Date(t.created_at).toLocaleDateString("pt-PT")}</span>
                </div>
                {(t.status === "needs_fix" || t.status === "rejected") && t.rejection_reason && (
                  <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
                    <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    <div>
                      <p className="font-medium">{t.status === "rejected" ? "Motivo da rejeição" : "Correção pedida pelo administrador"}:</p>
                      <p className="whitespace-pre-wrap">{t.rejection_reason}</p>
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button size="sm" variant="outline" asChild><Link to="/track/$id" params={{ id: t.id }}>Ver página</Link></Button>
                  <Button size="sm" variant="outline" asChild><Link to="/track/$id/edit" params={{ id: t.id }}>Editar</Link></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
