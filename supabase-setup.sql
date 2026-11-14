-- Run this whole script in Supabase Dashboard > SQL Editor.
-- Create a PUBLIC bucket for publicly viewable published website images.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('london-store-images', 'london-store-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

create table if not exists public.site_images (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('product','banner')),
  title text not null default '',
  subtitle text,
  category text,
  image_url text not null,
  path text not null,
  published boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists site_images_public_listing on public.site_images (kind, published, created_at desc);
alter table public.site_images enable row level security;

-- Admin allowlist. Add your own Auth user UUID here after creating the account.
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.admin_users enable row level security;

-- Security-definer helper avoids recursive RLS when checking the allowlist.
create or replace function public.is_london_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.admin_users where user_id = auth.uid()); $$;
revoke all on function public.is_london_admin() from public;
grant execute on function public.is_london_admin() to authenticated, anon;

-- Anyone can read published records only. Admins can manage all records.
drop policy if exists "Public can read published images" on public.site_images;
create policy "Public can read published images" on public.site_images
  for select to anon, authenticated using (published = true or public.is_london_admin());
drop policy if exists "Admins can insert images" on public.site_images;
create policy "Admins can insert images" on public.site_images
  for insert to authenticated with check (public.is_london_admin());
drop policy if exists "Admins can update images" on public.site_images;
create policy "Admins can update images" on public.site_images
  for update to authenticated using (public.is_london_admin()) with check (public.is_london_admin());

-- Storage: public read is enabled by the public bucket. Only allowlisted admins can upload.
drop policy if exists "Admins upload London images" on storage.objects;
create policy "Admins upload London images" on storage.objects
  for insert to authenticated with check (bucket_id = 'london-store-images' and public.is_london_admin());
drop policy if exists "Admins update London images" on storage.objects;
create policy "Admins update London images" on storage.objects
  for update to authenticated using (bucket_id = 'london-store-images' and public.is_london_admin())
  with check (bucket_id = 'london-store-images' and public.is_london_admin());
drop policy if exists "Admins delete London images" on storage.objects;
create policy "Admins delete London images" on storage.objects
  for delete to authenticated using (bucket_id = 'london-store-images' and public.is_london_admin());
