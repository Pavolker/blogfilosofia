class SidebarManager {
  constructor() {
    this.sidebar = document.getElementById('sidebar');
    this.overlay = document.getElementById('sidebarOverlay');
    this.toggle = document.getElementById('sidebarToggle');
    this.closeButton = document.getElementById('sidebarClose');
    this.links = document.querySelectorAll('.sidebar__link');
    this.main = document.querySelector('main');
    this.homeContent = this.main?.innerHTML || '';
    this.currentSection = null;
    this.init();
  }

  init() {
    this.toggle?.addEventListener('click', () => this.open());
    this.closeButton?.addEventListener('click', () => this.closeSidebar());
    this.overlay?.addEventListener('click', () => this.closeSidebar());

    this.links.forEach(link => {
      link.addEventListener('click', (event) => {
        const href = link.getAttribute('href');
        const section = link.dataset.section;

        if (href && href !== '#' && !section) {
          this.closeSidebar();
          return;
        }

        event.preventDefault();
        this.switchSection(section);
        this.closeSidebar();
      });
    });

    document.querySelectorAll('.lang-btn').forEach(button => {
      button.addEventListener('click', () => {
        setTimeout(() => {
          this.updateMenuLabels();
          if (this.currentSection) this.renderSection(this.currentSection);
        }, 0);
      });
    });

    document.addEventListener('click', (event) => {
      const homeLink = event.target.closest('[data-home-target]');
      const hashLink = event.target.closest('.topbar__nav a[href^="#"]');

      if (this.currentSection && (homeLink || hashLink)) {
        event.preventDefault();
        const target = homeLink?.dataset.homeTarget || hashLink.getAttribute('href').slice(1);
        this.showHome(target);
      }

      if (window.innerWidth < 1024) {
        if (!this.sidebar?.contains(event.target) && !this.toggle?.contains(event.target) && this.sidebar?.classList.contains('active')) {
          this.closeSidebar();
        }
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth >= 1024) this.closeSidebar();
    });

    this.updateMenuLabels();
  }

  getLang() {
    const htmlLang = document.documentElement.lang || '';
    if (htmlLang.startsWith('es')) return 'es';
    return localStorage.getItem('sdv:lang') === 'es' ? 'es' : 'pt';
  }

  open() {
    this.sidebar?.classList.add('active');
    this.overlay?.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  closeSidebar() {
    this.sidebar?.classList.remove('active');
    this.overlay?.classList.remove('active');
    document.body.style.overflow = '';
  }

  updateMenuLabels() {
    const lang = this.getLang();
    const labels = {
      pt: {
        angelica: 'Página da Angélica',
        paulo: 'Página do Paulo',
        palestras: 'Palestras',
        cursos: 'Cursos',
        workshops: 'Workshops',
        apps: 'Aplicativos',
      },
      es: {
        angelica: 'Página de Angélica',
        paulo: 'Página de Paulo',
        palestras: 'Conferencias',
        cursos: 'Cursos',
        workshops: 'Talleres',
        apps: 'Aplicaciones',
      },
    };

    const activeLabels = labels[lang];
    const angelicaLink = this.sidebar?.querySelector('a[href="https://angelicasatiro.com"] .sidebar__text');
    const pauloLink = this.sidebar?.querySelector('a[href="https://texto-dual.netlify.app/#/"] .sidebar__text');
    if (angelicaLink) angelicaLink.textContent = activeLabels.angelica;
    if (pauloLink) pauloLink.textContent = activeLabels.paulo;

    Object.entries(activeLabels).forEach(([section, text]) => {
      const item = this.sidebar?.querySelector(`[data-section="${section}"] .sidebar__text`);
      if (item) item.textContent = text;
    });
  }

  showHome(target) {
    if (!this.main) return;
    this.main.innerHTML = this.homeContent;
    this.currentSection = null;
    this.links.forEach(link => link.classList.remove('active'));
    const hash = target ? `#${target}` : '';
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${hash}`);
    if (typeof initReveal === 'function') initReveal();
    window.requestAnimationFrame(() => {
      document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  switchSection(section) {
    this.links.forEach(link => link.classList.remove('active'));
    const activeLink = document.querySelector(`[data-section="${section}"]`);
    activeLink?.classList.add('active');
    this.currentSection = section;
    this.renderSection(section);
  }

  renderSection(section) {
    if (!this.main) return;
    this.main.innerHTML = this.getSectionContent(section);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  card(item, index) {
    return `
      <article class="panel ${index % 2 === 0 ? 'panel--light' : 'panel--accent'}">
        <p class="panel__eyebrow">${item.axis}</p>
        <h2 class="panel__title">${item.title}</h2>
        <p class="panel__text">${item.text}</p>
      </article>
    `;
  }

  page(title, subtitle, items, cta) {
    const backLabel = this.getLang() === 'es' ? 'Volver a la página principal' : 'Voltar para a página inicial';
    return `
      <div class="section active">
        <div class="section__header">
          <h1 class="section__title">${title}</h1>
          <p class="section__subtitle">${subtitle}</p>
        </div>
        <div class="section__content">
          <section class="content-grid">
            ${items.map((item, index) => this.card(item, index)).join('')}
          </section>
          <div class="cta-section">
            <a href="index.html#comprar" class="btn btn--primary" data-home-target="comprar">${cta}</a>
            <a href="index.html" class="btn btn--ghost back-btn" data-home-target="hero">${backLabel}</a>
          </div>
        </div>
      </div>
    `;
  }

  getSectionContent(section) {
    const lang = this.getLang();
    const content = {
      pt: {
        cta: 'Adquirir o livro',
        missingTitle: 'Seção não encontrada',
        missingText: 'Desculpe, não conseguimos encontrar o conteúdo que você procura.',
        sections: {
          palestras: {
            title: 'Palestras',
            subtitle: 'Três conferências para transformar os grandes temas de Sinapses do Vento em experiências públicas de pensamento.',
            items: [
              { axis: 'EIXO 1 — O ENCONTRO', title: 'A Filosofia do Encontro', text: 'Como os encontros moldam quem somos. Acaso, alteridade, vínculos, amizade intelectual, amor e memória como forças de transformação.' },
              { axis: 'EIXO 2 — CONVERSAS SEM RUMO', title: 'A Inteligência das Conversas Inúteis', text: 'Como grandes ideias nascem de diálogos livres, sem objetivo imediato, sem conclusão obrigatória e sem utilidade aparente.' },
              { axis: 'EIXO 5 — CONHECIMENTO E MEDICINA', title: 'Quando a Medicina Encontra a Filosofia', text: 'Uma reflexão atual sobre diagnóstico, cuidado, linguagem médica, escuta e o lugar do paciente como sujeito da própria travessia.' },
            ],
          },
          cursos: {
            title: 'Cursos',
            subtitle: 'Percursos formativos derivados do livro para aprofundar diálogo, cuidado, escrita, medicina, arte e finitude.',
            items: [
              { axis: 'EIXO 2 — CONVERSAS SEM RUMO', title: 'A Arte do Diálogo Filosófico', text: 'Escuta, perguntas, silêncio e construção conjunta como fundamentos de uma prática filosófica viva.' },
              { axis: 'EIXO 3 — CUIDADO DE SI', title: 'O Cuidado de Si no Século XXI', text: 'Sócrates, estoicos, Foucault, escrita, rotinas e tempo como módulos de um curso sobre práticas pessoais de atenção e presença.' },
            ],
          },
          workshops: {
            title: 'Workshops',
            subtitle: 'Experiências práticas para transformar conceitos do livro em investigação filosófica compartilhada.',
            items: [
              { axis: 'EIXO 1 — O ENCONTRO', title: 'Cartografia dos Encontros', text: 'O participante desenha os encontros que mudaram sua vida. Não é terapia. É investigação filosófica.' },
            ],
          },
          apps: {
            title: 'Aplicativos',
            subtitle: 'Uma coleção de ferramentas digitais inspiradas nos eixos de Sinapses do Vento.',
            items: [
              { axis: 'EIXO 1 — O ENCONTRO', title: 'Mapa dos Encontros', text: 'Linha do tempo com pessoas, lugares, livros e acontecimentos que produziram mudanças existenciais.' },
              { axis: 'EIXO 2 — CONVERSAS SEM RUMO', title: 'Agente de Conversa Filosófica', text: 'Uma IA cuja única função é conversar: sem resolver problemas, sem aconselhar, apenas manter vivo o pensamento.' },
              { axis: 'EIXO 3 — CUIDADO DE SI', title: 'Diário Filosófico', text: 'Registro de pensamentos, perguntas e leituras, com identificação de padrões pela IA.' },
              { axis: 'EIXO 4 — ESCRITA COMO TECNOLOGIA DA ALMA', title: 'Diário Sináptico', text: 'Cada anotação gera conexões, temas recorrentes e questões abertas.' },
            ],
          },
        },
      },
      es: {
        cta: 'Adquirir el libro',
        missingTitle: 'Sección no encontrada',
        missingText: 'No hemos podido encontrar el contenido que buscas.',
        sections: {
          palestras: {
            title: 'Conferencias',
            subtitle: 'Tres conferencias para transformar los grandes temas de Sinapsis del Viento en experiencias públicas de pensamiento.',
            items: [
              { axis: 'EJE 1 — EL ENCUENTRO', title: 'La Filosofía del Encuentro', text: 'Cómo los encuentros moldean quiénes somos. Azar, alteridad, vínculos, amistad intelectual, amor y memoria como fuerzas de transformación.' },
              { axis: 'EJE 2 — CONVERSACIONES SIN RUMBO', title: 'La Inteligencia de las Conversaciones Inútiles', text: 'Cómo las grandes ideas nacen de diálogos libres, sin objetivo inmediato, sin conclusión obligatoria y sin utilidad aparente.' },
              { axis: 'EJE 5 — CONOCIMIENTO Y MEDICINA', title: 'Cuando la Medicina Encuentra la Filosofía', text: 'Una reflexión actual sobre diagnóstico, cuidado, lenguaje médico, escucha y el lugar del paciente como sujeto de su propia travesía.' },
            ],
          },
          cursos: {
            title: 'Cursos',
            subtitle: 'Recorridos formativos derivados del libro para profundizar diálogo, cuidado, escritura, medicina, arte y finitud.',
            items: [
              { axis: 'EJE 2 — CONVERSACIONES SIN RUMBO', title: 'El Arte del Diálogo Filosófico', text: 'Escucha, preguntas, silencio y construcción conjunta como fundamentos de una práctica filosófica viva.' },
              { axis: 'EJE 3 — CUIDADO DE SÍ', title: 'El Cuidado de Sí en el Siglo XXI', text: 'Sócrates, estoicos, Foucault, escritura, rutinas y tiempo como módulos de un curso sobre prácticas personales de atención y presencia.' },
            ],
          },
          workshops: {
            title: 'Talleres',
            subtitle: 'Experiencias prácticas para transformar conceptos del libro en investigación filosófica compartida.',
            items: [
              { axis: 'EJE 1 — EL ENCUENTRO', title: 'Cartografía de los Encuentros', text: 'El participante dibuja los encuentros que cambiaron su vida. No es terapia. Es investigación filosófica.' },
            ],
          },
          apps: {
            title: 'Aplicaciones',
            subtitle: 'Una colección de herramientas digitales inspiradas en los ejes de Sinapsis del Viento.',
            items: [
              { axis: 'EJE 1 — EL ENCUENTRO', title: 'Mapa de los Encuentros', text: 'Línea de tiempo con personas, lugares, libros y acontecimientos que produjeron cambios existenciales.' },
              { axis: 'EJE 2 — CONVERSACIONES SIN RUMBO', title: 'Agente de Conversación Filosófica', text: 'Una IA cuya única función es conversar: sin resolver problemas, sin aconsejar, solo mantener vivo el pensamiento.' },
              { axis: 'EJE 3 — CUIDADO DE SÍ', title: 'Diario Filosófico', text: 'Registro de pensamientos, preguntas y lecturas, con identificación de patrones por IA.' },
              { axis: 'EJE 4 — ESCRITURA COMO TECNOLOGÍA DEL ALMA', title: 'Diario Sináptico', text: 'Cada anotación genera conexiones, temas recurrentes y preguntas abiertas.' },
            ],
          },
        },
      },
    };

    const active = content[lang];
    const sectionData = active.sections[section];

    if (!sectionData) {
      return `
        <div class="section__placeholder">
          <span class="section__placeholder-icon">❌</span>
          <h3 class="section__placeholder-title">${active.missingTitle}</h3>
          <p class="section__placeholder-text">${active.missingText}</p>
        </div>
      `;
    }

    return this.page(sectionData.title, sectionData.subtitle, sectionData.items, active.cta);
  }
}

window.SidebarManager = SidebarManager;

document.addEventListener('DOMContentLoaded', () => {
  window.sidebarManager = new SidebarManager();
});
