const path = require('path');
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const { newDb } = require('pg-mem');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const DATABASE_URL = process.env.DATABASE_URL || '';
const ADMIN_SEEDS = [
  {
    name: 'Angelica Satiro',
    login: 'angelica satiro',
  },
  {
    name: 'Paulo Volker',
    login: 'paulo volker',
  },
];

const seedPosts = [
  {
    id: 'paulo-sintonia',
    author: 'Paulo Volker',
    title: 'Paulo abre a conversa',
    content: [
      'Hoje quero começar a conversa com uma pergunta simples: como a gente sustenta presença quando o tempo parece apertar por dentro?',
      'Tenho pensado que a escuta cuidadosa é uma forma de cuidado. Antes de responder, talvez seja preciso habitar o silêncio por alguns instantes.',
      'Se a finitude nos convoca, que ela também nos devolva mais verdade, mais delicadeza e mais coragem para seguir falando.',
    ],
    createdAt: '2024-04-06T13:15:00.000Z',
  },
  {
    id: 'angelica-criatividade',
    author: 'Angelica Satiro',
    title: 'Angélica entra na conversa',
    content: [
      'Eu gosto de pensar que toda conversa verdadeira já é uma forma de cuidado. A palavra aproxima, aquece e reorganiza o que parecia disperso.',
      'Quando o pensamento encontra hospitalidade, ele ganha corpo. Talvez seja isso que essa plataforma queira preservar: presença com escuta e beleza.',
      'Quero seguir aqui trazendo pequenas notas, imagens, notícias e reflexões que ajudem a manter o diálogo vivo todos os dias.',
    ],
    createdAt: '2024-04-08T10:00:00.000Z',
  },
];

const pgMem = DATABASE_URL ? null : newDb();
const memAdapter = pgMem ? pgMem.adapters.createPg() : null;
const pool = DATABASE_URL
  ? new Pool({
      connectionString: DATABASE_URL,
      ssl: process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false },
    })
  : new memAdapter.Pool();

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(__dirname));

function normalizeKey(value) {
  return (value || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function lowerCasePassword(value) {
  return normalizeKey(value);
}

function ensureDatabase() {
  if (!pool) {
    return Promise.resolve();
  }

  return pool.query(`
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
  `);
}

async function seedDatabase() {
  if (!pool) return;

  for (const admin of ADMIN_SEEDS) {
    const password = lowerCasePassword(admin.name);
    const passwordHash = await bcrypt.hash(password, 10);
    await pool.query(
      `
      insert into admins (name, login, password_hash)
      values ($1, $2, $3)
      on conflict (name)
      do update set login = excluded.login, password_hash = excluded.password_hash
      `,
      [admin.name, normalizeKey(admin.login || admin.name), passwordHash]
    );
  }

  const { rowCount } = await pool.query('select id from posts limit 1');
  if (rowCount === 0) {
    for (const post of seedPosts) {
      await pool.query(
        `
        insert into posts (id, author, title, content, created_at)
        values ($1, $2, $3, $4::jsonb, $5)
        on conflict (id) do nothing
        `,
        [post.id, post.author, post.title, JSON.stringify(post.content), post.createdAt]
      );
    }
  }
}

async function ensureReady() {
  if (!pool) {
    throw new Error('Banco de dados indisponível.');
  }
}

function signAdminToken(admin) {
  return jwt.sign(
    {
      adminId: admin.id,
      name: admin.name,
      login: admin.login,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : req.headers['x-admin-token'];
  if (!token) {
    return res.status(401).json({ error: 'Admin token ausente.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.admin = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Admin token inválido.' });
  }
}

function rowToPost(row) {
  return {
    id: row.id,
    author: row.author,
    title: row.title,
    content: Array.isArray(row.content) ? row.content : [],
    createdAt: row.created_at,
  };
}

function rowToFeedback(row) {
  return {
    id: row.id,
    parentId: row.parent_id,
    author: row.author,
    role: row.role === 'admin' ? 'author' : 'reader',
    type: row.type,
    message: row.message,
    timestamp: row.timestamp,
  };
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    database: !!pool,
  });
});

app.post('/api/auth/admin/login', async (req, res) => {
  try {
    await ensureReady();
    const identifier = normalizeKey(req.body?.identifier);
    const password = lowerCasePassword(req.body?.password);
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Informe nome e senha.' });
    }

    const { rows } = await pool.query(
      `
      select id, name, login, password_hash
      from admins
      where lower(login) = $1 or lower(name) = $1
      limit 1
      `,
      [identifier]
    );
    const admin = rows[0];
    if (!admin) {
      return res.status(401).json({ error: 'Administrador não encontrado.' });
    }

    const ok = await bcrypt.compare(password, admin.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Senha inválida.' });
    }

    const token = signAdminToken(admin);
    res.json({
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        login: admin.login,
      },
    });
  } catch (error) {
    console.error('Falha no login do admin:', error);
    res.status(500).json({ error: 'Falha ao autenticar admin.' });
  }
});

