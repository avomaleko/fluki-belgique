import { Link } from "@tanstack/react-router";
import { Library, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-muted/20 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Library className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold tracking-tight">FLAUKI</p>
              <p className="text-[11px] text-muted-foreground">
                Biblioteca Musical Espiritual
              </p>
            </div>
          </Link>

          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <Link to="/" className="text-muted-foreground hover:text-primary transition">
              Início
            </Link>
            <Link to="/library" className="text-muted-foreground hover:text-primary transition">
              Biblioteca
            </Link>
            <Link to="/upload" className="text-muted-foreground hover:text-primary transition">
              Enviar
            </Link>
            <Link to="/contact" className="text-muted-foreground hover:text-primary transition">
              Contacte-nos
            </Link>
          </nav>
        </div>

        <div className="mt-6 flex flex-col-reverse items-center justify-between gap-3 border-t border-border/60 pt-4 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} FLAUKI. Conteúdos religiosos com devoção.
          </p>
          <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Heart className="h-3.5 w-3.5 text-primary" />
            <span className="italic">"Cantai ao Senhor um cântico novo."</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
