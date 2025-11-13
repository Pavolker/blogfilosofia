const STORAGE_KEYS = {
    user: 'aa:user',
    posts: 'aa:posts',
    likes: (postId) => `aa:likes:${postId}`,
    likedBy: (postId) => `aa:likedBy:${postId}`,
    feedback: (postId) => `aa:feedback:${postId}`,
};

const AUTHOR_STYLES = {
    Patricia: {
        gradient: 'linear-gradient(135deg, #0D5C63, #1B7A7F)',
    },
    Higino: {
        gradient: 'linear-gradient(135deg, #084C52, #0D5C63)',
    },
    Paulo: {
        gradient: 'linear-gradient(135deg, #0A2A2F, #11646B)',
    },
    Angelica: {
        gradient: 'linear-gradient(135deg, #7A1FA2, #F06292)',
    },
};

const AUTHOR_PHOTOS = {
    Patricia: 'patricia.png',
    Higino: 'higino.png',
    Paulo: 'paulo.png',
    Angelica: 'angelica.jpg',
};

const AUTHOR_RHYTHMS = {
    Patricia: 'Ritmo leve cultivado por Patricia',
    Higino: 'Pulso vibrante conduzido por Higino',
    Paulo: 'Cadência contemplativa guiada por Paulo',
    Angelica: 'Fluxo intuitivo conduzido por Angelica',
};

// Por segurança e simplicidade: os publicadores padrão são APENAS Paulo e Angelica.
// Se quiser adicionar outros publicadores, configure o objeto `publisherAccounts` em `config.js`.
const DEFAULT_PUBLISHERS = {
    PAULO: {
        email: 'paulo@example.com',
        displayName: 'Paulo',
    },
    ANGELICA: {
        email: 'angelica@example.com',
        displayName: 'Angelica',
    },
};

let PUBLISHER_ACCOUNTS = normalizePublisherAccounts(
    DEFAULT_PUBLISHERS,
    window.APP_CONFIG?.publisherAccounts
);

const seedPosts = [
    {
        id: 'patricia-amanhecer',
        author: 'Patricia',
        title: 'Respirar o amanhecer com presença',
        content: [
            'Comece o dia com três respirações profundas. Em cada inspiração, reconheça a vastidão de possibilidades que um novo amanhecer traz.',
            'Permita que o silêncio matinal acolha suas intenções. Escreva três palavras que traduzam o que deseja nutrir em si hoje.',
            'A serenidade nasce quando acolhemos o que sentimos sem pressa. Observe o seu corpo, agradeça por sustentá-lo e siga com gentileza.',
        ],
        createdAt: '2024-04-01T11:00:00.000Z',
    },
    {
        id: 'higino-movimentos',
        author: 'Higino',
        title: 'Movimentos que despertam coragem',
        content: [
            'Encare o espelho e reconheça sua postura. Endireite os ombros, firme os pés no chão e sinta a firmeza emergir de dentro.',
            'Transforme desconfortos em perguntas curiosas: o que essa sensação deseja me mostrar? Como posso responder com coragem?',
            'A coragem não é ausência de medo, é a decisão de seguir em frente com o coração alerto. Escolha hoje um pequeno ato de bravura.',
        ],
        createdAt: '2024-04-03T10:30:00.000Z',
    },
    {
        id: 'paulo-sintonia',
        author: 'Paulo',
        title: 'Sintonia entre mente e intuição',
        content: [
            'Silencie dispositivos por quinze minutos e permita que a mente desacelere. Perceba os pensamentos como nuvens que passam.',
            'Convide a intuição para a conversa: escreva em um papel qual decisão pede clareza e depois anote tudo que surge sem julgar.',
            'A integração mente e intuição floresce na escuta: após escrever, leia em voz alta e perceba onde o corpo vibra com verdade.',
        ],
        createdAt: '2024-04-06T13:15:00.000Z',
    },
];

let currentUser = null;
let currentPublisher = null;
let activeReplyForm = null;
let authSession = null;
// Ocultar todas as publicações apenas na UI (não afeta Supabase)
let hideAllPostsOnPage = false;
// Ocultar publicações específicas apenas na UI (não afeta Supabase)
const AUTO_HIDE_POST_IDS_ON_PAGE = new Set(
    (window.APP_CONFIG && Array.isArray(window.APP_CONFIG.hiddenPostIds))
        ? window.APP_CONFIG.hiddenPostIds
        : ['patricia-amanhecer', 'higino-movimentos', 'paulo-sintonia']
);
const AUTO_HIDE_TITLES_ON_PAGE = new Set(
    (window.APP_CONFIG && Array.isArray(window.APP_CONFIG.hiddenPostTitles))
        ? window.APP_CONFIG.hiddenPostTitles
        : ['Respirar o amanhecer com presença', 'Movimentos que despertam coragem', 'Sintonia entre mente e intuição']
);

// Integração remota opcional (Supabase) com fallback para localStorage
let supabaseClient = null;
function hasRemote() {
    try {
        return !!(window.supabase && window.APP_CONFIG && window.APP_CONFIG.supabaseUrl && window.APP_CONFIG.supabaseAnonKey);
    } catch (_) {
        return false;
    }
}

