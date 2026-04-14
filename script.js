const STORAGE_KEYS = {
    user: 'aa:user',
    userProfile: 'aa:user-profile',
    adminToken: 'aa:admin-token',
    adminProfile: 'aa:admin-profile',
    posts: 'aa:posts',
    likes: (postId) => `aa:likes:${postId}`,
    likedBy: (postId) => `aa:likedBy:${postId}`,
    feedback: (postId) => `aa:feedback:${postId}`,
};

const AUTHOR_STYLES = {
    Paulo: {
        gradient: 'linear-gradient(135deg, #2a33fc, #ff6819)',
    },
    Angelica: {
        gradient: 'linear-gradient(135deg, #2a33fc, #cfd2ff)',
    },
};

const AUTHOR_PHOTOS = {
    Paulo: 'paulo.png',
    'Paulo Volker': 'paulo.png',
    Angelica: 'angelica.jpg',
    'Angelica Satiro': 'angelica.jpg',
};

const AUTHOR_RHYTHMS = {
    Paulo: 'Cadência contemplativa guiada por Paulo',
    'Paulo Volker': 'Cadência contemplativa guiada por Paulo',
    Angelica: 'Fluxo intuitivo conduzido por Angelica',
    'Angelica Satiro': 'Fluxo intuitivo conduzido por Angelica',
};

const DEFAULT_PUBLISHERS = {
    PAULO: {
        displayName: 'Paulo Volker',
        identifier: 'Paulo Volker',
    },
    ANGELICA: {
        displayName: 'Angelica Satiro',
        identifier: 'Angelica Satiro',
    },
};

let PUBLISHER_ACCOUNTS = normalizePublisherAccounts(
    DEFAULT_PUBLISHERS,
    window.APP_CONFIG?.publisherAccounts
);

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

let currentUser = null;
let currentUserId = null;
let currentUserEmail = null;
let currentUserCity = null;
let currentPublisher = null;
let activeReplyForm = null;
let adminToken = null;
let hideAllPostsOnPage = false;
const PAGE_MODE = window.APP_CONFIG?.pageMode || 'home';
const AUTO_HIDE_POST_IDS_ON_PAGE = new Set(
    (window.APP_CONFIG && Array.isArray(window.APP_CONFIG.hiddenPostIds))
        ? window.APP_CONFIG.hiddenPostIds
        : []
);
const AUTO_HIDE_TITLES_ON_PAGE = new Set(
    (window.APP_CONFIG && Array.isArray(window.APP_CONFIG.hiddenPostTitles))
        ? window.APP_CONFIG.hiddenPostTitles
        : ['Sintonia entre mente e intuição']
);

function getApiBaseUrl() {
    const configured = window.APP_CONFIG?.apiBaseUrl || '';
    return configured.endsWith('/') ? configured.slice(0, -1) : configured;
}

function apiUrl(pathname) {
    const base = getApiBaseUrl();
    return `${base}${pathname}`;
}

async function apiRequest(pathname, { method = 'GET', body, headers = {}, auth = false } = {}) {
    const requestHeaders = { ...headers };
    if (body !== undefined) {
        requestHeaders['Content-Type'] = 'application/json';
    }
    if (auth && adminToken) {
        requestHeaders.Authorization = `Bearer ${adminToken}`;
    }
    const response = await fetch(apiUrl(pathname), {
        method,
        headers: requestHeaders,
        body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!response.ok) {
        let message = `HTTP ${response.status}`;
        try {
            const data = await response.json();
            message = data?.error || message;
        } catch (_) {
            // ignore JSON parse failures
        }
        throw new Error(message);
    }
    if (response.status === 204) {
        return null;
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
}

function hasBackend() {
    return typeof window.fetch === 'function';
}

function hasRemote() {
    return hasBackend();
}

function getLikeFingerprint() {
    ensureReaderIdentity();
    return currentUserId || currentUser;
}

function loadReaderProfile() {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.userProfile);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return null;
        return parsed;
    } catch (_) {
        return null;
    }
}

