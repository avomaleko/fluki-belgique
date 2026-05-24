-- Auto-approve all new users for upload
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles (id, email, display_name, upload_status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)),
    'approved'
  );

  -- everyone gets base user + uploader role automatically
  insert into public.user_roles (user_id, role) values (new.id, 'user') on conflict do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'uploader') on conflict do nothing;

  -- auto-grant admin to the configured admin email
  if new.email = 'manobv511@gmail.com' then
    insert into public.user_roles (user_id, role) values (new.id, 'admin') on conflict do nothing;
  end if;

  return new;
end;
$function$;

-- Tracks are published immediately
ALTER TABLE public.tracks ALTER COLUMN status SET DEFAULT 'approved';