function getSupabaseClient() {
    if (!hasRemote()) return null;
    if (!supabaseClient) {
        supabaseClient = window.supabase.createClient(
            window.APP_CONFIG.supabaseUrl,
            window.APP_CONFIG.supabaseAnonKey
        );
    }
    return supabaseClient;
}

async function initializeAuth() {
    const client = getSupabaseClient();
    if (!client) return;
    try {
        const { data, error } = await client.auth.getSession();
        if (error) throw error;
        if (!data.session) {
            await ensureAnonymousSession(client);
        } else {
            handleSessionChange(data.session);
        }
        client.auth.onAuthStateChange((_event, session) => {
            handleSessionChange(session);
            if (!session) {
                ensureAnonymousSession(client);
            }
        });
    } catch (err) {
        console.warn('Falha ao inicializar autenticação do Supabase.', err);
    }
}

async function ensureAnonymousSession(client = getSupabaseClient()) {
    if (!client) return null;
    try {
        const existing = await client.auth.getSession();
        if (existing?.data?.session) {
            handleSessionChange(existing.data.session);
            return existing.data.session;
        }
        const { data, error } = await client.auth.signInAnonymously();
        if (error) throw error;
        handleSessionChange(data.session);
        return data.session;
    } catch (err) {
        console.warn('Não foi possível iniciar sessão anônima no Supabase.', err);
        return null;
    }
}

function handleSessionChange(session) {
    authSession = session ?? null;
    if (!session || !session.user) {
        currentPublisher = null;
        return;
    }
    const provider = session.user.app_metadata?.provider;
    if (provider === 'anonymous') {
        currentPublisher = null;
        return;
    }
    currentPublisher = derivePublisherFromSession(session.user);
}

function derivePublisherFromSession(user) {
    if (!user) return null;
    const normalizedEmail = (user.email || '').toLowerCase();
    const matchedKey = Object.keys(PUBLISHER_ACCOUNTS).find((key) => {
        const email = PUBLISHER_ACCOUNTS[key]?.email;
        return email && email.toLowerCase() === normalizedEmail;
    }) || null;
    const profile = matchedKey ? PUBLISHER_ACCOUNTS[matchedKey] : null;
    const metadata = user.user_metadata || {};
    const displayName = profile?.displayName
        || metadata.display_name
        || metadata.author
        || metadata.name
        || capitalize(wordLower(user.email?.split('@')[0] || 'Publicador'));
    return {
        key: matchedKey,
        name: displayName,
        email: user.email,
        userId: user.id,
    };
}

function isAnonymousSession(session = authSession) {
    if (!session || !session.user) return true;
    return session.user.app_metadata?.provider === 'anonymous';
}

function getLikeFingerprint() {
    if (authSession?.user?.id) {
        return authSession.user.id;
    }
    ensureReaderIdentity();
    return currentUser;
}

window.addEventListener('DOMContentLoaded', initializeApp);

async function initializeApp() {
    // Atualizar PUBLISHER_ACCOUNTS com valores do config.js
    PUBLISHER_ACCOUNTS = normalizePublisherAccounts(
        DEFAULT_PUBLISHERS,
        window.APP_CONFIG?.publisherAccounts
    );
    await initializeAuth();
    await bootstrapPosts();
    setupLogin();
    setupPublisherAccess();
    setupSidebarToggle();
    ensureReaderIdentity();
    await renderPosts();
    updateUserInfo();
}

function setupSidebarToggle() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebarToggleIcon = document.getElementById('sidebarToggleIcon');
    const sidebarToggleLabel = document.getElementById('sidebarToggleLabel');
    
    if (!sidebarToggle) return;
    
    
    sidebarToggle.addEventListener('click', function() {
        const isCollapsed = document.body.classList.toggle('sidebar-collapsed');
        
        // Alternar ícone
        if (sidebarToggleIcon) {
            sidebarToggleIcon.textContent = isCollapsed ? 'close' : 'menu';
        }
        
        // Alternar texto do label
        if (sidebarToggleLabel) {
            sidebarToggleLabel.textContent = isCollapsed ? 'Fechar menu' : 'Abrir menu';
        }
        
        // Alternar atributos ARIA
        sidebarToggle.setAttribute('aria-expanded', !isCollapsed);
        sidebarToggle.setAttribute('aria-label', isCollapsed ? 'Fechar menu lateral' : 'Abrir menu lateral');
    });
}

async function bootstrapPosts() {
    // Se houver backend remoto configurado, semear no remoto se vazio
    if (hasRemote() && !isAnonymousSession()) {
        const client = getSupabaseClient();
        try {
            const { data, error } = await client
                .from('posts')
                .select('id')
                .limit(1);
            if (error) throw error;
            const isEmpty = !data || data.length === 0;
            if (isEmpty) {
                const payload = seedPosts.map((p) => ({
                    id: p.id,
                    author: p.author,
                    title: p.title,
                    content: p.content,
                    createdAt: p.createdAt,
                }));
                const { error: insertError } = await client.from('posts').insert(payload);
                if (insertError) {
                    console.warn('Falha ao semear posts no Supabase.', insertError);
                }
            }
        } catch (err) {
            console.warn('Erro ao checar/semear posts no Supabase.', err);
        }
        return;
    }
    // Fallback local: semear se não houver posts salvos
    if (!localStorage.getItem(STORAGE_KEYS.posts)) {
        savePosts(seedPosts);
    }
}