function saveReaderProfile(profile) {
    try {
        localStorage.setItem(STORAGE_KEYS.userProfile, JSON.stringify(profile));
        if (profile?.name) {
            localStorage.setItem(STORAGE_KEYS.user, profile.name);
        }
    } catch (_) {
        // ignore storage failures
    }
}

function loadAdminProfile() {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.adminProfile);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return null;
        return parsed;
    } catch (_) {
        return null;
    }
}

function saveAdminProfile(profile, token) {
    try {
        if (token) {
            localStorage.setItem(STORAGE_KEYS.adminToken, token);
        }
        localStorage.setItem(STORAGE_KEYS.adminProfile, JSON.stringify(profile));
    } catch (_) {
        // ignore storage failures
    }
}

function clearAdminProfile() {
    adminToken = null;
    currentPublisher = null;
    try {
        localStorage.removeItem(STORAGE_KEYS.adminToken);
        localStorage.removeItem(STORAGE_KEYS.adminProfile);
    } catch (_) {
        // ignore storage failures
    }
}

function normalizeAuthorKey(author) {
    const normalized = normalizeKey(author);
    if (normalized.includes('paulo')) return 'Paulo Volker';
    if (normalized.includes('angelica')) return 'Angelica Satiro';
    return author;
}

window.addEventListener('DOMContentLoaded', initializeApp);

async function initializeApp() {
    // Atualizar PUBLISHER_ACCOUNTS com valores do config.js
    PUBLISHER_ACCOUNTS = normalizePublisherAccounts(
        DEFAULT_PUBLISHERS,
        window.APP_CONFIG?.publisherAccounts
    );
    await restoreAdminSession();
    await bootstrapPosts();
    setupLogin();
    setupPublisherAccess();
    setupSidebarToggle();
    setupMethodModal();
    setupBlogDiaryModal();
    setupCoursesModal();
    setupPalestrasModal();
    setupConversationComposer();
    if (PAGE_MODE === 'conversations') {
        setupConversationPageGate();
        if (hasConversationAccess()) {
            ensureReaderIdentity();
            await renderPosts();
        }
    } else {
        ensureReaderIdentity();
        await renderPosts();
    }
    updateUserInfo();
    const staticEnter = document.getElementById('enterButtonStatic');
    if (staticEnter) {
        staticEnter.addEventListener('click', async () => {
            if (PAGE_MODE === 'conversations' && !hasConversationAccess()) {
                await unlockConversationPage();
                return;
            }
            await ensureLoginForParticipation();
            updateUserInfo();
        });
    }
}

async function initializeAuth() {
    await restoreAdminSession();
}

async function restoreAdminSession() {
    const storedProfile = loadAdminProfile();
    const storedToken = localStorage.getItem(STORAGE_KEYS.adminToken);
    if (!storedProfile || !storedToken) {
        clearAdminProfile();
        return;
    }

    adminToken = storedToken;
    try {
        const payload = await apiRequest('/api/auth/admin/me', {
            headers: {
                Authorization: `Bearer ${storedToken}`,
            },
        });
        currentPublisher = {
            name: payload?.admin?.name || storedProfile.name,
            login: payload?.admin?.login || storedProfile.login,
            token: storedToken,
        };
    } catch (_) {
        clearAdminProfile();
    }
}

function setupSidebarToggle() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebarToggleIcon = document.getElementById('sidebarToggleIcon');
    const sidebarToggleLabel = document.getElementById('sidebarToggleLabel');
    
    if (!sidebarToggle) return;
    
    
    sidebarToggle.addEventListener('click', function() {
        const isCollapsed = document.body.classList.toggle('sidebar-collapsed');
        document.body.classList.toggle('sidebar-open');
        
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

function setupMethodModal() {
    const trigger = document.getElementById('methodButton');
    const modal = document.getElementById('methodModal');
    if (!trigger || !modal) return;

    const closeButtons = modal.querySelectorAll('[data-method-close]');

    const openModal = () => {
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
    };

    const closeModal = () => {
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
    };

    trigger.addEventListener('click', openModal);
    closeButtons.forEach((node) => node.addEventListener('click', closeModal));

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal.classList.contains('is-open')) {
            closeModal();
        }
    });
}

