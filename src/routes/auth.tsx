import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/app/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

type AuthSearch = { redirect?: string };

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  validateSearch: (s: Record<string, unknown>): AuthSearch => ({
    redirect: typeof s.redirect === "string" && s.redirect.startsWith("/") ? s.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Entrar ou registar — FLAUKI" },
      { name: "description", content: "Aceda à sua conta FLAUKI para enviar músicas para a Biblioteca Musical." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

function AuthPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [tab, setTab] = useState("signin");
  const [loading, setLoading] = useState(false);

  // sign in
  const [siEmail, setSiEmail] = useState("");
  const [siPass, setSiPass] = useState("");

  // sign up
  const [suEmail, setSuEmail] = useState("");
  const [suPass, setSuPass] = useState("");
  const [suName, setSuName] = useState("");

  // recover
  const [rcEmail, setRcEmail] = useState("");

  const goAfterAuth = () => {
    const dest = redirect ?? "/library";
    navigate({ to: dest, replace: true });
  };

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: siEmail, password: siPass });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Bem-vindo!");
    goAfterAuth();
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: suEmail,
      password: suPass,
      options: {
        emailRedirectTo: `${window.location.origin}/library`,
        data: { display_name: suName },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    if (data.session) {
      toast.success("Conta criada com sucesso!");
      goAfterAuth();
    } else {
      toast.success("Conta criada! Confirme o e-mail e inicie sessão.");
      setTab("signin");
    }
  };

  const recover = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(rcEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Enviámos um e-mail com o link de reposição.", {
      description: "Verifique também a pasta de spam.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto flex items-center justify-center px-4 py-10 sm:py-16">
        <Card className="w-full max-w-md shadow-[var(--shadow-elegant)]">
          <CardHeader>
            <CardTitle className="text-2xl">Acesso à FLAUKI</CardTitle>
            <p className="text-sm text-muted-foreground">
              Entre ou crie a sua conta para enviar músicas.
            </p>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="signin">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Registar</TabsTrigger>
                <TabsTrigger value="recover">Recuperar</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={signIn} className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="si-email">E-mail</Label>
                    <Input id="si-email" type="email" required value={siEmail} onChange={(e) => setSiEmail(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="si-pass">Palavra-passe</Label>
                    <PasswordInput id="si-pass" required value={siPass} onChange={(e) => setSiPass(e.target.value)} />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "A entrar..." : "Entrar"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setTab("recover")}
                    className="text-sm text-primary underline underline-offset-2"
                  >
                    Esqueci-me da palavra-passe
                  </button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={signUp} className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="su-name">Nome</Label>
                    <Input id="su-name" required value={suName} onChange={(e) => setSuName(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="su-email">E-mail</Label>
                    <Input id="su-email" type="email" required value={suEmail} onChange={(e) => setSuEmail(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="su-pass">Palavra-passe</Label>
                    <PasswordInput id="su-pass" required minLength={6} value={suPass} onChange={(e) => setSuPass(e.target.value)} />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "A criar..." : "Criar conta"}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Após criar conta, já pode partilhar músicas em <Link to="/upload" className="underline">Enviar</Link>.
                  </p>
                </form>
              </TabsContent>

              <TabsContent value="recover">
                <form onSubmit={recover} className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="rc-email">E-mail da conta</Label>
                    <Input id="rc-email" type="email" required value={rcEmail} onChange={(e) => setRcEmail(e.target.value)} />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "A enviar..." : "Enviar link de reposição"}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Receberá um e-mail com um link para definir uma nova palavra-passe.
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