function setupLogin() {
    const overlay = document.getElementById('loginOverlay');
    const form = document.getElementById('loginForm');
    const nameField = document.getElementById('loginName');

    if (!form || !overlay || !nameField) return;

    const storedUser = localStorage.getItem(STORAGE_KEYS.user);
    if (storedUser) {
        currentUser = storedUser;
        overlay.classList.add('hidden');
        overlay.style.display = 'none';
        updateUserInfo();
    }

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const value = nameField.value.trim();
        if (!value) {
            nameField.focus();
            return;
        }
        currentUser = value;
        localStorage.setItem(STORAGE_KEYS.user, currentUser);
        updateUserInfo();
        overlay.classList.add('hidden');
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 280);
        renderPosts();
    });
}

function setupPublisherAccess() {
    const entry = document.getElementById('publisherEntry') || document.querySelector('.admin-entry');
    const adminOverlay = document.getElementById('publisherOverlay');
    const adminCloseBtn = document.getElementById('publisherClose');
    const loginOverlay = document.getElementById('publisherLoginOverlay');
    const loginCloseBtn = document.getElementById('publisherLoginClose');
    const loginForm = document.getElementById('publisherLoginForm');
    const loginStatus = document.getElementById('publisherLoginStatus');
    const welcome = document.getElementById('publisherWelcome');
    const postForm = document.getElementById('publisherPostForm');
    const postStatus = document.getElementById('publisherPostStatus');
    const logoutBtn = document.getElementById('publisherLogout');
    const userField = document.getElementById('publisherUser');
    const passwordField = document.getElementById('publisherPassword');
    const backupDownload = document.getElementById('backupDownload');
    const backupFile = document.getElementById('backupFile');
    const backupStatus = document.getElementById('backupStatus');
    const clearAllBtn = document.getElementById('publisherClearAll');
    const clearStatus = document.getElementById('publisherClearStatus');
    const restoreViewBtn = document.getElementById('publisherRestoreView');
    const connectionStatus = document.getElementById('connectionStatus');
    const loginMessage = document.getElementById('publisherLoginMessage');
    const loginContinueBtn = document.getElementById('publisherLoginContinue');

    if (!entry || !adminOverlay || !loginOverlay || !loginForm || !postForm) return;

    entry.addEventListener('click', () => {
        openLoginOverlay();
    });

    adminCloseBtn?.addEventListener('click', closeAdminOverlay);
    loginCloseBtn?.addEventListener('click', closeLoginOverlay);

    adminOverlay.addEventListener('click', (event) => {
        if (event.target === adminOverlay) {
            closeAdminOverlay();
        }
    });

    loginOverlay.addEventListener('click', (event) => {
        if (event.target === loginOverlay) {
            closeLoginOverlay();
        }
    });

    loginContinueBtn?.addEventListener('click', () => {
        if (!currentPublisher) return;
        closeLoginOverlay();
        openAdminOverlay();
    });

    clearAllBtn?.addEventListener('click', async () => {
        const proceed = confirm('Tem certeza que deseja remover TODAS as publicações desta página? Os dados remotos no Supabase NÃO serão afetados.');
        if (!proceed) return;

        // Sinaliza ocultação na UI e limpa dados locais relacionados
        hideAllPostsOnPage = true;
        try {
            const posts = loadPosts();
            posts.forEach((post) => {
                try {
                    localStorage.removeItem(STORAGE_KEYS.feedback(post.id));
                    localStorage.removeItem(STORAGE_KEYS.likes(post.id));
                    localStorage.removeItem(STORAGE_KEYS.likedBy(post.id));
                } catch (err) {
                    console.warn('Falha ao remover dados auxiliares do post:', post.id, err);
                }
            });
            savePosts([]);
            if (clearStatus) {
                clearStatus.textContent = 'Todas as publicações foram removidas desta página. Os dados remotos permanecem intactos.';
                clearStatus.classList.remove('error');
                clearStatus.classList.add('success');
            }
            await renderPosts();
        } catch (error) {
            console.error('Erro ao limpar publicações locais:', error);
            if (clearStatus) {
                clearStatus.textContent = 'Falha ao remover publicações locais.';
                clearStatus.classList.remove('success');
                clearStatus.classList.add('error');
            }
        }
    });

    restoreViewBtn?.addEventListener('click', async () => {
        hideAllPostsOnPage = false;
        if (clearStatus) {
            clearStatus.textContent = 'Visualização restaurada. Publicações remotas serão exibidas novamente.';
            clearStatus.classList.remove('error');
            clearStatus.classList.add('success');
        }
        await renderPosts();
    });

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const identifier = userField?.value.trim() ?? '';
        const password = passwordField?.value ?? '';
        if (!identifier || !password) {
            if (loginStatus) {
                loginStatus.textContent = 'Identificação e senha são obrigatórias.';
                loginStatus.classList.remove('success');
                loginStatus.classList.add('error');
            }
            return;
        }
        try {
            await signInPublisher(identifier, password);
            loginForm.reset();
            closeLoginOverlay();
            openAdminOverlay();
            updateUserInfo();
            await renderPosts();
        } catch (error) {
            console.error('Erro ao autenticar publicador:', error);
            if (loginStatus) {
                loginStatus.textContent = error?.message ?? 'Falha ao autenticar. Verifique credenciais.';
                loginStatus.classList.remove('success');
                loginStatus.classList.add('error');
            }
        }
    });

    postForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!currentPublisher) {
            postStatus?.classList.remove('success');
            postStatus?.classList.add('error');
            if (postStatus) {
                postStatus.textContent = 'Faça login como publicador para postar.';
            }
            return;
        }

        const titleField = document.getElementById('publisherPostTitle');
        const contentField = document.getElementById('publisherPostContent');
        const title = titleField?.value.trim() ?? '';
        const rawContent = contentField?.value.trim() ?? '';

        if (!title || !rawContent) {
            postStatus?.classList.remove('success');
            postStatus?.classList.add('error');
            if (postStatus) {
                postStatus.textContent = 'Título e conteúdo são obrigatórios.';
            }
            return;
        }

        const paragraphs = rawContent
            .split(/\n{2,}/)
            .map((chunk) => chunk.trim())
            .filter(Boolean);

        if (!paragraphs.length) {
            postStatus?.classList.remove('success');
            postStatus?.classList.add('error');
            if (postStatus) {
                postStatus.textContent = 'Separe o conteúdo em parágrafos válidos.';
            }
            return;
        }

        const createdAt = new Date().toISOString();
        const postId = `${currentPublisher.name.toLowerCase()}-${createdAt}`;

        const newPost = {
            id: postId,
            author: currentPublisher.name,
            title,
            content: paragraphs,
            createdAt,
        };

        try {
            await createPost(newPost);
            postForm.reset();
            if (postStatus) {
                postStatus.textContent = 'Publicação criada com sucesso! Ela já está no blog.';
                postStatus.classList.remove('error');
                postStatus.classList.add('success');
            }
            await renderPosts();
        } catch (err) {
            console.error('Erro ao criar publicação:', err);
            if (postStatus) {
                postStatus.textContent = 'Falha ao publicar. Tente novamente.';
                postStatus.classList.remove('success');
                postStatus.classList.add('error');
            }
        }
    });

    logoutBtn?.addEventListener('click', async () => {
        await signOutPublisher();
        closeAdminOverlay();
        openLoginOverlay();
        updateUserInfo();
        await renderPosts();
    });

    backupDownload?.addEventListener('click', () => {
        try {
            const data = buildBackupData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
            a.href = url;
            a.download = `aa-backup-${stamp}.json`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 0);
            if (backupStatus) {
                backupStatus.textContent = 'Backup baixado com sucesso.';
                backupStatus.classList.remove('error');
                backupStatus.classList.add('success');
            }
        } catch (error) {
            console.error('Erro ao gerar backup:', error);
            if (backupStatus) {
                backupStatus.textContent = 'Falha ao gerar backup.';
                backupStatus.classList.remove('success');
                backupStatus.classList.add('error');
            }
        }
    });

    backupFile?.addEventListener('change', async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            restoreBackup(data);
            if (backupStatus) {
                backupStatus.textContent = 'Backup restaurado com sucesso.';
                backupStatus.classList.remove('error');
                backupStatus.classList.add('success');
            }
            renderPosts();
        } catch (error) {
            console.error('Erro ao restaurar backup:', error);
            if (backupStatus) {
                backupStatus.textContent = 'Falha ao restaurar backup. Verifique o arquivo.';
                backupStatus.classList.remove('success');
                backupStatus.classList.add('error');
            }
        } finally {
            event.target.value = '';
        }
    });

    function openAdminOverlay() {
        adminOverlay.classList.add('visible');
        prepareDashboard();
        refreshConnectionStatus();
    }

    function closeAdminOverlay() {
        adminOverlay.classList.remove('visible');
    }

    function openLoginOverlay() {
        if (loginStatus) {
            loginStatus.textContent = '';
            loginStatus.classList.remove('error', 'success');
        }
        if (loginMessage) {
            if (currentPublisher) {
                loginMessage.textContent = `Sessão ativa como ${currentPublisher.name}.`;
                loginMessage.classList.remove('error');
                loginMessage.classList.add('success');
            } else {
                loginMessage.textContent = 'Informe sua identificação para acessar a área reservada.';
                loginMessage.classList.remove('success');
                loginMessage.classList.add('error');
            }
        }
        if (loginContinueBtn) {
            loginContinueBtn.classList.toggle('is-hidden', !currentPublisher);
        }
        loginOverlay.classList.add('visible');
    }

    function closeLoginOverlay() {
        loginOverlay.classList.remove('visible');
    }

    function prepareDashboard() {
        welcome.textContent = currentPublisher
            ? `Olá, ${currentPublisher.name}! Prepare algo especial para os leitores.`
            : '';
        if (postStatus) {
            postStatus.textContent = '';
            postStatus.classList.remove('error', 'success');
        }
    }

    function refreshConnectionStatus() {
        if (!connectionStatus) return;
        const remote = hasRemote();
        connectionStatus.classList.remove('error', 'success');
        if (!remote) {
            connectionStatus.textContent = 'Visualização local (localStorage)';
            connectionStatus.classList.add('error');
            return;
        }
        if (currentPublisher) {
            connectionStatus.textContent = `Supabase conectado como ${currentPublisher.name}`;
        } else if (isAnonymousSession()) {
            connectionStatus.textContent = 'Sessão anônima Supabase ativa';
        } else {
            connectionStatus.textContent = 'Sessão Supabase autenticada';
        }
        connectionStatus.classList.add('success');
    }
}

