import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/app/Header";
import { Footer } from "@/components/app/Footer";
import { FavoriteButton } from "@/components/app/FavoriteButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { categoryLabel } from "@/lib/categories";
import { Heart, FileText, Music, Image as ImgIcon } from "lucide-react";

export const Route = createFileRoute("/favorites")({
  component: FavoritesPage,
  head: () => ({
    meta: [
      { title: "Favoritos — FLAUKI Biblioteca Musical" },
      { name: "description", content: "As músicas que guardou como favoritas na Biblioteca Musical FLAUKI." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

type FavTrack = {
  id: string;
  title: string;
  author: string | null;
  category: string;
  audio_path: string | null;
  image_paths: string[];
  created_at: string;
};

function FavoritesPage() {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<FavTrack[] | null>(null);

  useEffect(() => {
    if (!user) { setItems([]); return; }
    let active = true;
    supabase
      .from("favorites")
      .select("created_at, tracks(id,title,author,category,audio_path,image_paths,created_at)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!active) return;
        const list = (data ?? [])
          .map((r) => (r as unknown as { tracks: FavTrack | null }).tracks)
          .filter((t): t is FavTrack => !!t);
        setItems(list);
      });
    return () => { active = false; };
  }, [user?.id]);

  if (loading) {
    return <div className="min-h-screen bg-background"><Header /><p className="container mx-auto p-8 text-muted-foreground">A carregar...</p></div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="container mx-auto flex-1 px-4 py-16 max-w-md">
          <Card>
            <CardContent className="py-10 text-center space-y-4">
              <Heart className="mx-auto h-10 w-10 text-primary" />
              <p>Inicie sessão para guardar e ver as suas músicas favoritas.</p>
              <Button asChild><Link to="/auth">Entrar / Registar</Link></Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="container mx-auto flex-1 px-4 py-8 sm:py-10 max-w-4xl">
        <h1 className="mb-1 flex items-center gap-2 text-2xl sm:text-3xl font-bold">
          <Heart className="h-6 w-6 text-primary" /> Favoritos
        </h1>
        <p className="mb-6 text-sm sm:text-base text-muted-foreground">
          {items === null ? "A carregar..." : `${items.length} música(s) guardada(s).`}
        </p>

        {items !== null && items.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <Heart className="mx-auto h-10 w-10 text-muted-foreground" />
              <p>Ainda não tem favoritos. Toque no coração numa música para a guardar aqui.</p>
              <Button asChild><Link to="/library">Explorar a Biblioteca</Link></Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {items?.map((t) => (
            <Card key={t.id} className="border-border/60">
              <CardContent className="p-4 space-y-2">
                <Badge variant="secondary" className="text-xs">{categoryLabel(t.category)}</Badge>
                <h2 className="font-semibold leading-tight">
                  <Link to="/track/$id" params={{ id: t.id }} className="hover:text-primary transition">{t.title}</Link>
                </h2>
                {t.author && <p className="text-xs text-muted-foreground truncate">Arranjado por: {t.author}</p>}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><FileText className="h-3.5 w-3.5" />PDF</span>
                  {t.audio_path && <span className="inline-flex items-center gap-1"><Music className="h-3.5 w-3.5" />Áudio</span>}
                  {t.image_paths?.length > 0 && <span className="inline-flex items-center gap-1"><ImgIcon className="h-3.5 w-3.5" />{t.image_paths.length}</span>}
                </div>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" asChild><Link to="/track/$id" params={{ id: t.id }}>Abrir</Link></Button>
                  <FavoriteButton trackId={t.id} withLabel />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
