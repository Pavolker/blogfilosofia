-- ============================================
-- SCHEMA DO BANCO DE DADOS - CONVERSAS FILOSÓFICAS
-- ============================================

-- Tabela de Publicações
create table if not exists public.posts (
  id text primary key,
  author text not null,
  title text not null,
  content jsonb not null default '[]'::jsonb,
  "createdAt" timestamptz not null default now()
);

-- Habilitar Row Level Security
alter table public.posts enable row level security;

-- Remover policies antigas (se existirem) e criar novas
drop policy if exists "public_read_posts" on public.posts;
create policy "public_read_posts" on public.posts
  for select using (true);

drop policy if exists "authenticated_insert_posts" on public.posts;
drop policy if exists "authenticated_delete_posts" on public.posts;
create policy "publisher_insert_posts" on public.posts
  for insert
  with check (
    auth.role() = 'authenticated'
    and coalesce(auth.jwt() -> 'app_metadata' ->> 'provider', '') <> 'anonymous'
    and (
      lower(author) = lower(coalesce(auth.jwt() -> 'user_metadata' ->> 'author', ''))
      or lower(author) = lower(coalesce(auth.jwt() -> 'user_metadata' ->> 'display_name', ''))
    )
  );

create policy "publisher_delete_posts" on public.posts
  for delete
  using (
    auth.role() = 'authenticated'
    and coalesce(auth.jwt() -> 'app_metadata' ->> 'provider', '') <> 'anonymous'
    and (
      lower(author) = lower(coalesce(auth.jwt() -> 'user_metadata' ->> 'author', ''))
      or lower(author) = lower(coalesce(auth.jwt() -> 'user_metadata' ->> 'display_name', ''))
    )
  );

-- Índice para ordenação por data
create index if not exists posts_created_at_idx on public.posts ("createdAt");

-- ============================================
-- Tabela de Feedback (Comentários e Perguntas)
-- ============================================
create table if not exists public.feedback (
  id text primary key,
  "postId" text not null references public.posts(id) on delete cascade,
  "parentId" text null,
  author text not null,
  role text not null check (role in ('reader','author')),
  type text not null,
  message text not null,
  timestamp timestamptz not null default now()
);

-- Habilitar Row Level Security
alter table public.feedback enable row level security;

-- Policies para feedback
drop policy if exists "public_read_feedback" on public.feedback;
create policy "public_read_feedback" on public.feedback
  for select using (true);

drop policy if exists "allow_anon_insert_feedback" on public.feedback;
create policy "authenticated_insert_feedback" on public.feedback
  for insert
  with check (auth.role() = 'authenticated');

drop policy if exists "authenticated_delete_feedback" on public.feedback;
create policy "authenticated_delete_feedback" on public.feedback
  for delete using (auth.role() = 'authenticated');

-- Índices para performance
create index if not exists feedback_post_idx on public.feedback ("postId");
create index if not exists feedback_timestamp_idx on public.feedback (timestamp);

-- ============================================
-- Tabela de Curtidas (Likes)
-- ============================================
create table if not exists public.likes (
  "postId" text not null references public.posts(id) on delete cascade,
  fingerprint text not null,
  "createdAt" timestamptz not null default now(),
  primary key ("postId", fingerprint)
);

-- Habilitar Row Level Security
alter table public.likes enable row level security;

-- Policies para likes
drop policy if exists "public_read_likes" on public.likes;
create policy "public_read_likes" on public.likes
  for select using (true);

drop policy if exists "authenticated_upsert_likes" on public.likes;
create policy "authenticated_upsert_likes" on public.likes
  for insert with check (auth.role() = 'authenticated');

drop policy if exists "authenticated_delete_likes" on public.likes;
create policy "authenticated_delete_likes" on public.likes
  for delete using (auth.role() = 'authenticated');

-- ============================================
-- View para Contagem de Curtidas
-- ============================================
create or replace view public.post_like_totals as
  select "postId", count(*)::int as likes
  from public.likes
  group by "postId";

-- Permissões para a view
grant select on public.post_like_totals to anon;
grant select on public.post_like_totals to authenticated;

-- ============================================
-- Dados Iniciais (Posts de Exemplo)
-- ============================================
insert into public.posts (id, author, title, content, "createdAt") values
('paulo-sintonia','Paulo','Sintonia entre mente e intuição','["Silencie dispositivos por quinze minutos e permita que a mente desacelere. Perceba os pensamentos como nuvens que passam.","Convide a intuição para a conversa: escreva em um papel qual decisão pede clareza e depois anote tudo que surge sem julgar.","A integração mente e intuição floresce na escuta: após escrever, leia em voz alta e perceba onde o corpo vibra com verdade."]'::jsonb,'2024-04-06T13:15:00.000Z'),
('angelica-criatividade','Angelica','Respiração criativa e presença','["A criatividade nasce quando permitimos que o desconhecido nos visite sem resistência. Respire fundo e abra espaço para o novo.","Observe os padrões que se repetem no seu dia. Qual deles está pedindo para ser transformado com leveza e ousadia?","Crie um pequeno ritual de presença: acenda uma vela, escreva três palavras que representam seu momento presente e permita-se sentir."]'::jsonb,'2024-04-08T10:00:00.000Z')
on conflict (id) do nothing;