async function signInPublisher(identifier, password) {
    const client = getSupabaseClient();
    if (!client) {
        throw new Error('Configure o Supabase antes de autenticar publicadores.');
    }
    const profile = getPublisherProfile(identifier);
    if (!profile?.email) {
        throw new Error('Publicador não encontrado. Atualize o config.js com os e-mails corretos.');
    }
    const { data, error } = await client.auth.signInWithPassword({
        email: profile.email,
        password,
    });
    if (error) {
        throw error;
    }
    if (data?.session) {
        handleSessionChange(data.session);
    }
    return true;
}

async function signOutPublisher() {
    const client = getSupabaseClient();
    if (!client) {
        currentPublisher = null;
        return;
    }
    try {
        await client.auth.signOut();
    } catch (error) {
        console.warn('Erro ao encerrar sessão do Supabase.', error);
    } finally {
        currentPublisher = null;
        handleSessionChange(null);
        await ensureAnonymousSession(client);
    }
}

function getPublisherProfile(identifier) {
    if (!identifier) return null;
    const key = normalizeIdentifier(identifier);
    const profile = PUBLISHER_ACCOUNTS[key];
    if (!profile) return null;
    return { ...profile, key };
}

async function renderPosts() {
    const timeline = document.getElementById('postTimeline');
    const template = document.getElementById('postTemplate');
    if (!timeline || !template) return;

    activeReplyForm = null;
    timeline.innerHTML = '';

    // Se a UI estiver marcada para ocultar todas as publicações, não renderiza nenhuma
    if (hideAllPostsOnPage) {
        const info = document.createElement('p');
        info.textContent = 'Nenhuma publicação nesta página.';
        info.setAttribute('aria-live', 'polite');
        timeline.appendChild(info);
        return;
    }

    const posts = await getPosts();
    // Filtrar posts marcados para ocultação somente na UI
    const visiblePosts = posts.filter((p) => {
        const byId = AUTO_HIDE_POST_IDS_ON_PAGE.has(p.id);
        const byTitle = AUTO_HIDE_TITLES_ON_PAGE.has(p.title);
        return !(byId || byTitle);
    });

    const likeSnapshots = await fetchLikeSnapshots(visiblePosts.map((p) => p.id));

    for (let index = 0; index < visiblePosts.length; index++) {
        const post = visiblePosts[index];
        const fragment = template.content.cloneNode(true);
        const article = fragment.querySelector('.post');
        article.dataset.postId = post.id;

        const avatar = article.querySelector('.author-avatar');
        avatar.innerHTML = '';
        const photoSrc = AUTHOR_PHOTOS[post.author];
        if (photoSrc) {
            const img = document.createElement('img');
            img.src = photoSrc;
            img.alt = `Foto de ${post.author}`;
            avatar.appendChild(img);
            avatar.style.background = 'none';
        } else {
            const style = AUTHOR_STYLES[post.author]?.gradient;
            avatar.style.background = style ?? 'linear-gradient(135deg, #6410c2, #fc3dac)';
            avatar.textContent = post.author.slice(0, 2).toUpperCase();
        }

        const title = article.querySelector('.post-title');
        title.textContent = post.title;

        const meta = article.querySelector('.post-meta');
        meta.textContent = buildMeta(post);

        const body = article.querySelector('.post-body');
        body.innerHTML = '';
        post.content.forEach((paragraph) => {
            const p = document.createElement('p');
            p.textContent = paragraph;
            body.appendChild(p);
        });

        const likeBtn = article.querySelector('.like-btn');
        const likeCount = article.querySelector('.like-count');
        const likeState = likeSnapshots[post.id] ?? buildLocalLikeState(post.id);
        applyLikeState(likeBtn, likeCount, likeState);
        likeBtn.addEventListener('click', () => handleLike(post.id, likeBtn, likeCount));

        const form = article.querySelector('.feedback-form');
        const textarea = form.querySelector('textarea');
        const label = form.querySelector('label');
        const radioButtons = form.querySelectorAll('input[type="radio"]');
        const feedbackList = article.querySelector('.feedback-list');

        const fieldId = `feedback-${post.id}`;
        textarea.id = fieldId;
        label.setAttribute('for', fieldId);

        const radioName = `feedbackType-${post.id}`;
        radioButtons.forEach((radio, position) => {
            radio.name = radioName;
            radio.id = `${radioName}-${position}`;
            const wrapper = radio.parentElement;
            if (wrapper && !wrapper.getAttribute('for')) {
                wrapper.setAttribute('for', radio.id);
            }
        });

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            ensureReaderIdentity();
            const message = textarea.value.trim();
            if (!message) {
                textarea.focus();
                return;
            }
            const feedbackType = [...radioButtons].find((radio) => radio.checked)?.value ?? 'Comentário';
            const entry = {
                id: generateId(),
                parentId: null,
                author: currentUser,
                role: 'reader',
                type: feedbackType,
                message,
                timestamp: new Date().toISOString(),
            };
            await persistFeedback(post.id, entry);
            form.reset();
            if (radioButtons[0]) {
                radioButtons[0].checked = true;
            }
            await renderFeedbackThread(post, feedbackList);
        });

        await renderFeedbackThread(post, feedbackList);

        timeline.appendChild(fragment);
        article.style.animationDelay = `${index * 80}ms`;
    }
}

