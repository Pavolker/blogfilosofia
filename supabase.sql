create table if not exists public.posts (
  id text primary key,
  author text not null,
  title text not null,
  content jsonb not null default '[]'::jsonb,
  createdAt timestamptz not null default now()
);

alter table public.posts enable row level security;

create policy if not exists "public_read_posts" on public.posts for select using (true);

create policy if not exists "allow_anon_insert_author_posts" on public.posts
  for insert with check ( author in ('Patricia','Higino','Paulo') );

create index if not exists posts_created_at_idx on public.posts (createdAt);

create table if not exists public.feedback (
  id text primary key,
  postId text not null references public.posts(id) on delete cascade,
  parentId text null,
  author text not null,
  role text not null check (role in ('reader','author')),
  type text not null,
  message text not null,
  timestamp timestamptz not null default now()
);

alter table public.feedback enable row level security;

create policy if not exists "public_read_feedback" on public.feedback for select using (true);

create policy if not exists "allow_anon_insert_feedback" on public.feedback for insert with check (true);

create index if not exists feedback_post_idx on public.feedback (postId);
create index if not exists feedback_timestamp_idx on public.feedback (timestamp);

insert into public.posts (id, author, title, content, createdAt) values
('patricia-amanhecer','Patricia','Respirar o amanhecer com presença','["Comece o dia com três respirações profundas. Em cada inspiração, reconheça a vastidão de possibilidades que um novo amanhecer traz.","Permita que o silêncio matinal acolha suas intenções. Escreva três palavras que traduzam o que deseja nutrir em si hoje.","A serenidade nasce quando acolhemos o que sentimos sem pressa. Observe o seu corpo, agradeça por sustentá-lo e siga com gentileza."]'::jsonb,'2024-04-01T11:00:00.000Z'),
('higino-movimentos','Higino','Movimentos que despertam coragem','["Encare o espelho e reconheça sua postura. Endireite os ombros, firme os pés no chão e sinta a firmeza emergir de dentro.","Transforme desconfortos em perguntas curiosas: o que essa sensação deseja me mostrar? Como posso responder com coragem?","A coragem não é ausência de medo, é a decisão de seguir em frente com o coração alerto. Escolha hoje um pequeno ato de bravura."]'::jsonb,'2024-04-03T10:30:00.000Z'),
('paulo-sintonia','Paulo','Sintonia entre mente e intuição','["Silencie dispositivos por quinze minutos e permita que a mente desacelere. Perceba os pensamentos como nuvens que passam.","Convide a intuição para a conversa: escreva em um papel qual decisão pede clareza e depois anote tudo que surge sem julgar.","A integração mente e intuição floresce na escuta: após escrever, leia em voz alta e perceba onde o corpo vibra com verdade."]'::jsonb,'2024-04-06T13:15:00.000Z')
on conflict (id) do nothing;

-- Permitir deleção (DELETE) de posts por visitante anônimo, restrita aos autores válidos