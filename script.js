const LANG_KEY = 'sdv:lang';

const LANG = {
  pt: {
    'site.title': 'Sinapses do Vento — O Livro',
    'nav.book': 'O livro',
    'nav.authors': 'Autores',
    'nav.buy': 'Adquirir',
    'hero.kicker': 'UMA OBRA LITERÁRIO-FILOSÓFICA',
    'hero.subtitle': 'Uma abordagem dialógica para a finitude',
    'hero.desc': 'Dois amigos sustentam 153 dias de diálogo entre Brasil e Espanha, atravessando doença, amizade, vulnerabilidade, criatividade e pensamento. O resultado é uma peça íntima, reflexiva e profundamente humana.',
    'hero.cta_read': 'Quero ler',
    'hero.cta_know': 'Conhecer',
    'hero.stat_days': 'dias de diálogo',
    'hero.stat_voices': 'vozes em conversa',
    'hero.stat_exp': 'experiência compartilhada',
    'synopsis.eyebrow': 'SINOPSE',
    'synopsis.title': 'Um livro que transforma uma conversa urgente em reflexão filosófica.',
    'synopsis.text': 'A obra nasce no ponto mais delicado: um diagnóstico de sarcoma e o itinerário de cirurgias, cuidado, espera e transformação. Desde aí, a escrita recolhe o cotidiano e o converte em pensamento vivo.',
    'content.find_eyebrow': 'O QUE VOCÊ VAI ENCONTRAR',
    'content.find_title': 'Diálogo, corpo, amizade e finitude',
    'content.find_text': 'O livro transita por perguntas sobre amor, alteridade, arte, silêncio, vulnerabilidade, inteligência, dor, sentido e reflexão. Não explica a vida de fora: a pensa enquanto acontece.',
    'content.tone_eyebrow': 'TOM',
    'content.tone_title': 'Íntimo, sóbrio e radicalmente humano',
    'content.tone_text': 'A linguagem mescla a proximidade das mensagens digitais com a densidade de um ensaio poético-filosófico. A forma conserva a espontaneidade do WhatsApp, mas com uma profundidade que toca a sensibilidade do leitor.',
    'quote.text': '"Frente a uma doença grave, a pessoa deve ser o sujeito de sua cura e sua sanidade, em situação de diálogo com quem sabe acompanhar essa crise."',
    'quote.source': '— Ideia central do livro',
    'techsheet.eyebrow': 'FICHA TÉCNICA',
    'techsheet.title': 'Uma obra escrita a duas vozes',
    'techsheet.authors_label': 'Autores:',
    'techsheet.authors': 'Angélica Sátiro e Paulo Volker',
    'techsheet.lang_label': 'Idioma:',
    'techsheet.lang_value': 'Português',
    'techsheet.publisher_label': 'Editora:',
    'techsheet.location_label': 'Local:',
    'techsheet.location_value': 'Brasília — Barcelona',
    'techsheet.year_label': 'Ano:',
    'techsheet.pages_label': 'Páginas:',
    'techsheet.format_label': 'Formato:',
    'techsheet.format_value': 'Livro de diálogos, reflexão e memória',
    'techsheet.themes_label': 'Temas:',
    'techsheet.themes_value': 'Filosofia, amizade, corpo, arte, medicina e finitude',
    'authors.angelica': 'Escritora, educadora, consultora e artista collage. Seu trabalho conecta pedagogia ousada, cidadania criativa e filosofia lúdica.',
    'authors.paulo': 'Filósofo, escritor e consultor em estratégias do conhecimento. Sua voz articula pensamento, análise e sensibilidade para o detalhe humano.',
    'cta.eyebrow': 'ADQUIRA O LIVRO',
    'cta.title': 'Leve esta conversa com você',
    'cta.desc': 'Disponível em formato digital. Clique abaixo para garantir o seu exemplar.',
    'cta.btn': 'Comprar o ebook',
    'footer.publisher': 'Editora MDH',
  },
  es: {
    'site.title': 'Sinapsis del Viento — El Libro',
    'nav.book': 'El libro',
    'nav.authors': 'Autores',
    'nav.buy': 'Adquirir',
    'hero.kicker': 'UNA OBRA LITERARIO-FILOSÓFICA',
    'hero.subtitle': 'Un abordaje dialógico para la finitud',
    'hero.desc': 'Dos amigos sostienen 153 días de diálogo entre Brasil y España, atravesando enfermedad, amistad, vulnerabilidad, creatividad y pensamiento. El resultado es una pieza íntima, reflexiva y profundamente humana.',
    'hero.cta_read': 'Quiero leerlo',
    'hero.cta_know': 'Conocer',
    'hero.stat_days': 'días de diálogo',
    'hero.stat_voices': 'voces en conversación',
    'hero.stat_exp': 'experiencia compartida',
    'synopsis.eyebrow': 'SINOPSIS',
    'synopsis.title': 'Un libro que convierte una conversación urgente en reflexión filosófica.',
    'synopsis.text': 'La obra nace en el punto más delicado: un diagnóstico de sarcoma y el itinerario de cirugías, cuidado, espera y transformación. Desde ahí, la escritura recoge lo cotidiano y lo convierte en pensamiento vivo.',
    'content.find_eyebrow': 'LO QUE ENCONTRARÁS',
    'content.find_title': 'Diálogo, cuerpo, amistad y finitud',
    'content.find_text': 'El libro transita por preguntas sobre amor, alteridad, arte, silencio, vulnerabilidad, inteligencia, dolor, sentido y reflexión. No explica la vida desde afuera: la piensa mientras ocurre.',
    'content.tone_eyebrow': 'TONO',
    'content.tone_title': 'Íntimo, sobrio y radicalmente humano',
    'content.tone_text': 'El lenguaje mezcla la cercanía de los mensajes digitales con la densidad de un ensayo poético-filosófico. La forma conserva la espontaneidad de WhatsApp, pero con una profundidad que toca la sensibilidad del lector.',
    'quote.text': '"Frente a una enfermedad grave, la persona debe ser el sujeto de su cura y sanación, en situación de diálogo con quien sabe acompañar esta crisis."',
    'quote.source': '— Idea central del libro',
    'techsheet.eyebrow': 'FICHA TÉCNICA',
    'techsheet.title': 'Una obra escrita a dos voces',
    'techsheet.authors_label': 'Autores:',
    'techsheet.authors': 'Angélica Sátiro y Paulo Volker',
    'techsheet.lang_label': 'Idioma:',
    'techsheet.lang_value': 'Español',
    'techsheet.publisher_label': 'Editorial:',
    'techsheet.location_label': 'Lugar:',
    'techsheet.location_value': 'Brasilia — Barcelona',
    'techsheet.year_label': 'Año:',
    'techsheet.pages_label': 'Páginas:',
    'techsheet.format_label': 'Formato:',
    'techsheet.format_value': 'Libro de diálogos, reflexión y memoria',
    'techsheet.themes_label': 'Temas:',
    'techsheet.themes_value': 'Filosofía, amistad, cuerpo, arte, medicina y finitud',
    'authors.angelica': 'Escritora, educadora, consultora y artista collage. Su trabajo conecta pedagogía atrevida, ciudadanía creativa y filosofía lúdica.',
    'authors.paulo': 'Filósofo, escritor y consultor en estrategias del conocimiento. Su voz articula pensamiento, análisis y sensibilidad para el detalle humano.',
    'cta.eyebrow': 'ADQUIERE EL LIBRO',
    'cta.title': 'Lleva esta conversación contigo',
    'cta.desc': 'Disponible en formato digital. Haz clic abajo para garantizar tu ejemplar.',
    'cta.btn': 'Comprar el ebook',
    'footer.publisher': 'Editorial MDH',
  }
};