function buildMeta(post) {
    const dateText = formatPostDate(post.createdAt);
    const rhythm = AUTHOR_RHYTHMS[post.author];
    if (!dateText && !rhythm) {
        return `Publicado por ${post.author}`;
    }
    if (!rhythm) {
        return `Publicado por ${post.author} em ${dateText}`;
    }
    return `Publicado por ${post.author} em ${dateText} • ${rhythm}`;
}

function formatPostDate(value) {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) {
        return '';
    }
    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function loadPosts() {
    const stored = localStorage.getItem(STORAGE_KEYS.posts);
    if (!stored) return [];
    try {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error('Erro ao carregar publicações:', error);
        return [];
    }
}

function savePosts(posts) {
    localStorage.setItem(STORAGE_KEYS.posts, JSON.stringify(posts));
}

// Busca posts do backend (Supabase) com fallback para localStorage
async function getPosts() {
    const client = getSupabaseClient();
    if (!client) {
        return loadPosts().sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
    try {
        const { data, error } = await client
            .from('posts')
            .select('id, author, title, content, createdAt')
            .order('createdAt', { ascending: false });
        if (error) throw error;
        const posts = (data || []).map((p) => ({
            id: p.id,
            author: p.author,
            title: p.title,
            content: Array.isArray(p.content) ? p.content : (p.content ? [String(p.content)] : []),
            createdAt: p.createdAt,
        }));
        return posts;
    } catch (err) {
        console.warn('Erro ao buscar posts no Supabase. Usando dados locais.', err);
        return loadPosts().sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
}

// Cria uma publicação no backend quando possível; caso contrário, salva localmente
async function createPost(post) {
    const client = getSupabaseClient();
    if (client) {
        try {
            const payload = {
                id: post.id,
                author: post.author,
                title: post.title,
                content: post.content,
                createdAt: post.createdAt,
            };
            const { error } = await client.from('posts').insert(payload);
            if (error) throw error;
            return true;
        } catch (err) {
            console.warn('Falha ao criar post no Supabase. Salvando localmente.', err);
        }
    }
    const posts = loadPosts();
    posts.push(post);
    savePosts(posts);
    return true;
}

function loadLocalLikes(postId) {
    const stored = localStorage.getItem(STORAGE_KEYS.likes(postId));
    return stored ? Number(stored) : 0;
}

function loadLocalLikedUsers(postId) {
    const stored = localStorage.getItem(STORAGE_KEYS.likedBy(postId));
    if (!stored) return [];
    try {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error('Erro ao carregar curtidas locais:', error);
        return [];
    }
}

function buildLocalLikeState(postId) {
    ensureReaderIdentity();
    const likedUsers = loadLocalLikedUsers(postId);
    return {
        count: loadLocalLikes(postId),
        liked: likedUsers.includes(currentUser),
    };
}

function applyLikeState(button, counter, state) {
    if (counter) {
        counter.textContent = state?.count ?? 0;
    }
    if (button) {
        button.classList.toggle('liked', !!state?.liked);
    }
}

async function fetchLikeSnapshots(postIds) {
    const states = {};
    if (!Array.isArray(postIds) || !postIds.length) {
        return states;
    }
    const client = getSupabaseClient();
    if (!client) {
        postIds.forEach((id) => {
            states[id] = buildLocalLikeState(id);
        });
        return states;
    }
    try {
        const { data, error } = await client
            .from('post_like_totals')
            .select('postId, likes')
            .in('postId', postIds);
        if (error) throw error;
        (data || []).forEach(({ postId, likes }) => {
            states[postId] = { count: likes ?? 0, liked: false };
        });
        const fingerprint = getLikeFingerprint();
        if (fingerprint) {
            const { data: likedRows, error: likedError } = await client
                .from('likes')
                .select('postId')
                .eq('fingerprint', fingerprint)
                .in('postId', postIds);
            if (likedError) throw likedError;
            (likedRows || []).forEach(({ postId }) => {
                states[postId] = {
                    count: states[postId]?.count ?? 0,
                    liked: true,
                };
            });
        }
    } catch (error) {
        console.warn('Erro ao carregar curtidas no Supabase. Usando dados locais.', error);
        postIds.forEach((id) => {
            states[id] = buildLocalLikeState(id);
        });
    }
    return states;
}

function toggleLocalLike(postId) {
    ensureReaderIdentity();
    const likedUsers = new Set(loadLocalLikedUsers(postId));
    let likes = loadLocalLikes(postId);
    if (likedUsers.has(currentUser)) {
        likedUsers.delete(currentUser);
        likes = Math.max(0, likes - 1);
    } else {
        likedUsers.add(currentUser);
        likes += 1;
    }
    localStorage.setItem(STORAGE_KEYS.likes(postId), likes);
    localStorage.setItem(STORAGE_KEYS.likedBy(postId), JSON.stringify([...likedUsers]));
    return {
        count: likes,
        liked: likedUsers.has(currentUser),
    };
}

async function handleLike(postId, button, counter) {
    ensureReaderIdentity();
    const client = getSupabaseClient();
    const fingerprint = getLikeFingerprint();
    if (client && fingerprint) {
        try {
            const currentlyLiked = button?.classList.contains('liked');
            if (currentlyLiked) {
                const { error } = await client
                    .from('likes')
                    .delete()
                    .match({ postId, fingerprint });
                if (error) throw error;
            } else {
                const { error } = await client
                    .from('likes')
                    .upsert({ postId, fingerprint }, { onConflict: 'postId,fingerprint' });
                if (error) throw error;
            }
            const snapshot = await fetchLikeSnapshots([postId]);
            applyLikeState(button, counter, snapshot[postId] ?? { count: 0, liked: false });
            return;
        } catch (error) {
            console.warn('Erro ao sincronizar curtida com Supabase. Aplicando fallback local.', error);
        }
    }
    const fallbackState = toggleLocalLike(postId);
    applyLikeState(button, counter, fallbackState);
}

function loadFeedback(postId) {
    const stored = localStorage.getItem(STORAGE_KEYS.feedback(postId));
    if (!stored) return [];
    try {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error('Erro ao carregar feedback:', error);
        return [];
    }
}

function saveFeedback(postId, entries) {
    localStorage.setItem(STORAGE_KEYS.feedback(postId), JSON.stringify(entries));
}

// Busca feedback do backend com fallback
async function getFeedback(postId) {
    const client = getSupabaseClient();
    if (!client) return loadFeedback(postId);
    try {
        const { data, error } = await client
            .from('feedback')
            .select('id, "parentId", author, role, type, message, timestamp')
            .eq('postId', postId)
            .order('timestamp', { ascending: true });
        if (error) throw error;
        const entries = Array.isArray(data) ? data : [];
        return entries.map((row) => ({
            id: row.id,
            parentId: row.parentId ?? null,
            author: row.author,
            role: row.role,
            type: row.type,
            message: row.message,
            timestamp: row.timestamp,
        }));
    } catch (err) {
        console.warn('Erro ao buscar feedback no Supabase. Usando dados locais.', err);
        return loadFeedback(postId);
    }
}

async function persistFeedback(postId, entry) {
    const client = getSupabaseClient();
    if (client) {
        try {
            const payload = {
                id: entry.id,
                postId,
                parentId: entry.parentId,
                author: entry.author,
                role: entry.role,
                type: entry.type,
                message: entry.message,
                timestamp: entry.timestamp,
            };
            const { error } = await client.from('feedback').insert(payload);
            if (error) throw error;
            return;
        } catch (err) {
            console.warn('Falha ao gravar feedback no Supabase. Salvando localmente.', err);
        }
    }
    const entries = loadFeedback(postId);
    entries.push(entry);
    saveFeedback(postId, entries);
}

async function renderFeedbackThread(post, listElement) {
    if (!listElement) return;
    activeReplyForm = null;
    listElement.innerHTML = '';
    const entries = await getFeedback(post.id);
    if (!entries.length) return;
    renderFeedbackList(entries, null, listElement, post, 0);
}

function renderFeedbackList(entries, parentId, listElement, post, level) {
    const branch = entries
        .filter((entry) => entry.parentId === parentId)
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    branch.forEach((entry) => {
        const item = document.createElement('li');
        item.className = 'feedback-item';
        item.dataset.feedbackId = entry.id;
        if (entry.role === 'author') {
            item.classList.add('from-author');
        }

        const heading = document.createElement('strong');
        const authorLabel = entry.role === 'author' ? `${entry.type} de ${entry.author} (autor)` : `${entry.type} de ${entry.author}`;
        heading.textContent = authorLabel;

        const message = document.createElement('p');
        message.textContent = entry.message;

        const time = document.createElement('span');
        time.textContent = formatTimestamp(entry.timestamp);

        item.append(heading, message, time);

        const rootList = listElement.classList.contains('feedback-list')
            ? listElement
            : listElement.closest('.feedback-list');
        const actions = createReplyActions({
            entry,
            post,
            nextDepth: level + 1,
            container: item,
            rootList,
        });
        if (actions) {
            item.appendChild(actions);
        }

        const children = document.createElement('ul');
        children.className = 'feedback-children';
        renderFeedbackList(entries, entry.id, children, post, level + 1);
        if (children.childElementCount > 0) {
            item.appendChild(children);
        }

        listElement.appendChild(item);
    });
}

function createReplyActions({ entry, post, nextDepth, container, rootList }) {
    const canPublisherReply = currentPublisher && currentPublisher.name === post.author;
    const canReaderReply = currentUser && currentUser === entry.author;

    if (!canPublisherReply && !canReaderReply) {
        return null;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'feedback-reply-actions';

    if (canPublisherReply) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'reply-trigger';
        button.textContent = `Responder como ${currentPublisher.name}`;
        button.addEventListener('click', () => {
            openReplyForm({
                post,
                parentEntry: entry,
                host: container,
                responder: { name: currentPublisher.name, role: 'author' },
                nextDepth,
                rootList,
            });
        });
        wrapper.appendChild(button);
    }

    if (canReaderReply && (!currentPublisher || currentPublisher.name !== currentUser)) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'reply-trigger';
        button.textContent = 'Responder';
        button.addEventListener('click', () => {
            openReplyForm({
                post,
                parentEntry: entry,
                host: container,
                responder: { name: currentUser, role: 'reader' },
                nextDepth,
                rootList,
            });
        });
        wrapper.appendChild(button);
    }

    return wrapper.childElementCount ? wrapper : null;
}

function openReplyForm({ post, parentEntry, host, responder, nextDepth, rootList }) {
    if (responder.role === 'reader') {
        ensureReaderIdentity();
        if (currentUser !== responder.name) {
            return;
        }
    }
    if (responder.role === 'author' && (!currentPublisher || currentPublisher.name !== responder.name)) {
        return;
    }

    if (activeReplyForm) {
        activeReplyForm.remove();
        activeReplyForm = null;
    }

    const form = document.createElement('form');
    form.className = 'reply-form';

    const textarea = document.createElement('textarea');
    textarea.placeholder = responder.role === 'author'
        ? 'Escreva sua réplica ou tréplica'
        : 'Compartilhe sua resposta';
    textarea.required = true;

    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.textContent = 'Enviar';

    form.append(textarea, submit);
    host.appendChild(form);
    textarea.focus();
    activeReplyForm = form;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const message = textarea.value.trim();
        if (!message) {
            textarea.focus();
            return;
        }
        const entry = {
            id: generateId(),
            parentId: parentEntry.id,
            author: responder.name,
            role: responder.role,
            type: determineReplyType(responder.role, parentEntry, nextDepth),
            message,
            timestamp: new Date().toISOString(),
        };
        await persistFeedback(post.id, entry);
        activeReplyForm = null;
        await renderFeedbackThread(post, rootList);
    });
}

