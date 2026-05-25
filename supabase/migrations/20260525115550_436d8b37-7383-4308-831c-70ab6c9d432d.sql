-- Backfill: dar role 'uploader' a todos os utilizadores existentes
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'uploader'::app_role FROM auth.users
ON CONFLICT DO NOTHING;

-- Simplificar policy de insert: qualquer utilizador autenticado pode enviar
DROP POLICY IF EXISTS "Uploaders and admins can insert" ON public.tracks;
CREATE POLICY "Authenticated can insert tracks"
ON public.tracks
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = uploaded_by);