app.get('/api/auth/admin/me', requireAdmin, async (req, res) => {
  res.json({
    admin: req.admin,
  });
});

app.post('/api/users', async (req, res) => {
  try {
    await ensureReady();
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const city = String(req.body?.city || '').trim();

    if (!name || !email || !city) {
      return res.status(400).json({ error: 'Nome, email e cidade são obrigatórios.' });
    }

    const { rows } = await pool.query(
      `
      insert into users (name, email, city)
      values ($1, $2, $3)
      on conflict (email)
      do update set name = excluded.name, city = excluded.city, updated_at = now()
      returning id, name, email, city, created_at, updated_at
      `,
      [name, email, city]
    );

    const user = rows[0];
    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      city: user.city,
    });
  } catch (error) {
    console.error('Falha ao registrar usuário:', error);
    res.status(500).json({ error: 'Falha ao registrar usuário.' });
  }
});

app.get('/api/users/by-email', async (req, res) => {
  try {
    await ensureReady();
    const email = String(req.query.email || '').trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório.' });
    }
    const { rows } = await pool.query(
      'select id, name, email, city from users where lower(email) = $1 limit 1',
      [email]
    );
    if (!rows[0]) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Falha ao buscar usuário:', error);
    res.status(500).json({ error: 'Falha ao buscar usuário.' });
  }
});

app.get('/api/posts', async (_req, res) => {
  try {
    await ensureReady();
    const { rows } = await pool.query(
      `
      select id, author, title, content, created_at
      from posts
      order by created_at desc
      `
    );
    res.json(rows.map(rowToPost));
  } catch (error) {
    console.error('Falha ao buscar posts:', error);
    res.status(500).json({ error: 'Falha ao buscar posts.' });
  }
});

app.post('/api/posts', requireAdmin, async (req, res) => {
  try {
    await ensureReady();
    const title = String(req.body?.title || '').trim();
    const content = Array.isArray(req.body?.content) ? req.body.content.map((item) => String(item).trim()).filter(Boolean) : [];

    if (!title || !content.length) {
      return res.status(400).json({ error: 'Título e conteúdo são obrigatórios.' });
    }

    const author = req.admin?.name || String(req.body?.author || '').trim();
    const id = String(req.body?.id || crypto.randomUUID());
    const createdAt = String(req.body?.createdAt || new Date().toISOString());

    const { rows } = await pool.query(
      `
      insert into posts (id, author, title, content, created_at)
      values ($1, $2, $3, $4::jsonb, $5)
      on conflict (id)
      do update set author = excluded.author, title = excluded.title, content = excluded.content, updated_at = now()
      returning id, author, title, content, created_at
      `,
      [id, author, title, JSON.stringify(content), createdAt]
    );

    res.status(201).json(rowToPost(rows[0]));
  } catch (error) {
    console.error('Falha ao criar post:', error);
    res.status(500).json({ error: 'Falha ao criar post.' });
  }
});

app.post('/api/community/posts', async (req, res) => {
  try {
    await ensureReady();
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const city = String(req.body?.city || '').trim();
    const title = String(req.body?.title || '').trim();
    const rawContent = Array.isArray(req.body?.content) ? req.body.content : [];
    const content = rawContent.map((item) => String(item).trim()).filter(Boolean);

    if (!name || !email || !city || !title || !content.length) {
      return res.status(400).json({ error: 'Nome, email, cidade, título e conteúdo são obrigatórios.' });
    }

    const { rows: userRows } = await pool.query(
      'select id, name, email, city from users where lower(email) = $1 limit 1',
      [email]
    );
    const user = userRows[0];
    if (!user) {
      return res.status(403).json({ error: 'Inscrição não encontrada. Registre-se para publicar.' });
    }

    const id = String(req.body?.id || crypto.randomUUID());
    const createdAt = String(req.body?.createdAt || new Date().toISOString());

    const { rows } = await pool.query(
      `
      insert into posts (id, author, title, content, created_at)
      values ($1, $2, $3, $4::jsonb, $5)
      on conflict (id)
      do update set author = excluded.author, title = excluded.title, content = excluded.content, updated_at = now()
      returning id, author, title, content, created_at
      `,
      [id, user.name || name, title, JSON.stringify(content), createdAt]
    );

    res.status(201).json(rowToPost(rows[0]));
  } catch (error) {
    console.error('Falha ao criar post da comunidade:', error);
    res.status(500).json({ error: 'Falha ao criar post da comunidade.' });
  }
});

app.get('/api/feedback', async (req, res) => {
  try {
    await ensureReady();
    const postId = String(req.query.postId || '').trim();
    if (!postId) {
      return res.status(400).json({ error: 'postId é obrigatório.' });
    }
    const { rows } = await pool.query(
      `
      select id, post_id, parent_id, author, role, type, message, timestamp
      from feedback
      where post_id = $1
      order by timestamp asc
      `,
      [postId]
    );
    res.json(rows.map(rowToFeedback));
  } catch (error) {
    console.error('Falha ao buscar feedback:', error);
    res.status(500).json({ error: 'Falha ao buscar feedback.' });
  }
});