function determineReplyType(role, parentEntry, depth) {
    if (role === 'author') {
        return depth >= 3 ? 'Tréplica' : 'Réplica';
    }
    if (parentEntry.role === 'author') {
        return 'Resposta do leitor';
    }
    return 'Comentário';
}

function formatTimestamp(value) {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) {
        return '';
    }
    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function buildBackupData() {
    const posts = loadPosts();
    const feedback = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('aa:feedback:')) {
            const postId = key.slice('aa:feedback:'.length);
            try {
                const raw = localStorage.getItem(key) || '[]';
                const entries = JSON.parse(raw);
                feedback[postId] = Array.isArray(entries) ? entries : [];
            } catch {
                feedback[postId] = [];
            }
        }
    }
    return { posts, feedback };
}

function restoreBackup(data) {
    if (!data || !Array.isArray(data.posts) || typeof data.feedback !== 'object') {
        throw new Error('Backup inválido: estrutura não reconhecida');
    }
    savePosts(data.posts);
    Object.entries(data.feedback).forEach(([postId, entries]) => {
        if (Array.isArray(entries)) {
            saveFeedback(postId, entries);
        }
    });
}

function updateUserInfo() {
    const target = document.getElementById('userInfo');
    if (!target) return;
    // Não exibir referências; manter conteúdo estático do header (botão Administração)
    return;
}

