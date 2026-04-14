-- Schema do Postgres para o blog "Sinapses do Vento"

create table if not exists admins (
  id serial primary key,
  name text not null unique,
  login text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists users (
  id bigserial primary key,
  name text not null,
  email text not null unique,
  city text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists posts (
  id text primary key,
  author text not null,
  title text not null,
  content jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists feedback (
  id text primary key,
  post_id text not null references posts(id) on delete cascade,
  parent_id text null references feedback(id) on delete cascade,
  author text not null,
  role text not null check (role in ('user', 'admin')),
  type text not null,
  message text not null,
  timestamp timestamptz not null default now()
);

create table if not exists likes (
  post_id text not null references posts(id) on delete cascade,
  fingerprint text not null,
  created_at timestamptz not null default now(),
  primary key (post_id, fingerprint)
);

create index if not exists feedback_post_idx on feedback (post_id);
create index if not exists feedback_timestamp_idx on feedback (timestamp);
create index if not exists likes_post_idx on likes (post_id);
create index if not exists users_email_idx on users (email);