function setupBlogDiaryModal() {
    const trigger = document.getElementById('blogDiaryButton');
    const modal = document.getElementById('blogDiaryModal');
    const joinButton = document.getElementById('blogDiaryJoinButton');
    if (!trigger || !modal) return;

    const closeButtons = modal.querySelectorAll('[data-blog-close]');

    const openModal = () => {
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
    };

    const closeModal = () => {
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
    };

    trigger.addEventListener('click', openModal);
    closeButtons.forEach((node) => node.addEventListener('click', closeModal));

    joinButton?.addEventListener('click', async () => {
        const ok = await ensureLoginForParticipation();
        if (ok) {
            updateUserInfo();
            closeModal();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal.classList.contains('is-open')) {
            closeModal();
        }
    });
}

function setupCoursesModal() {
    const trigger = document.getElementById('coursesButton');
    const modal = document.getElementById('coursesModal');
    const form = document.getElementById('courseInterestForm');
    const status = document.getElementById('courseInterestStatus');
    const nameField = document.getElementById('courseInterestName');
    const emailField = document.getElementById('courseInterestEmail');
    const cityField = document.getElementById('courseInterestCity');
    if (!trigger || !modal || !form) return;

    const closeButtons = modal.querySelectorAll('[data-courses-close]');

    const openModal = () => {
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
        status.textContent = '';
        status.classList.remove('error', 'success');
        if (currentUser) nameField.value = currentUser;
        if (currentUserEmail) emailField.value = currentUserEmail;
        if (currentUserCity) cityField.value = currentUserCity;
    };

    const closeModal = () => {
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
    };

    trigger.addEventListener('click', openModal);
    closeButtons.forEach((node) => node.addEventListener('click', closeModal));

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const name = nameField?.value.trim() || '';
        const email = emailField?.value.trim().toLowerCase() || '';
        const city = cityField?.value.trim() || '';

        if (!name || !email || !city) {
            if (status) {
                status.textContent = 'Preencha nome, email e cidade.';
                status.classList.remove('success');
                status.classList.add('error');
            }
            return;
        }

        try {
            let user = null;
            if (hasRemote()) {
                user = await apiRequest('/api/users', {
                    method: 'POST',
                    body: { name, email, city },
                });
            }

            currentUserId = String(user?.id || email);
            currentUser = user?.name || name;
            currentUserEmail = user?.email || email;
            currentUserCity = user?.city || city;
            saveReaderProfile({
                id: currentUserId,
                name: currentUser,
                email: currentUserEmail,
                city: currentUserCity,
            });

            if (status) {
                status.textContent = 'Interesse registrado. Você já está na lista da comunidade.';
                status.classList.remove('error');
                status.classList.add('success');
            }

            updateUserInfo();
            setTimeout(() => {
                closeModal();
                form.reset();
            }, 900);
        } catch (error) {
            console.error('Falha ao registrar interesse no curso:', error);
            if (status) {
                status.textContent = error?.message ?? 'Falha ao registrar interesse.';
                status.classList.remove('success');
                status.classList.add('error');
            }
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal.classList.contains('is-open')) {
            closeModal();
        }
    });
}

