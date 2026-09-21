import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

type Props = { trackId: string; withLabel?: boolean; className?: string };

export function FavoriteButton({ trackId, withLabel = false, className }: Props) {
  const { user } = useAuth();
  const [fav, setFav] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) { setLoaded(true); return; }
    let active = true;
    supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("track_id", trackId)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        setFav(!!data);
        setLoaded(true);
      });
    return () => { active = false; };
  }, [user?.id, trackId]);

  if (!user) {
    return (
      <Button variant="outline" size="sm" asChild className={className} title="Inicie sessão para favoritar">
        <Link to="/auth"><Heart className="h-4 w-4" />{withLabel && <span className="ml-2">Favoritar</span>}</Link>
      </Button>
    );
  }

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    if (fav) {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("track_id", trackId);
      if (error) toast.error(error.message);
      else setFav(false);
    } else {
      const { error } = await supabase.from("favorites").insert({ user_id: user.id, track_id: trackId });
      if (error) toast.error(error.message);
      else setFav(true);
    }
    setBusy(false);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggle}
      disabled={busy || !loaded}
      aria-pressed={fav}
      aria-label={fav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      className={cn(fav && "border-primary/60 bg-primary/10 text-primary", className)}
    >
      <Heart className={cn("h-4 w-4", fav && "fill-current")} />
      {withLabel && <span className="ml-2">{fav ? "Nos favoritos" : "Favoritar"}</span>}
    </Button>
  );
}
