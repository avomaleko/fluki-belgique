import { Link } from "@tanstack/react-router";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Home, Library, Music2, Mail, ExternalLink, Upload, Tag, Heart, ListChecks, User as UserIcon, Shield } from "lucide-react";
import { useState } from "react";
import { useCategories } from "@/lib/categories";
import { useAuth } from "@/hooks/useAuth";

export function AppSidebar() {
  const [open, setOpen] = useState(false);
  const { categories } = useCategories();
  const { user, isAdmin } = useAuth();
  const close = () => setOpen(false);
  const itemCls =
    "flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 text-base font-medium shadow-sm hover:shadow-[var(--shadow-elegant)] hover:border-primary/40 hover:-translate-y-0.5 transition";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label="Abrir menu"
          className="gap-2 border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/60 shadow-sm transition relative"
        >
          <Menu className="h-5 w-5" />
          <span className="hidden sm:inline font-medium">Menu</span>
          <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-primary animate-pulse sm:hidden" aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 flex flex-col">
        <SheetHeader>
          <SheetTitle className="text-left text-xl">FLAUKI</SheetTitle>
          <SheetDescription className="text-left text-sm">Biblioteca Musical Virtual</SheetDescription>
        </SheetHeader>

        <nav className="mt-6 flex flex-col gap-2 px-2 overflow-y-auto pb-6">
          <Link to="/home" onClick={close} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 text-base font-medium shadow-sm hover:shadow-[var(--shadow-elegant)] hover:border-primary/40 hover:-translate-y-0.5 transition">
            <Home className="h-5 w-5 text-primary" /> Página Inicial
          </Link>
          <Link to="/library" onClick={close} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 text-base font-medium shadow-sm hover:shadow-[var(--shadow-elegant)] hover:border-primary/40 hover:-translate-y-0.5 transition">
            <Library className="h-5 w-5 text-primary" /> Biblioteca Musical
          </Link>
          <Link to="/upload" onClick={close} className="flex items-center gap-3 rounded-xl border border-primary/40 bg-primary/5 px-4 py-3 text-base font-medium shadow-sm hover:shadow-[var(--shadow-elegant)] hover:border-primary/60 hover:-translate-y-0.5 transition">
            <Upload className="h-5 w-5 text-primary" /> Enviar conteúdo
          </Link>
          <a
            href="https://partisolfa.lovable.app"
            target="_blank"
            rel="noreferrer"
            onClick={close}
            className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 text-base font-medium shadow-sm hover:shadow-[var(--shadow-elegant)] hover:border-primary/40 hover:-translate-y-0.5 transition"
          >
            <span className="flex items-center gap-3"><Music2 className="h-5 w-5 text-primary" /> Partisolfa</span>
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
          </a>
          <Link to="/contact" onClick={close} className={itemCls}>
            <Mail className="h-5 w-5 text-primary" /> Contacte-nos
          </Link>

          <div className="mt-4 flex flex-col gap-2">
            <p className="px-2 mb-1 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">A minha área</p>
            <Link to="/profile" onClick={close} className={itemCls}>
              <UserIcon className="h-5 w-5 text-primary" /> {user ? "Perfil" : "Entrar na conta"}
            </Link>
            <Link to="/favorites" onClick={close} className={itemCls}>
              <Heart className="h-5 w-5 text-primary" /> Favoritos
            </Link>
            <Link to="/my-submissions" onClick={close} className={itemCls}>
              <ListChecks className="h-5 w-5 text-primary" /> Minhas submissões
            </Link>
            {isAdmin && (
              <Link to="/admin" onClick={close} className={itemCls}>
                <Shield className="h-5 w-5 text-primary" /> Administração
              </Link>
            )}
          </div>

          {categories.length > 0 && (
            <div className="mt-4">
              <p className="px-2 mb-2 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" /> Categorias
              </p>
              <div className="flex flex-col gap-1">
                {categories.map((c) => (
                  <Link
                    key={c.value}
                    to="/library"
                    search={{ cats: c.value, page: 1 }}
                    onClick={close}
                    className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition"
                  >
                    {c.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
