-- test-gdrb_notion Supabase 초기 스키마
-- 실행 위치: Supabase Dashboard > SQL Editor

create extension if not exists pgcrypto;

-- updated_at 자동 갱신 함수
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 사용자 프로필
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text not null default '',
  avatar text not null default '',
  bio text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create index if not exists idx_profiles_email on public.profiles (email);

-- 페이지(노션 문서)
create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Untitled',
  slug text not null default '',
  icon text not null default '📄',
  cover_image text,
  description text not null default '',
  is_published boolean not null default false,
  is_archived boolean not null default false,
  author_id uuid not null references auth.users (id) on delete cascade,
  parent_page_id uuid references public.pages (id) on delete set null,
  tags text[] not null default '{}'::text[],
  views integer not null default 0,
  content text not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

drop trigger if exists trg_pages_updated_at on public.pages;
create trigger trg_pages_updated_at
before update on public.pages
for each row
execute function public.set_updated_at();

-- 공개 페이지 조회 및 내 페이지 조회 성능 최적화
create index if not exists idx_pages_author_id on public.pages (author_id);
create index if not exists idx_pages_parent_page_id on public.pages (parent_page_id);
create index if not exists idx_pages_slug on public.pages (slug);
create index if not exists idx_pages_public_feed
  on public.pages (published_at desc)
  where is_published = true and is_archived = false;
create index if not exists idx_pages_owner_recent
  on public.pages (author_id, updated_at desc)
  where is_archived = false;

-- slug 중복 방지(빈 문자열은 허용)
create unique index if not exists uq_pages_slug_non_empty
  on public.pages (slug)
  where slug <> '';

-- RLS 활성화
alter table public.profiles enable row level security;
alter table public.pages enable row level security;

-- profiles 정책
-- 본인 프로필 조회/등록/수정 허용
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- pages 정책
-- 공개 글은 누구나 조회, 비공개 글은 작성자만 조회
drop policy if exists "pages_select_published_or_owner" on public.pages;
create policy "pages_select_published_or_owner"
on public.pages
for select
using (
  (is_published = true and is_archived = false)
  or auth.uid() = author_id
);

-- 생성/수정/삭제는 작성자 본인만
drop policy if exists "pages_insert_owner_only" on public.pages;
create policy "pages_insert_owner_only"
on public.pages
for insert
with check (auth.uid() = author_id);

drop policy if exists "pages_update_owner_only" on public.pages;
create policy "pages_update_owner_only"
on public.pages
for update
using (auth.uid() = author_id)
with check (auth.uid() = author_id);

drop policy if exists "pages_delete_owner_only" on public.pages;
create policy "pages_delete_owner_only"
on public.pages
for delete
using (auth.uid() = author_id);

-- Storage 버킷 생성(이미 있으면 무시)
insert into storage.buckets (id, name, public)
values ('pages', 'pages', true)
on conflict (id) do update
set public = excluded.public;

-- storage.objects 정책
-- 공개 읽기 허용(공개 URL 사용)
drop policy if exists "storage_pages_public_read" on storage.objects;
create policy "storage_pages_public_read"
on storage.objects
for select
using (bucket_id = 'pages');

-- 업로드: 로그인 사용자 + 본인 페이지 경로만 허용
-- 경로 규칙: pages/{page_id}/cover/... 또는 pages/{page_id}/images/...
drop policy if exists "storage_pages_insert_owner_only" on storage.objects;
create policy "storage_pages_insert_owner_only"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'pages'
  and (storage.foldername(name))[1] = 'pages'
  and exists (
    select 1
    from public.pages p
    where p.id::text = (storage.foldername(name))[2]
      and p.author_id = auth.uid()
  )
);

-- 수정/삭제: 본인 페이지 파일만 허용
drop policy if exists "storage_pages_update_owner_only" on storage.objects;
create policy "storage_pages_update_owner_only"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'pages'
  and (storage.foldername(name))[1] = 'pages'
  and exists (
    select 1
    from public.pages p
    where p.id::text = (storage.foldername(name))[2]
      and p.author_id = auth.uid()
  )
)
with check (
  bucket_id = 'pages'
  and (storage.foldername(name))[1] = 'pages'
  and exists (
    select 1
    from public.pages p
    where p.id::text = (storage.foldername(name))[2]
      and p.author_id = auth.uid()
  )
);

drop policy if exists "storage_pages_delete_owner_only" on storage.objects;
create policy "storage_pages_delete_owner_only"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'pages'
  and (storage.foldername(name))[1] = 'pages'
  and exists (
    select 1
    from public.pages p
    where p.id::text = (storage.foldername(name))[2]
      and p.author_id = auth.uid()
  )
);