let currentLang = 'pt';

function t(key) {
  return LANG[currentLang]?.[key] ?? LANG.pt?.[key] ?? key;
}

function applyLang() {
  document.documentElement.lang = currentLang === 'pt' ? 'pt-BR' : 'es';
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
    element.placeholder = t(element.dataset.i18nPlaceholder);
  });
  document.querySelectorAll('.lang-btn').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.lang === currentLang);
  });
  localStorage.setItem(LANG_KEY, currentLang);
}

function initLang() {
  const stored = localStorage.getItem(LANG_KEY);
  if (stored === 'pt' || stored === 'es') currentLang = stored;
  applyLang();
  document.querySelectorAll('.lang-btn').forEach((button) => {
    button.addEventListener('click', () => {
      currentLang = button.dataset.lang;
      applyLang();
    });
  });
}

function initNavToggle() {
  const toggle = document.getElementById('navToggle');
  const nav = document.querySelector('.topbar__nav');
  if (!toggle || !nav) return;
  toggle.addEventListener('click', () => {
    nav.classList.toggle('is-open');
  });
}

function initReveal() {
  const elements = document.querySelectorAll('.reveal');
  if (elements.length === 0) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  elements.forEach((element) => observer.observe(element));
}

document.addEventListener('DOMContentLoaded', () => {
  initLang();
  initReveal();
  initNavToggle();
});