function ensureReaderIdentity() {
    if (currentUser && typeof currentUser === 'string') return currentUser;
    const sessionUser = authSession?.user;
    if (sessionUser) {
        const metadataName = sessionUser.user_metadata?.display_name
            || sessionUser.user_metadata?.author
            || sessionUser.user_metadata?.name;
        if (metadataName) {
            currentUser = metadataName;
            return currentUser;
        }
        if (sessionUser.id) {
            const alias = `Visitante-${sessionUser.id.slice(-4)}`;
            currentUser = alias;
            try {
                localStorage.setItem(STORAGE_KEYS.user, alias);
            } catch (_) {
                // ignore storage errors
            }
            return currentUser;
        }
    }
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.user);
        if (stored && typeof stored === 'string') {
            currentUser = stored;
            return currentUser;
        }
        const rnd = Math.random().toString(36).slice(2, 6);
        currentUser = `Visitante-${rnd}`;
        localStorage.setItem(STORAGE_KEYS.user, currentUser);
        return currentUser;
    } catch (_) {
        currentUser = 'Visitante';
        return currentUser;
    }
}

function generateId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function capitalize(value) {
    if (!value) return '';
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function wordLower(value) {
    return value ? value.toLowerCase() : '';
}

function normalizePublisherAccounts(defaults, overrides) {
    const normalizedDefaults = {};
    Object.entries(defaults || {}).forEach(([key, data]) => {
        if (!data) return;
        normalizedDefaults[key.toUpperCase()] = {
            email: data.email || '',
            displayName: data.displayName || data.name || capitalize(wordLower(key)),
        };
    });
    if (!overrides || typeof overrides !== 'object') {
        return normalizedDefaults;
    }
    Object.entries(overrides).forEach(([key, data]) => {
        if (!data) return;
        const upper = key.toUpperCase();
        normalizedDefaults[upper] = {
            email: data.email || normalizedDefaults[upper]?.email || '',
            displayName: data.displayName || data.name || normalizedDefaults[upper]?.displayName || capitalize(wordLower(key)),
        };
    });
    return normalizedDefaults;
}

function normalizeIdentifier(value) {
    if (!value) return '';
    return value
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase();
}
