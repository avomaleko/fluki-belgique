import { Badge } from "@/components/ui/badge";
import { Clock3, CheckCircle2, Wrench, XCircle } from "lucide-react";

const MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof Clock3 }> = {
  pending: { label: "Pendente", variant: "secondary", icon: Clock3 },
  approved: { label: "Publicada", variant: "default", icon: CheckCircle2 },
  needs_fix: { label: "Requer correção", variant: "outline", icon: Wrench },
  rejected: { label: "Rejeitada", variant: "destructive", icon: XCircle },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const m = MAP[status] ?? { label: status, variant: "outline" as const, icon: Clock3 };
  const Icon = m.icon;
  return (
    <Badge variant={m.variant} className={`gap-1 ${className ?? ""}`}>
      <Icon className="h-3 w-3" />
      {m.label}
    </Badge>
  );
}