app.post('/api/posts/:postId/feedback', async (req, res) => {
  try {
    await ensureReady();
    const postId = String(req.params.postId || '').trim();
    const id = String(req.body?.id || crypto.randomUUID());
    const parentId = req.body?.parentId ? String(req.body.parentId).trim() : null;
    const author = String(req.body?.author || '').trim();
    const role = req.body?.role === 'admin' ? 'admin' : 'user';
    const type = String(req.body?.type || '').trim();
    const message = String(req.body?.message || '').trim();
    const timestamp = String(req.body?.timestamp || new Date().toISOString());

    if (!postId || !author || !type || !message) {
      return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
    }

    const { rows } = await pool.query(
      `
      insert into feedback (id, post_id, parent_id, author, role, type, message, timestamp)
      values ($1, $2, $3, $4, $5, $6, $7, $8)
      on conflict (id)
      do update set parent_id = excluded.parent_id, author = excluded.author, role = excluded.role, type = excluded.type, message = excluded.message, timestamp = excluded.timestamp
      returning id, post_id, parent_id, author, role, type, message, timestamp
      `,
      [id, postId, parentId, author, role, type, message, timestamp]
    );

    res.status(201).json(rowToFeedback(rows[0]));
  } catch (error) {
    console.error('Falha ao salvar feedback:', error);
    res.status(500).json({ error: 'Falha ao salvar feedback.' });
  }
});

app.get('/api/likes', async (req, res) => {
  try {
    await ensureReady();
    const postIds = String(req.query.postIds || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    const fingerprint = String(req.query.fingerprint || '').trim();

    if (!postIds.length) {
      return res.json([]);
    }

    const { rows } = await pool.query(
      `
      select post_id, count(*)::int as likes
      from likes
      where post_id = any($1::text[])
      group by post_id
      `,
      [postIds]
    );

    const likedRows = fingerprint
      ? await pool.query(
          `
          select post_id
          from likes
          where fingerprint = $1
            and post_id = any($2::text[])
          `,
          [fingerprint, postIds]
        )
      : { rows: [] };

    const likedSet = new Set(likedRows.rows.map((row) => row.post_id));
    const snapshots = postIds.map((postId) => ({
      postId,
      likes: rows.find((row) => row.post_id === postId)?.likes ?? 0,
      liked: likedSet.has(postId),
    }));
    res.json(snapshots);
  } catch (error) {
    console.error('Falha ao buscar curtidas:', error);
    res.status(500).json({ error: 'Falha ao buscar curtidas.' });
  }
});

app.post('/api/likes/toggle', async (req, res) => {
  try {
    await ensureReady();
    const postId = String(req.body?.postId || '').trim();
    const fingerprint = String(req.body?.fingerprint || '').trim();
    if (!postId || !fingerprint) {
      return res.status(400).json({ error: 'postId e fingerprint são obrigatórios.' });
    }

    const existing = await pool.query(
      'select 1 from likes where post_id = $1 and fingerprint = $2 limit 1',
      [postId, fingerprint]
    );

    if (existing.rowCount > 0) {
      await pool.query('delete from likes where post_id = $1 and fingerprint = $2', [postId, fingerprint]);
    } else {
      await pool.query(
        'insert into likes (post_id, fingerprint) values ($1, $2) on conflict (post_id, fingerprint) do nothing',
        [postId, fingerprint]
      );
    }

    const [{ rows }] = await Promise.all([
      pool.query('select count(*)::int as likes from likes where post_id = $1', [postId]),
    ]);

    res.json({
      postId,
      likes: rows[0]?.likes ?? 0,
      liked: existing.rowCount === 0,
    });
  } catch (error) {
    console.error('Falha ao alternar curtida:', error);
    res.status(500).json({ error: 'Falha ao alternar curtida.' });
  }
});

app.delete('/api/posts/:postId', requireAdmin, async (req, res) => {
  try {
    await ensureReady();
    const postId = String(req.params.postId || '').trim();
    if (!postId) {
      return res.status(400).json({ error: 'postId é obrigatório.' });
    }
    await pool.query('delete from posts where id = $1', [postId]);
    res.status(204).end();
  } catch (error) {
    console.error('Falha ao remover post:', error);
    res.status(500).json({ error: 'Falha ao remover post.' });
  }
});

app.get('/api/bootstrap', async (_req, res) => {
  try {
    await ensureDatabase();
    await seedDatabase();
    res.json({ ok: true });
  } catch (error) {
    console.error('Falha ao inicializar o banco:', error);
    res.status(500).json({ error: 'Falha ao inicializar o banco.' });
  }
});

async function start() {
  if (pool) {
    await ensureDatabase();
    await seedDatabase();
  }

  app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
