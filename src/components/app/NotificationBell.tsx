import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, BellOff, CheckCheck } from "lucide-react";

type Notification = {
  id: string;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
  track_id: string | null;
};

export function NotificationBell() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) { setItems([]); return; }
    let active = true;

    const fetchItems = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("id,title,body,read_at,created_at,track_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);
      if (active) setItems((data ?? []) as Notification[]);
    };
    fetchItems();

    const ch = supabase
      .channel(`notifications_${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => fetchItems())
      .subscribe();

    return () => { active = false; supabase.removeChannel(ch); };
  }, [user?.id]);

  if (!user) return null;
  const unread = items.filter((n) => !n.read_at).length;

  const markRead = async (n: Notification) => {
    if (n.read_at) return;
    const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", n.id);
    if (!error) setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)));
  };
  const markAllRead = async () => {
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("read_at", null);
    if (!error) setItems((prev) => prev.map((x) => ({ ...x, read_at: x.read_at ?? new Date().toISOString() })));
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative" aria-label="Notificações">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[70vh] overflow-y-auto">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/60">
          <p className="text-sm font-semibold">Notificações</p>
          {unread > 0 && (
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={markAllRead}>
              <CheckCheck className="h-3.5 w-3.5" />Marcar lidas
            </Button>
          )}
        </div>
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-3 py-8 text-center text-muted-foreground">
            <BellOff className="h-6 w-6" />
            <p className="text-sm">Sem notificações por agora.</p>
          </div>
        ) : (
          items.map((n) => (
            <button
              key={n.id}
              onClick={() => markRead(n)}
              className={`block w-full px-3 py-2.5 text-left border-b border-border/40 last:border-0 hover:bg-accent transition ${!n.read_at ? "bg-primary/5" : ""}`}
            >
              <p className="text-sm font-medium flex items-center gap-2">
                {!n.read_at && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />}
                {n.title}
              </p>
              {n.body && <p className="mt-0.5 text-xs text-muted-foreground line-clamp-3">{n.body}</p>}
              <p className="mt-1 text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleString("pt-PT")}</p>
              {n.track_id && (
                <Link
                  to="/track/$id"
                  params={{ id: n.track_id }}
                  onClick={() => setOpen(false)}
                  className="mt-1 inline-block text-xs text-primary underline"
                >
                  Ver música
                </Link>
              )}
            </button>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
