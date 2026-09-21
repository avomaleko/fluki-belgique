import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/app/Header";
import { Footer } from "@/components/app/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { User as UserIcon, Heart, Music, KeyRound, Shield, Save } from "lucide-react";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [
      { title: "A minha área — FLAUKI Biblioteca Musical" },
      { name: "description", content: "Gerir o seu nome, palavra-passe, favoritos e músicas enviadas na Biblioteca FLAUKI." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

function ProfilePage() {
  const { user, loading, isAdmin, refresh } = useAuth();
  const [name, setName] = useState("");
  const [savedName, setSavedName] = useState("");
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [stats, setStats] = useState({ favorites: 0, submissions: 0, published: 0, pending: 0 });

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const [{ data: prof }, { count: favCount }, { data: tracks }] = await Promise.all([
        supabase.from("profiles").select("display_name,email").eq("id", user.id).maybeSingle(),
        supabase.from("favorites").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("tracks").select("status").eq("uploaded_by", user.id),
      ]);
      if (!active) return;
      const n = (prof?.display_name ?? prof?.email ?? user.email ?? "") as string;
      setName(n);
      setSavedName(n);
      const list = tracks ?? [];
      setStats({
        favorites: favCount ?? 0,
        submissions: list.length,
        published: list.filter((t) => t.status === "approved").length,
        pending: list.filter((t) => t.status === "pending" || t.status === "needs_fix").length,
      });
    })();
    return () => { active = false; };
  }, [user?.id]);

  const saveName = async () => {
    const value = name.trim();
    if (value.length < 2 || value.length > 80) return toast.error("O nome deve ter entre 2 e 80 caracteres.");
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ display_name: value }).eq("id", user!.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    setSavedName(value);
    toast.success("Nome atualizado.");
    refresh();
  };

  const changePassword = async () => {
    if (pw1.length < 6) return toast.error("A palavra-passe deve ter pelo menos 6 caracteres.");
    if (pw1 !== pw2) return toast.error("As palavras-passe não coincidem.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw1 });
    setBusy(false);
    if (error) return toast.error(error.message);
    setPw1(""); setPw2("");
    toast.success("Palavra-passe alterada.");
  };

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
              <UserIcon className="mx-auto h-10 w-10 text-primary" />
              <p>Inicie sessão para acessar a sua área pessoal.</p>
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
      <div className="container mx-auto flex-1 px-4 py-8 sm:py-10 max-w-3xl space-y-5">
        <div>
          <h1 className="flex flex-wrap items-center gap-2 text-2xl sm:text-3xl font-bold">
            <UserIcon className="h-6 w-6 text-primary" /> A minha área
            {isAdmin && <Badge className="gap-1"><Shield className="h-3 w-3" />Administrador</Badge>}
          </h1>
          <p className="mt-1 text-sm sm:text-base text-muted-foreground break-all">{savedName || user.email} · {user.email}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link to="/favorites" className="rounded-xl border border-border/60 bg-card p-4 transition hover:border-primary/50 hover:shadow-[var(--shadow-elegant)]">
            <Heart className="h-5 w-5 text-primary" />
            <p className="mt-2 text-2xl font-bold">{stats.favorites}</p>
            <p className="text-xs text-muted-foreground">Favoritos</p>
          </Link>
          <Link to="/my-submissions" className="rounded-xl border border-border/60 bg-card p-4 transition hover:border-primary/50 hover:shadow-[var(--shadow-elegant)]">
            <Music className="h-5 w-5 text-primary" />
            <p className="mt-2 text-2xl font-bold">{stats.submissions}</p>
            <p className="text-xs text-muted-foreground">Submissões</p>
          </Link>
          <div className="rounded-xl border border-border/60 bg-card p-4">
            <p className="text-2xl font-bold">{stats.published}</p>
            <p className="text-xs text-muted-foreground">Publicadas</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-card p-4">
            <p className="text-2xl font-bold">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">Em análise</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dados pessoais</CardTitle>
            <CardDescription>O nome aparece nas suas submissões e no menu da conta.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="pname">Nome</Label>
              <Input id="pname" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pmail">E-mail</Label>
              <Input id="pmail" value={user.email ?? ""} disabled />
            </div>
            <Button onClick={saveName} disabled={busy || name.trim() === savedName}>
              <Save className="h-4 w-4 mr-2" />Guardar nome
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><KeyRound className="h-5 w-5" />Alterar palavra-passe</CardTitle>
            <CardDescription>Mínimo de 6 caracteres. Será mantido em sessão após a alteração.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="pw1">Nova palavra-passe</Label>
              <PasswordInput id="pw1" value={pw1} onChange={(e) => setPw1(e.target.value)} autoComplete="new-password" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pw2">Confirmar nova palavra-passe</Label>
              <PasswordInput id="pw2" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" />
            </div>
            <Button onClick={changePassword} disabled={busy || !pw1 || !pw2}>Alterar palavra-passe</Button>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
