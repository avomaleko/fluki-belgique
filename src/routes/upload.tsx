import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/app/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCategories, fetchCategories, categoryLabel } from "@/lib/categories";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Upload as UploadIcon, FileText, Music as MusicIcon, Image as ImgIcon, Plus, AlertCircle, Eye, Pencil, Trash2 } from "lucide-react";
import { deleteTrackAndAssets } from "@/lib/tracks";


export const Route = createFileRoute("/upload")({
  component: UploadPage,
  head: () => ({
    meta: [
      { title: "Enviar nova música — FLAUKI" },
      { name: "description", content: "Partilhe a sua música — partitura em PDF, áudio MP3 e imagens — com a Biblioteca Musical FLAUKI." },
      { property: "og:title", content: "Enviar nova música — FLAUKI" },
      { property: "og:description", content: "Partilhe a sua música com a Biblioteca Musical FLAUKI." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});


const MAX_PDF = 10 * 1024 * 1024;
const MAX_AUDIO = 10 * 1024 * 1024;
const MAX_IMAGE = 8 * 1024 * 1024;
const MAX_IMAGES = 10;
const ALLOWED_IMAGE = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_AUDIO = ["audio/mpeg", "audio/mp3"];

const normalizeSpaces = (s: string) => s.replace(/\s+/g, " ").trim();
const AUTHOR_VALID_RE = /^[\p{L}][\p{L}\p{M}\s.'\-]*[\p{L}.]?$/u;

const metaSchema = z.object({
  title: z.string().trim().min(1, "Título obrigatório").max(200),
  author: z
    .string()
    .trim()
    .max(150)
    .refine((v) => v === "" || AUTHOR_VALID_RE.test(v), {
      message: "Autor inválido: use apenas letras, espaços e . ' -",
    })
    .optional()
    .or(z.literal("")),
  category: z.string().min(1, "Categoria obrigatória"),
});

function safeName(name: string) {
  return name.replace(/[^\w.\-]+/g, "_").slice(0, 120);
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

function fmtSize(b: number) {
  return b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function validatePdf(file: File): string | null {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) return "O ficheiro deve ser um PDF.";
  if (file.size > MAX_PDF) return `PDF excede ${(MAX_PDF / 1024 / 1024).toFixed(0)} MB.`;
  return null;
}
function validateAudio(file: File): string | null {
  if (!ALLOWED_AUDIO.includes(file.type) && !file.name.toLowerCase().endsWith(".mp3")) return "Áudio deve ser MP3.";
  if (file.size > MAX_AUDIO) return `Áudio excede ${(MAX_AUDIO / 1024 / 1024).toFixed(0)} MB.`;
  return null;
}
function validateImage(file: File): string | null {
  if (!ALLOWED_IMAGE.includes(file.type)) return `'${file.name}': formato não suportado (use JPG, PNG, WEBP ou GIF).`;
  if (file.size > MAX_IMAGE) return `'${file.name}' excede ${(MAX_IMAGE / 1024 / 1024).toFixed(0)} MB.`;
  return null;
}

type Submission = { id: string; title: string; status: string; created_at: string; rejection_reason: string | null; pdf_path: string | null; audio_path: string | null; image_paths: string[] | null };

function UploadPage() {
  const { user, canUpload, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { categories } = useCategories();

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState<string>("");
  const [pdf, setPdf] = useState<File | null>(null);
  const [audio, setAudio] = useState<File | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [authorSuggestions, setAuthorSuggestions] = useState<string[]>([]);
  const [showAuthorList, setShowAuthorList] = useState(false);
  const [mySubmissions, setMySubmissions] = useState<Submission[]>([]);

  // New category dialog (admin only)
  const [newCatOpen, setNewCatOpen] = useState(false);
  const [newCatLabel, setNewCatLabel] = useState("");
  const [newCatBusy, setNewCatBusy] = useState(false);

  const loadMySubmissions = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("tracks")
      .select("id,title,status,created_at,rejection_reason,pdf_path,audio_path,image_paths")
      .eq("uploaded_by", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    setMySubmissions((data ?? []) as Submission[]);
  };

  useEffect(() => {
    if (canUpload && user) loadMySubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUpload, user?.id]);

  useEffect(() => {
    supabase
      .from("tracks")
      .select("author")
      .not("author", "is", null)
      .then(({ data }) => {
        const set = new Set<string>();
        (data ?? []).forEach((r: any) => {
          const a = (r.author ?? "").toString().trim();
          if (a) set.add(a);
        });
        setAuthorSuggestions(Array.from(set).sort((a, b) => a.localeCompare(b)));
      });
  }, []);

  const filteredAuthors = useMemo(() => {
    const q = author.trim().toLowerCase();
    if (!q) return authorSuggestions.slice(0, 8);
    return authorSuggestions.filter((a) => a.toLowerCase().includes(q)).slice(0, 8);
  }, [author, authorSuggestions]);

  const pdfPreview = useMemo(() => (pdf ? URL.createObjectURL(pdf) : null), [pdf]);
  const audioPreview = useMemo(() => (audio ? URL.createObjectURL(audio) : null), [audio]);
  const imagePreviews = useMemo(() => images.map((f) => ({ name: f.name, url: URL.createObjectURL(f) })), [images]);
  useEffect(() => () => { if (pdfPreview) URL.revokeObjectURL(pdfPreview); }, [pdfPreview]);
  useEffect(() => () => { if (audioPreview) URL.revokeObjectURL(audioPreview); }, [audioPreview]);
  useEffect(() => () => { imagePreviews.forEach((p) => URL.revokeObjectURL(p.url)); }, [imagePreviews]);

  const hasAnyPreview = title || author || category || pdf || audio || images.length > 0;

  // File handlers with immediate validation
  const onPickPdf = (f: File | null) => {
    if (!f) { setPdf(null); return; }
    const err = validatePdf(f);
    if (err) { toast.error(err); return; }
    setPdf(f);
  };
  const onPickAudio = (f: File | null) => {
    if (!f) { setAudio(null); return; }
    const err = validateAudio(f);
    if (err) { toast.error(err); return; }
    setAudio(f);
  };
  const onPickImages = (files: File[]) => {
    if (files.length === 0) { setImages([]); return; }
    if (files.length > MAX_IMAGES) { toast.error(`Máximo ${MAX_IMAGES} imagens.`); return; }
    for (const img of files) {
      const err = validateImage(img);
      if (err) { toast.error(err); return; }
    }
    setImages(files);
  };

  if (loading) return <div className="min-h-screen bg-background"><Header /><p className="container mx-auto p-8 text-muted-foreground">A carregar...</p></div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 max-w-md">
          <Card>
            <CardContent className="py-10 text-center space-y-4">
              <p>Precisa de iniciar sessão para enviar músicas.</p>
              <Button asChild><Link to="/auth">Entrar / Registar</Link></Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!canUpload) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 max-w-md">
          <Card>
            <CardContent className="py-10 text-center space-y-4">
              <p>Precisa de iniciar sessão para enviar músicas.</p>
              <Button asChild><Link to="/auth">Entrar / Registar</Link></Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }


  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedTitle = normalizeSpaces(title);
    const cleanedAuthor = normalizeSpaces(author);
    const meta = metaSchema.safeParse({ title: cleanedTitle, author: cleanedAuthor, category });
    if (!meta.success) return toast.error(meta.error.issues[0].message);
    if (!pdf) return toast.error("PDF é obrigatório.");

    setSubmitting(true);
    try {
      const stamp = Date.now();
      const baseDir = `${user.id}/${stamp}`;

      const pdfPath = `${baseDir}/${safeName(pdf.name)}`;
      const { error: pdfErr } = await supabase.storage.from("pdfs").upload(pdfPath, pdf, { upsert: false, contentType: "application/pdf" });
      if (pdfErr) throw pdfErr;

      let audioPath: string | null = null;
      if (audio) {
        audioPath = `${baseDir}/${safeName(audio.name)}`;
        const { error } = await supabase.storage.from("audios").upload(audioPath, audio, { contentType: audio.type || "audio/mpeg" });
        if (error) throw error;
      }

      const imagePaths: string[] = [];
      for (const img of images) {
        const p = `${baseDir}/${safeName(img.name)}`;
        const { error } = await supabase.storage.from("images").upload(p, img, { contentType: img.type });
        if (error) throw error;
        imagePaths.push(p);
      }

      const { error: insErr } = await supabase.from("tracks").insert({
        title: meta.data.title,
        author: meta.data.author || null,
        category: meta.data.category,
        pdf_path: pdfPath,
        audio_path: audioPath,
        image_paths: imagePaths,
        uploaded_by: user.id,
        status: "pending",
      });
      if (insErr) throw insErr;

      toast.success("Música enviada!", {
        description: "O envio ficou em análise. Será notificado quando for publicado.",
      });
      setTitle(""); setAuthor(""); setCategory("");
      setPdf(null); setAudio(null); setImages([]);
      navigate({ to: "/my-submissions" });
    } catch (err: any) {
      toast.error(err.message ?? "Erro no envio");
    } finally {
      setSubmitting(false);
    }
  };


  const createCategory = async () => {
    const label = newCatLabel.trim();
    if (label.length < 2) return toast.error("Nome de categoria muito curto.");
    if (label.length > 60) return toast.error("Nome de categoria muito longo.");
    let value = slugify(label);
    if (!value) return toast.error("Nome inválido.");
    setNewCatBusy(true);
    // Ensure uniqueness
    if (categories.some((c) => c.value === value)) {
      value = `${value}-${Date.now().toString(36).slice(-4)}`;
    }
    const { error } = await supabase.from("categories").insert({ value, label });
    setNewCatBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Categoria criada!");
    await fetchCategories(true);
    setCategory(value);
    setNewCatLabel("");
    setNewCatOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-10 max-w-2xl">
        <Card className="border-2 border-primary/40 shadow-[var(--shadow-elegant)]">
          <CardHeader><CardTitle>Enviar nova música</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-5">
              <div>
                <Label className="font-semibold text-foreground">Título da música *</Label>
                <Input required value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} className="border-2 border-primary/30 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 bg-background" />
              </div>

              <div className="relative">
                <Label className="font-semibold text-foreground">Arranjado pelo:</Label>
                <Input
                  value={author}
                  onChange={(e) => { setAuthor(e.target.value); setShowAuthorList(true); }}
                  onFocus={() => setShowAuthorList(true)}
                  onBlur={() => setTimeout(() => setShowAuthorList(false), 150)}
                  maxLength={150}
                  placeholder="Nome de quem arranjou (opcional)"
                  autoComplete="off"
                  className="border-2 border-primary/30 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 bg-background"
                />
                {showAuthorList && filteredAuthors.length > 0 && (
                  <ul className="absolute z-20 mt-1 w-full max-h-56 overflow-auto rounded-md border border-border bg-popover shadow-md">
                    {filteredAuthors.map((a) => (
                      <li key={a}>
                        <button
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); setAuthor(a); setShowAuthorList(false); }}
                          className="block w-full text-left px-3 py-2 text-sm hover:bg-accent"
                        >
                          {a}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-1 text-xs text-muted-foreground">Sugestões com base em nomes já cadastrados.</p>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2">
                  <Label className="font-semibold text-foreground">Categoria *</Label>
                  {isAdmin && (
                    <Button type="button" size="sm" variant="outline" onClick={() => setNewCatOpen(true)}>
                      <Plus className="h-4 w-4 mr-1" /> Nova categoria
                    </Button>
                  )}
                </div>
                <Select value={category} onValueChange={(v) => setCategory(v)}>
                  <SelectTrigger className="border-2 border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/30 bg-background">
                    <SelectValue placeholder="Escolha uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!isAdmin && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Não encontra a categoria? Solicite ao administrador através da{" "}
                    <Link to="/contact" className="underline text-primary">página de contacto</Link>.
                  </p>
                )}
              </div>

              <div>
                <Label className="font-semibold text-foreground">PDF * <span className="text-xs text-muted-foreground font-normal">(máx. 10 MB)</span></Label>
                <Input type="file" accept="application/pdf" required onChange={(e) => onPickPdf(e.target.files?.[0] ?? null)} className="border-2 border-primary/30 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 bg-background" />
              </div>

              <div>
                <Label className="font-semibold text-foreground">Áudio (MP3) — opcional <span className="text-xs text-muted-foreground font-normal">(máx. 10 MB)</span></Label>
                <Input type="file" accept="audio/mpeg,audio/mp3,.mp3" onChange={(e) => onPickAudio(e.target.files?.[0] ?? null)} className="border-2 border-primary/30 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 bg-background" />
              </div>

              <div>
                <Label className="font-semibold text-foreground">Imagens — opcional <span className="text-xs text-muted-foreground font-normal">(máx. 10 ficheiros, 8 MB cada — JPG/PNG/WEBP/GIF)</span></Label>
                <Input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={(e) => onPickImages(Array.from(e.target.files ?? []))} className="border-2 border-primary/30 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 bg-background" />
                {images.length > 0 && <p className="mt-1 text-xs text-muted-foreground">{images.length} ficheiro(s) selecionado(s)</p>}
              </div>

              {hasAnyPreview && (
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Pré-visualização</h3>
                    <span className="text-xs text-muted-foreground">Antes de submeter</span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg bg-background p-3 border border-border/60">
                      <p className="text-xs text-muted-foreground">Título</p>
                      <p className="font-medium truncate">{title || <span className="text-muted-foreground italic">— em falta</span>}</p>
                    </div>
                    <div className="rounded-lg bg-background p-3 border border-border/60">
                      <p className="text-xs text-muted-foreground">Categoria</p>
                      <p className="font-medium">{category ? categoryLabel(category) : <span className="text-muted-foreground italic">— em falta</span>}</p>
                    </div>
                    {author && (
                      <div className="rounded-lg bg-background p-3 border border-border/60 sm:col-span-2">
                        <p className="text-xs text-muted-foreground">Arranjado pelo</p>
                        <p className="font-medium truncate">{author}</p>
                      </div>
                    )}
                  </div>
                  {pdf && pdfPreview && (
                    <div className="rounded-lg bg-background border border-border/60 overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 text-sm">
                        <span className="inline-flex items-center gap-2 font-medium"><FileText className="h-4 w-4 text-primary" /> {pdf.name}</span>
                        <span className="text-xs text-muted-foreground">{fmtSize(pdf.size)}</span>
                      </div>
                      <iframe src={pdfPreview} className="w-full h-72 bg-background" title="Pré-visualização do PDF" />
                    </div>
                  )}
                  {audio && audioPreview && (
                    <div className="rounded-lg bg-background border border-border/60 p-3">
                      <div className="flex items-center justify-between mb-2 text-sm">
                        <span className="inline-flex items-center gap-2 font-medium"><MusicIcon className="h-4 w-4 text-primary" /> {audio.name}</span>
                        <span className="text-xs text-muted-foreground">{fmtSize(audio.size)}</span>
                      </div>
                      <audio controls src={audioPreview} className="w-full" />
                    </div>
                  )}
                  {imagePreviews.length > 0 && (
                    <div className="rounded-lg bg-background border border-border/60 p-3">
                      <p className="text-sm font-medium inline-flex items-center gap-2 mb-2"><ImgIcon className="h-4 w-4 text-primary" /> {imagePreviews.length} imagem(ns)</p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {imagePreviews.map((p) => (
                          <img key={p.url} src={p.url} alt={p.name} className="aspect-square w-full rounded-md object-cover border border-border/60" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "A enviar..." : "Enviar música"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardContent className="py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <p className="font-medium">Os meus envios</p>
              <p className="text-sm text-muted-foreground">Veja o estado de cada música que enviou.</p>
            </div>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link to="/my-submissions">Abrir “Minhas submissões”</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={newCatOpen} onOpenChange={setNewCatOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova categoria</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Nome da categoria</Label>
            <Input
              value={newCatLabel}
              onChange={(e) => setNewCatLabel(e.target.value)}
              placeholder="Ex.: Hinos de Natal"
              maxLength={60}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">Apenas administradores podem criar categorias.</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNewCatOpen(false)}>Cancelar</Button>
            <Button onClick={createCategory} disabled={newCatBusy}>{newCatBusy ? "A criar..." : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
