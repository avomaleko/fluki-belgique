import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Download, ExternalLink, FileText, Loader2, Smartphone, Maximize2, Minimize2 } from "lucide-react";
import { getSignedUrl, getSignedUrls } from "@/lib/storage";
import { supabase } from "@/integrations/supabase/client";
import { AudioPlayer } from "@/components/app/AudioPlayer";

type Props = {
  pdfPath: string;
  audioPath: string | null;
  imagePaths: string[];
  title: string;
  allowDownload: boolean;
  trackId?: string;
  countable?: boolean;
};

function isMobileUA() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

export function MediaViewer({ pdfPath, audioPath, imagePaths, title, allowDownload, trackId, countable }: Props) {
  const playedRef = useRef(false);
  const downloadedRef = useRef(false);
  const isMobile = useMemo(() => isMobileUA(), []);

  const onPlay = () => {
    if (!countable || !trackId || playedRef.current) return;
    playedRef.current = true;
    supabase.rpc("increment_track_play", { _track_id: trackId }).then(() => {}).catch(() => {});
  };
  const onDownload = () => {
    if (!countable || !trackId || downloadedRef.current) return;
    downloadedRef.current = true;
    supabase.rpc("increment_track_download", { _track_id: trackId }).then(() => {}).catch(() => {});
  };

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfError, setPdfError] = useState(false);
  const [pdfFullscreen, setPdfFullscreen] = useState(false);

  // Responsive PDF height — usa 100svh em mobile (sem barras do browser),
  // descontando header (~64) e barra de ações (~56) com folga.
  const [pdfHeight, setPdfHeight] = useState<string>("70vh");
  useEffect(() => {
    const compute = () => {
      if (typeof window === "undefined") return;
      const vh = window.innerHeight;
      // mobile: usa quase todo o ecrã; desktop: 70-80vh
      if (window.innerWidth < 640) {
        setPdfHeight(`${Math.max(360, vh - 220)}px`);
      } else {
        setPdfHeight(`${Math.max(480, Math.min(900, vh - 240))}px`);
      }
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  // Bloquear scroll do body em fullscreen
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (pdfFullscreen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [pdfFullscreen]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setPdfError(false);
    Promise.all([
      getSignedUrl("pdfs", pdfPath),
      audioPath ? getSignedUrl("audios", audioPath) : Promise.resolve(null),
      getSignedUrls("images", imagePaths),
    ]).then(([p, a, imgs]) => {
      if (!active) return;
      setPdfUrl(p);
      setAudioUrl(a);
      setImageUrls(imgs);
      setLoading(false);
    });
    return () => { active = false; };
  }, [pdfPath, audioPath, imagePaths.join(",")]);

  // Google Docs viewer as a robust fallback for mobile browsers without native PDF support
  const googleViewerUrl = pdfUrl
    ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(pdfUrl)}`
    : null;

  const closeLightbox = () => setLightboxIndex(null);
  const prevImage = () =>
    setLightboxIndex((i) => (i === null ? null : (i - 1 + imageUrls.length) % imageUrls.length));
  const nextImage = () =>
    setLightboxIndex((i) => (i === null ? null : (i + 1) % imageUrls.length));

  const renderPdfIframe = (heightStyle: string) => (
    <iframe
      src={isMobile ? (googleViewerUrl ?? undefined) : `${pdfUrl}#toolbar=1&view=FitH`}
      className="w-full bg-background"
      style={{ height: heightStyle }}
      title={title}
      onError={() => setPdfError(true)}
    />
  );

  return (
    <div className="space-y-6">
      {audioUrl && (
        <Card>
          <CardContent className="p-3 sm:p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="text-sm font-medium">Áudio</p>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" asChild>
                  <a href={audioUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Abrir</span>
                  </a>
                </Button>
                {allowDownload && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={audioUrl} target="_blank" rel="noreferrer" download onClick={onDownload}>
                      <Download className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Descarregar</span>
                    </a>
                  </Button>
                )}
              </div>
            </div>
            <AudioPlayer src={audioUrl} title={title} onPlay={onPlay} />
            {!allowDownload && (
              <p className="text-[11px] text-muted-foreground">
                O autor permitiu apenas a audição e a visualização deste conteúdo.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 bg-muted/50 px-3 sm:px-4 py-2 border-b border-border">
          <span className="text-sm font-medium">Partitura (PDF)</span>
          <div className="flex flex-wrap gap-2">
            {pdfUrl && (
              <Button size="sm" variant="outline" onClick={() => setPdfFullscreen(true)}>
                <Maximize2 className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Ecrã cheio</span>
              </Button>
            )}
            {pdfUrl && (
              <Button size="sm" variant="outline" asChild>
                <a href={pdfUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Nova aba</span>
                </a>
              </Button>
            )}
            {allowDownload && pdfUrl && (
              <Button size="sm" variant="outline" asChild>
                <a href={pdfUrl} target="_blank" rel="noreferrer" download onClick={onDownload}>
                  <Download className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Descarregar</span>
                </a>
              </Button>
            )}
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center bg-muted/20" style={{ height: pdfHeight }}>
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : pdfUrl ? (
          <div className="relative bg-background">
            {renderPdfIframe(pdfHeight)}
            {pdfError && (
              <div className="p-4 text-center text-sm text-muted-foreground border-t border-border">
                Não foi possível pré-visualizar aqui. Use os botões acima para abrir ou descarregar.
              </div>
            )}
            {isMobile && (
              <div className="flex items-center justify-center gap-2 p-3 text-xs text-muted-foreground bg-muted/30 border-t border-border">
                <Smartphone className="h-3.5 w-3.5" />
                <span>Para melhor leitura, toque em "Ecrã cheio" ou "Nova aba".</span>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 text-center text-sm text-destructive flex flex-col items-center gap-2">
            <FileText className="h-8 w-8" />
            <p>Não foi possível obter o PDF.</p>
          </div>
        )}
      </Card>

      {/* PDF fullscreen overlay */}
      {pdfFullscreen && pdfUrl && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/50 px-3 py-2">
            <p className="text-sm font-medium truncate">{title}</p>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" variant="outline" asChild>
                <a href={pdfUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Nova aba</span>
                </a>
              </Button>
              <Button size="sm" variant="outline" onClick={() => setPdfFullscreen(false)}>
                <Minimize2 className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Fechar</span>
              </Button>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            {renderPdfIframe("100%")}
          </div>
        </div>
      )}

      {imageUrls.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-3">Imagens</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {imageUrls.map((url, idx) => (
              <div key={url} className="relative group">
                <button
                  type="button"
                  onClick={() => setLightboxIndex(idx)}
                  className="block w-full overflow-hidden rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-label={`Abrir imagem ${idx + 1}`}
                >
                  <img src={url} alt={`Imagem ${idx + 1}`} className="w-full aspect-square object-cover transition group-hover:scale-105" loading="lazy" />
                </button>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute top-1 right-1 rounded-md bg-background/80 p-1.5 border border-border opacity-0 group-hover:opacity-100 focus:opacity-100 transition"
                  aria-label="Abrir imagem em nova aba"
                  title="Abrir em nova aba"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={lightboxIndex !== null} onOpenChange={(o) => !o && closeLightbox()}>
        <DialogContent className="max-w-5xl p-0 bg-background/95 border-border">
          {lightboxIndex !== null && (
            <div className="relative">
              <img
                src={imageUrls[lightboxIndex]}
                alt={`Imagem ${lightboxIndex + 1}`}
                className="w-full max-h-[85vh] object-contain bg-black"
              />
              <a
                href={imageUrls[lightboxIndex]}
                target="_blank"
                rel="noreferrer"
                className="absolute top-2 right-2 rounded-md bg-background/80 px-3 py-1.5 text-xs border border-border flex items-center gap-1.5"
              >
                <ExternalLink className="h-3.5 w-3.5" />Abrir
              </a>
              {imageUrls.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full"
                    onClick={prevImage}
                    aria-label="Imagem anterior"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full"
                    onClick={nextImage}
                    aria-label="Imagem seguinte"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </>
              )}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-background/80 px-3 py-1 text-xs text-foreground border border-border">
                {lightboxIndex + 1} / {imageUrls.length}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