function setupPalestrasModal() {
    const trigger = document.getElementById('palestrasButton');
    const modal = document.getElementById('palestrasModal');
    const form = document.getElementById('palestraContactForm');
    const status = document.getElementById('palestraContactStatus');
    const nameField = document.getElementById('palestraContactName');
    const emailField = document.getElementById('palestraContactEmail');
    const cityField = document.getElementById('palestraContactCity');
    if (!trigger || !modal) return;

    const closeButtons = modal.querySelectorAll('[data-palestras-close]');

    const openModal = () => {
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
    };

    const closeModal = () => {
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
    };

    trigger.addEventListener('click', openModal);
    closeButtons.forEach((node) => node.addEventListener('click', closeModal));

    if (form) {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const name = nameField?.value.trim() || '';
            const email = emailField?.value.trim().toLowerCase() || '';
            const city = cityField?.value.trim() || '';

            if (!name || !email || !city) {
                if (status) {
                    status.textContent = 'Preencha nome, email e cidade.';
                    status.classList.remove('success');
                    status.classList.add('error');
                }
                return;
            }

            try {
                let user = null;
                if (hasRemote()) {
                    user = await apiRequest('/api/users', {
                        method: 'POST',
                        body: { name, email, city },
                    });
                }

                currentUserId = String(user?.id || email);
                currentUser = user?.name || name;
                currentUserEmail = user?.email || email;
                currentUserCity = user?.city || city;
                saveReaderProfile({
                    id: currentUserId,
                    name: currentUser,
                    email: currentUserEmail,
                    city: currentUserCity,
                });

                if (status) {
                    status.textContent = 'Pedido de agenda registrado. Em breve entraremos em contato.';
                    status.classList.remove('error');
                    status.classList.add('success');
                }

                updateUserInfo();
                setTimeout(() => {
                    closeModal();
                    form.reset();
                }, 900);
            } catch (error) {
                console.error('Falha ao registrar interesse na palestra:', error);
                if (status) {
                    status.textContent = error?.message ?? 'Falha ao registrar interesse.';
                    status.classList.remove('success');
                    status.classList.add('error');
                }
            }
        });
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal.classList.contains('is-open')) {
            closeModal();
        }
    });
}

async function bootstrapPosts() {
    if (hasRemote()) {
        try {
            const posts = await getPosts();
            if (Array.isArray(posts) && posts.length > 0) {
                return;
            }
        } catch (err) {
            console.warn('Falha ao verificar posts remotos. Usando fallback local.', err);
        }
    }
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
        const proceed = confirm('Tem certeza que deseja remover TODAS as publicações desta página? Os dados remotos no Postgres NÃO serão afetados.');
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
        const passwordField = document.getElementById('publisherPassword');
        const password = passwordField?.value.trim() ?? '';
        if (!identifier) {
            if (loginStatus) {
                loginStatus.textContent = 'Informe seu nome de acesso.';
                loginStatus.classList.remove('success');
                loginStatus.classList.add('error');
            }
            return;
        }
        if (!password) {
            if (loginStatus) {
                loginStatus.textContent = 'Informe sua senha.';
                loginStatus.classList.remove('success');
                loginStatus.classList.add('error');
            }
            return;
        }
        try {
            await signInPublisher(identifier, password);
            loginForm.reset();
            if (loginStatus) {
                loginStatus.textContent = 'Login realizado com sucesso.';
                loginStatus.classList.remove('error');
                loginStatus.classList.add('success');
            }
        } catch (error) {
            console.error('Erro ao autenticar admin:', error);
            if (loginStatus) {
                loginStatus.textContent = error?.message ?? 'Falha ao entrar. Tente novamente.';
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
                loginMessage.textContent = 'Acesso exclusivo de Paulo Volker e Angélica Satiro. Informe nome e senha para acessar a área reservada.';
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
            connectionStatus.textContent = `Postgres conectado como ${currentPublisher.name}`;
        } else if (!currentUserId) {
            connectionStatus.textContent = 'Postgres conectado como leitor local';
        } else {
            connectionStatus.textContent = 'Postgres conectado';
        }
        connectionStatus.classList.add('success');
    }
}

function getPublisherProfile(identifier) {
    if (!identifier) return null;
    const normalized = normalizeKey(identifier);
    const key = Object.keys(PUBLISHER_ACCOUNTS).find((entryKey) => {
        const profile = PUBLISHER_ACCOUNTS[entryKey];
        return normalizeKey(profile?.identifier) === normalized
            || normalizeKey(profile?.displayName) === normalized
            || normalizeKey(entryKey) === normalized;
    });
    if (!key) return null;
    return { ...PUBLISHER_ACCOUNTS[key], key };
}

