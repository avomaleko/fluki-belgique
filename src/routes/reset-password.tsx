import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/app/Header";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
  head: () => ({
    meta: [
      { title: "Definir nova palavra-passe — FLAUKI" },
      { name: "description", content: "Defina uma nova palavra-passe para a sua conta FLAUKI." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pass.length < 6) return toast.error("A palavra-passe deve ter pelo menos 6 caracteres.");
    if (pass !== pass2) return toast.error("As palavras-passe não coincidem.");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pass });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Palavra-passe atualizada!");
    navigate({ to: "/library" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto flex items-center justify-center px-4 py-12 sm:py-16">
        <Card className="w-full max-w-md shadow-[var(--shadow-elegant)]">
          <CardHeader>
            <CardTitle className="text-2xl">Nova palavra-passe</CardTitle>
          </CardHeader>
          <CardContent>
            {!ready ? (
              <p className="text-sm text-muted-foreground">
                Abra esta página através do link que recebeu por e-mail para poder definir uma nova palavra-passe.
              </p>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <Label htmlFor="np">Nova palavra-passe</Label>
                  <PasswordInput id="np" required minLength={6} value={pass} onChange={(e) => setPass(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="np2">Repetir palavra-passe</Label>
                  <PasswordInput id="np2" required minLength={6} value={pass2} onChange={(e) => setPass2(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "A guardar..." : "Guardar palavra-passe"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
