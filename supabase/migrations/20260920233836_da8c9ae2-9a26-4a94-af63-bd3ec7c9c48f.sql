-- 1. tracks: novos estados e default pendente
ALTER TABLE public.tracks ALTER COLUMN status SET DEFAULT 'pending';

-- 2. favoritos
CREATE TABLE IF NOT EXISTS public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id uuid NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, track_id)
);
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own favorites read" ON public.favorites FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Own favorites insert" ON public.favorites FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own favorites delete" ON public.favorites FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 3. notificações
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  track_id uuid REFERENCES public.tracks(id) ON DELETE SET NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON public.notifications(user_id, created_at DESC);
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own notifications read" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Own notifications update" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own notifications delete" ON public.notifications FOR DELETE TO authenticated USING (user_id = auth.uid());

-- trigger: notificar o uploader quando o estado muda
CREATE OR REPLACE FUNCTION public.notify_track_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  msg text;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.uploaded_by IS NOT NULL THEN
    msg := CASE NEW.status
      WHEN 'approved' THEN 'A sua música foi publicada na Biblioteca.'
      WHEN 'rejected' THEN COALESCE('Motivo: ' || NEW.rejection_reason, 'O envio foi rejeitado.')
      WHEN 'needs_fix' THEN COALESCE('Correção pedida: ' || NEW.rejection_reason, 'O administrador pediu uma correção.')
      WHEN 'pending' THEN 'O seu envio está novamente em análise.'
      ELSE 'O estado do seu envio mudou.'
    END;
    INSERT INTO public.notifications(user_id, title, body, track_id)
    VALUES (NEW.uploaded_by, NEW.title, msg, NEW.id);
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_track_status ON public.tracks;
CREATE TRIGGER trg_notify_track_status AFTER UPDATE ON public.tracks
FOR EACH ROW EXECUTE FUNCTION public.notify_track_status_change();

-- 4. auditoria administrativa
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_name text,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS admin_audit_created_idx ON public.admin_audit_log(created_at DESC);
GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read audit" ON public.admin_audit_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.log_admin_action(_action text, _entity text, _entity_id text, _details text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  nm text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  SELECT COALESCE(display_name, email) INTO nm FROM public.profiles WHERE id = auth.uid();
  INSERT INTO public.admin_audit_log(actor_id, actor_name, action, entity, entity_id, details)
  VALUES (auth.uid(), nm, _action, _entity, _entity_id, _details);
END;
$$;
GRANT EXECUTE ON FUNCTION public.log_admin_action(text, text, text, text) TO authenticated;

-- 5. mensagens de contacto: estado
ALTER TABLE public.contact_messages ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new';
UPDATE public.contact_messages SET status = 'answered' WHERE is_read = true AND status = 'new';

-- 6. storage: leitura pública de ficheiros de músicas publicadas; escrita só dono/admin
DROP POLICY IF EXISTS "Public read approved track files" ON storage.objects;
CREATE POLICY "Public read approved track files" ON storage.objects FOR SELECT TO anon, authenticated
USING (
  bucket_id IN ('pdfs','audios','images') AND (
    EXISTS (
      SELECT 1 FROM public.tracks t
      WHERE t.status = 'approved'
        AND (t.pdf_path = storage.objects.name OR t.audio_path = storage.objects.name OR storage.objects.name = ANY(t.image_paths))
    )
    OR owner = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  )
);

DROP POLICY IF EXISTS "Authenticated upload track files" ON storage.objects;
CREATE POLICY "Authenticated upload track files" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id IN ('pdfs','audios','images'));

DROP POLICY IF EXISTS "Owner or admin update track files" ON storage.objects;
CREATE POLICY "Owner or admin update track files" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id IN ('pdfs','audios','images') AND (owner = auth.uid() OR public.has_role(auth.uid(), 'admin')));

DROP POLICY IF EXISTS "Owner or admin delete track files" ON storage.objects;
CREATE POLICY "Owner or admin delete track files" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id IN ('pdfs','audios','images') AND (owner = auth.uid() OR public.has_role(auth.uid(), 'admin')));