async function renderPosts() {
    const timeline = document.getElementById('postTimeline');
    const template = document.getElementById('postTemplate');
    if (!timeline || !template) return;
    if (PAGE_MODE === 'conversations' && !hasConversationAccess()) {
        return;
    }

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
        const authorKey = normalizeAuthorKey(post.author);
        const photoSrc = AUTHOR_PHOTOS[authorKey];
        if (photoSrc) {
            const img = document.createElement('img');
            img.src = photoSrc;
            img.alt = `Foto de ${post.author}`;
            avatar.appendChild(img);
            avatar.style.background = 'none';
        } else {
            const style = AUTHOR_STYLES[authorKey]?.gradient;
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
            const proceed = await ensureLoginForParticipation();
            if (!proceed) return;
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

async function renderFeaturedConversation() {
    const container = document.getElementById('featuredConversationList');
    if (!container) return;

    container.innerHTML = '';

    const featuredPosts = [
        {
            author: 'Angelica Satiro',
            text: 'Bom dia Paulo, ontem fiz uma palestra na Galícia e lembrei de você. Aquela sua questão sobre a paz dos cenários é a soma da paz de cada uma das pessoas que estão nele. Lembra disso?',
        },
        {
            author: 'Paulo Volker',
            text: 'Ei Angélica. Sim, é claro. Uma ideia que temos ainda que explorar. A "paz individual" de um entra em ressonância com a "paz individual" do outro e esse processo tende a se expandir nos ambientes. Falamos disso no "Sinapses do Vento".',
        },
    ];

    for (const post of featuredPosts) {
        const item = document.createElement('article');
        item.className = 'featured-conversation__item';

        const avatar = document.createElement('div');
        avatar.className = 'author-avatar featured-conversation__avatar';
        const authorKey = normalizeAuthorKey(post.author);
        const photoSrc = AUTHOR_PHOTOS[authorKey];
        if (photoSrc) {
            const img = document.createElement('img');
            img.src = photoSrc;
            img.alt = `Foto de ${post.author}`;
            avatar.appendChild(img);
            avatar.style.background = 'none';
        } else {
            const style = AUTHOR_STYLES[authorKey]?.gradient;
            avatar.style.background = style ?? 'linear-gradient(135deg, #6410c2, #fc3dac)';
            avatar.textContent = post.author.slice(0, 2).toUpperCase();
        }

        const content = document.createElement('div');
        content.className = 'featured-conversation__content';

        const name = document.createElement('p');
        name.className = 'featured-conversation__name';
        name.textContent = post.author === 'Angelica Satiro' ? 'Angélica' : post.author;

        const text = document.createElement('p');
        text.textContent = post.text;

        content.appendChild(name);
        content.appendChild(text);
        item.appendChild(avatar);
        item.appendChild(content);
        container.appendChild(item);
    }
}

function buildMeta(post) {
    const dateText = formatPostDate(post.createdAt);
    const rhythm = AUTHOR_RHYTHMS[normalizeAuthorKey(post.author)];
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

// Busca posts do backend com fallback para localStorage
async function getPosts() {
    try {
        if (!hasRemote()) {
            throw new Error('Backend indisponível.');
        }
        const remotePosts = await apiRequest('/api/posts');
        const merged = new Map();
        (Array.isArray(remotePosts) ? remotePosts : []).forEach((post) => {
            if (post?.id) merged.set(post.id, post);
        });
        loadPosts().forEach((post) => {
            if (post?.id) merged.set(post.id, post);
        });
        return [...merged.values()].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    } catch (err) {
        console.warn('Erro ao buscar posts no backend. Usando dados locais.', err);
        return loadPosts().sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
}

// Cria uma publicação no backend quando possível; caso contrário, salva localmente
async function createPost(post) {
    try {
        if (!hasRemote()) {
            throw new Error('Backend indisponível.');
        }
        if (adminToken) {
            await apiRequest('/api/posts', {
                method: 'POST',
                auth: true,
                body: {
                    id: post.id,
                    title: post.title,
                    content: post.content,
                    createdAt: post.createdAt,
                },
            });
            return true;
        }
        if (currentUserEmail) {
            await apiRequest('/api/community/posts', {
                method: 'POST',
                body: {
                    id: post.id,
                    name: currentUser,
                    email: currentUserEmail,
                    city: currentUserCity || '',
                    title: post.title,
                    content: post.content,
                    createdAt: post.createdAt,
                },
            });
            const posts = loadPosts().filter((entry) => entry.id !== post.id);
            posts.push(post);
            savePosts(posts);
            return true;
        }
        throw new Error('Usuário não autenticado.');
    } catch (err) {
        console.warn('Falha ao criar post no backend. Salvando localmente.', err);
    }
    const posts = loadPosts();
    posts.push(post);
    savePosts(posts);
    return true;
}

function setupConversationComposer() {
    const form = document.getElementById('communityMessageForm');
    const contentField = document.getElementById('communityMessageContent');
    const statusField = document.getElementById('communityMessageStatus');

    if (!form || !contentField) return;

    const submitConversationPost = async (message) => {
        const proceed = await ensureLoginForParticipation();
        if (!proceed) return;
        ensureReaderIdentity();

        const cleanContent = String(message || '').trim();
        if (!cleanContent) {
            if (statusField) {
                statusField.textContent = 'Escreva uma mensagem antes de publicar.';
                statusField.classList.remove('success');
                statusField.classList.add('error');
            }
            contentField.focus();
            return;
        }

        const post = {
            id: `${normalizeKey(currentUser || 'user')}-${Date.now()}`,
            author: currentUser,
            title: `Mensagem de ${currentUser}`,
            content: cleanContent.split(/\n{2,}/).map((chunk) => chunk.trim()).filter(Boolean),
            createdAt: new Date().toISOString(),
        };

        try {
            await createPost(post);
            form.reset();
            if (statusField) {
                statusField.textContent = 'Mensagem publicada na conversa.';
                statusField.classList.remove('error');
                statusField.classList.add('success');
            }
            await renderPosts();
            if (!document.querySelector(`#postTimeline [data-post-id="${post.id}"]`)) {
                prependConversationPost(post);
            }
            document.getElementById('postTimeline')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (error) {
            console.error('Falha ao publicar mensagem:', error);
            if (statusField) {
                statusField.textContent = error?.message ?? 'Falha ao publicar a mensagem.';
                statusField.classList.remove('success');
                statusField.classList.add('error');
            }
        }
    };

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        await submitConversationPost(contentField.value);
    });

    contentField.addEventListener('keydown', async (event) => {
        if (event.key !== 'Enter' || event.shiftKey) return;
        event.preventDefault();
        await submitConversationPost(contentField.value);
    });
}

function prependConversationPost(post) {
    const timeline = document.getElementById('postTimeline');
    const template = document.getElementById('postTemplate');
    if (!timeline || !template || !post?.id) return;

    const fragment = template.content.cloneNode(true);
    const article = fragment.querySelector('.post');
    article.dataset.postId = post.id;

    const avatar = article.querySelector('.author-avatar');
    avatar.innerHTML = '';
    const authorKey = normalizeAuthorKey(post.author);
    const photoSrc = AUTHOR_PHOTOS[authorKey];
    if (photoSrc) {
        const img = document.createElement('img');
        img.src = photoSrc;
        img.alt = `Foto de ${post.author}`;
        avatar.appendChild(img);
        avatar.style.background = 'none';
    }

    const title = article.querySelector('.post-title');
    title.textContent = post.title;

    const meta = article.querySelector('.post-meta');
    meta.textContent = buildMeta(post);

    const body = article.querySelector('.post-body');
    body.innerHTML = '';
    (Array.isArray(post.content) ? post.content : []).forEach((paragraph) => {
        const p = document.createElement('p');
        p.textContent = paragraph;
        body.appendChild(p);
    });

    timeline.prepend(article);
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
    try {
        if (!hasRemote()) {
            throw new Error('Backend indisponível.');
        }
        const query = new URLSearchParams({
            postIds: postIds.join(','),
            fingerprint: getLikeFingerprint() || '',
        });
        const data = await apiRequest(`/api/likes?${query.toString()}`);
        (Array.isArray(data) ? data : []).forEach(({ postId, likes, liked }) => {
            states[postId] = { count: likes ?? 0, liked: false };
            states[postId].liked = !!liked;
        });
    } catch (error) {
        console.warn('Erro ao carregar curtidas no backend. Usando dados locais.', error);
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
    const proceed = await ensureLoginForParticipation();
    if (!proceed) return;
    ensureReaderIdentity();
    const fingerprint = getLikeFingerprint();
    if (hasRemote() && fingerprint) {
        try {
            const snapshot = await apiRequest('/api/likes/toggle', {
                method: 'POST',
                body: { postId, fingerprint },
            });
            applyLikeState(button, counter, {
                count: snapshot?.likes ?? 0,
                liked: !!snapshot?.liked,
            });
            return;
        } catch (error) {
            console.warn('Erro ao sincronizar curtida com o backend. Aplicando fallback local.', error);
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
    try {
        if (!hasRemote()) {
            throw new Error('Backend indisponível.');
        }
        const data = await apiRequest(`/api/feedback?postId=${encodeURIComponent(postId)}`);
        return Array.isArray(data) ? data : [];
    } catch (err) {
        console.warn('Erro ao buscar feedback no backend. Usando dados locais.', err);
        return loadFeedback(postId);
    }
}

async function persistFeedback(postId, entry) {
    if (hasRemote()) {
        try {
            await apiRequest(`/api/posts/${encodeURIComponent(postId)}/feedback`, {
                method: 'POST',
                body: {
                    id: entry.id,
                    parentId: entry.parentId,
                    author: entry.author,
                    role: entry.role === 'author' ? 'admin' : 'user',
                    type: entry.type,
                    message: entry.message,
                    timestamp: entry.timestamp,
                },
            });
            return;
        } catch (err) {
            console.warn('Falha ao gravar feedback no backend. Salvando localmente.', err);
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

async function reportFeedback(entry, postId) {
    try {
        const key = `aa:reports:${postId}`;
        const stored = localStorage.getItem(key);
        const list = stored ? JSON.parse(stored) : [];
        list.push({ id: generateId(), feedbackId: entry.id, author: entry.author, timestamp: new Date().toISOString() });
        localStorage.setItem(key, JSON.stringify(list));
        return true;
    } catch (_) {
        return false;
    }
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

        const reportBtn = document.createElement('button');
        reportBtn.type = 'button';
        reportBtn.className = 'reply-trigger';
        reportBtn.textContent = 'Reportar';
        reportBtn.addEventListener('click', async () => {
            await reportFeedback(entry, post.id);
            reportBtn.disabled = true;
        });

        item.append(heading, message, time, reportBtn);

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
        if (!currentUserId) {
            return;
        }
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
    target.innerHTML = '';
    const container = document.createElement('div');
    const name = currentPublisher?.name || currentUser || '';
    if (name) {
        const span = document.createElement('span');
        span.textContent = typeof name === 'string' ? name : '';
        container.appendChild(span);
    }
    const loginBtn = document.createElement('button');
    loginBtn.type = 'button';
    loginBtn.style.marginLeft = '0.6rem';
    loginBtn.className = 'admin-entry';
    loginBtn.textContent = currentPublisher ? 'Sair' : 'Entrar';
    loginBtn.addEventListener('click', async () => {
        if (currentPublisher) {
            await signOutPublisher();
            updateUserInfo();
        } else {
            await ensureLoginForParticipation();
            updateUserInfo();
        }
    });
    container.appendChild(loginBtn);
    target.appendChild(container);
}

function ensureReaderIdentity() {
    if (currentUserId && currentUser) return currentUser;
    const stored = loadReaderProfile();
    if (stored?.id && stored?.name) {
        currentUserId = stored.id;
        currentUser = stored.name;
        currentUserEmail = stored.email || null;
        currentUserCity = stored.city || null;
        return currentUser;
    }
    try {
        const rnd = Math.random().toString(36).slice(2, 6);
        currentUser = `Visitante-${rnd}`;
        currentUserId = `local-${rnd}`;
        saveReaderProfile({
            id: currentUserId,
            name: currentUser,
            email: '',
            city: '',
            local: true,
        });
        return currentUser;
    } catch (_) {
        currentUser = 'Visitante';
        currentUserId = `local-${Date.now()}`;
        return currentUser;
    }
}

function hasConversationAccess() {
    const stored = loadReaderProfile();
    return !!stored?.email;
}

function setupConversationPageGate() {
    const overlay = document.getElementById('conversationAccessOverlay');
    const button = document.getElementById('conversationAccessButton');
    const message = document.getElementById('conversationAccessMessage');
    if (!overlay || !button) return;

    const syncState = () => {
        const allowed = hasConversationAccess();
        overlay.classList.toggle('visible', !allowed);
        document.body.classList.toggle('conversation-locked', !allowed);
        if (message) {
            message.textContent = allowed
                ? 'Você já está inscrito e pode entrar na conversa completa.'
                : 'Inscreva-se para entrar na conversa completa entre Angélica, Paulo e a comunidade.';
        }
    };

    button.addEventListener('click', unlockConversationPage);
    syncState();
}

async function unlockConversationPage() {
    const ok = await ensureLoginForParticipation();
    if (!ok) return false;
    const overlay = document.getElementById('conversationAccessOverlay');
    if (overlay) {
        overlay.classList.remove('visible');
    }
    document.body.classList.remove('conversation-locked');
    ensureReaderIdentity();
    await renderPosts();
    updateUserInfo();
    return true;
}

async function ensureLoginForParticipation() {
    try {
        if (currentUserId && currentUserEmail) {
            saveReaderProfile({
                id: currentUserId,
                name: currentUser,
                email: currentUserEmail,
                city: currentUserCity,
            });
            return true;
        }

        const name = (prompt('Informe seu nome completo') || '').trim();
        if (!name) return false;
        const email = (prompt('Informe seu e-mail') || '').trim().toLowerCase();
        if (!email) return false;
        const city = (prompt('Informe sua cidade') || '').trim();
        if (!city) return false;

        const payload = { name, email, city };
        if (hasRemote()) {
            const user = await apiRequest('/api/users', {
                method: 'POST',
                body: payload,
            });
            currentUserId = String(user?.id || email);
            currentUser = user?.name || name;
            currentUserEmail = user?.email || email;
            currentUserCity = user?.city || city;
            saveReaderProfile({
                id: currentUserId,
                name: currentUser,
                email: currentUserEmail,
                city: currentUserCity,
            });
            return true;
        }

        currentUserId = `local-${normalizeKey(email) || Date.now()}`;
        currentUser = name;
        currentUserEmail = email;
        currentUserCity = city;
        saveReaderProfile({
            id: currentUserId,
            name: currentUser,
            email: currentUserEmail,
            city: currentUserCity,
            local: true,
        });
        return true;
    } catch (err) {
        console.warn('Falha ao registrar usuário.', err);
        return false;
    }
}

async function signInPublisher(identifier, password) {
    const rawIdentifier = String(identifier || '').trim();
    const rawPassword = String(password || '').trim();
    if (!rawIdentifier || !rawPassword) {
        throw new Error('Informe nome e senha.');
    }
    const tokenPayload = await apiRequest('/api/auth/admin/login', {
        method: 'POST',
        body: {
            identifier: rawIdentifier,
            password: rawPassword,
        },
    });
    adminToken = tokenPayload?.token || null;
    currentPublisher = {
        name: tokenPayload?.admin?.name || rawIdentifier,
        login: tokenPayload?.admin?.login || normalizeKey(rawIdentifier),
        token: adminToken,
    };
    saveAdminProfile(currentPublisher, adminToken);
    return true;
}

async function signOutPublisher() {
    clearAdminProfile();
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
            displayName: data.displayName || data.name || capitalize(wordLower(key)),
            identifier: data.identifier || data.login || data.displayName || data.name || capitalize(wordLower(key)),
        };
    });
    if (!overrides || typeof overrides !== 'object') {
        return normalizedDefaults;
    }
    Object.entries(overrides).forEach(([key, data]) => {
        if (!data) return;
        const upper = key.toUpperCase();
        normalizedDefaults[upper] = {
            displayName: data.displayName || data.name || normalizedDefaults[upper]?.displayName || capitalize(wordLower(key)),
            identifier: data.identifier || data.login || normalizedDefaults[upper]?.identifier || data.displayName || data.name || capitalize(wordLower(key)),
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
