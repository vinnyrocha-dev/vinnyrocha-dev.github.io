/* =========================================================
   vini.dev | script.js
   1. Configurações
   2. Tema claro/escuro (salvo no localStorage)
   3. Menu mobile (hambúrguer)
   4. Links do WhatsApp
   5. Números do GitHub (repositórios e seguidores)
   6. Projetos (API do GitHub + lista fixa de reserva)
   7. Reveal ao rolar (IntersectionObserver)
   ========================================================= */

/* ---------- 1. Configurações: edite aqui ---------- */
const CONFIG = {
  githubUser: 'vinnyrocha-dev',
  whatsapp: '5521984541845', // 55 (Brasil) + DDD + número, só dígitos
  whatsappMsg: 'Olá, Vinicius! Vi seu portfólio e gostaria de conversar.',

  // Só estes repositórios aparecem na seção Projetos.
  // Para adicionar um projeto novo, inclua o nome dele aqui E na lista fixa abaixo.
  projetosDestaque: ['cadastro-clientes-dao-java', 'estudos-java'],

  // Lista fixa: usada se a API do GitHub falhar ou estourar o limite.
  projetosReserva: [
    {
      name: 'cadastro-clientes-dao-java',
      description: 'CRUD de clientes em Java com padrão DAO e separação em camadas (domain, dao e interface).',
      language: 'Java',
      html_url: 'https://github.com/vinnyrocha-dev/cadastro-clientes-dao-java'
    },
    {
      name: 'estudos-java',
      description: 'Estudos de Java organizados por conceito: POO, classes abstratas, interfaces, herança, agregação e composição.',
      language: 'Java',
      html_url: 'https://github.com/vinnyrocha-dev/estudos-java'
    }
  ]
};

// Cores das linguagens (mesmas do GitHub)
const LANG_COLORS = {
  Java: '#b07219', JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5',
  HTML: '#e34c26', CSS: '#663399', SQL: '#e38c00', Shell: '#89e051'
};

const API = 'https://api.github.com';
const CACHE_MIN = 30; // guarda as respostas por 30 min para não estourar o limite da API

/* ---------- Utilitários ---------- */

// localStorage pode falhar (modo privado etc.), então sempre com try/catch
const storage = {
  get(key) { try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; } },
  set(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* ignora */ } }
};

// Busca JSON com cache simples
async function fetchJSON(url) {
  const key = 'cache:' + url;
  const cached = storage.get(key);
  if (cached && Date.now() - cached.t < CACHE_MIN * 60 * 1000) return cached.data;

  const res = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } });
  if (!res.ok) throw new Error('GitHub API: ' + res.status);
  const data = await res.json();
  storage.set(key, { t: Date.now(), data });
  return data;
}

// Evita injeção de HTML ao montar os cards
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

/* ---------- 2. Tema claro/escuro ---------- */
(function tema() {
  const root = document.documentElement;
  const btn = document.getElementById('btn-tema');
  const meta = document.querySelector('meta[name="theme-color"]');

  function aplicar(t) {
    root.setAttribute('data-theme', t);
    btn.setAttribute('aria-label', t === 'dark' ? 'Alternar para tema claro' : 'Alternar para tema escuro');
    if (meta) meta.setAttribute('content', t === 'dark' ? '#0A0B10' : '#F7F8FA');
  }

  aplicar(root.getAttribute('data-theme') || 'dark');

  btn.addEventListener('click', () => {
    const novo = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    aplicar(novo);
    try { localStorage.setItem('tema', novo); } catch (e) { /* ignora */ }
  });
})();

/* ---------- 3. Menu mobile ---------- */
(function menu() {
  const btn = document.getElementById('btn-menu');
  const lista = document.getElementById('menu');

  function fechar() {
    lista.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Abrir menu');
  }

  btn.addEventListener('click', () => {
    const aberto = lista.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(aberto));
    btn.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
  });

  // Fecha ao clicar em um link ou apertar Esc
  lista.querySelectorAll('a').forEach(a => a.addEventListener('click', fechar));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') fechar(); });
})();

/* ---------- 4. Links do WhatsApp (botão do hero e botão flutuante) ---------- */
(function whatsapp() {
  const url = 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(CONFIG.whatsappMsg);
  document.querySelectorAll('.js-whatsapp').forEach(a => { a.href = url; });
})();

/* ---------- 5. Números do GitHub ---------- */
(async function stats() {
  const elRepos = document.getElementById('stat-repos');
  const elSeg = document.getElementById('stat-followers');
  try {
    const user = await fetchJSON(`${API}/users/${CONFIG.githubUser}`);
    elRepos.textContent = user.public_repos;
    elSeg.textContent = user.followers;
    document.querySelectorAll('[data-live]').forEach(b => { b.hidden = false; });
  } catch (e) {
    // Se a API falhar, mostra "n/d" (não disponível) em vez de inventar número
    elRepos.textContent = 'n/d';
    elSeg.textContent = 'n/d';
  }
})();

/* ---------- 6. Projetos ---------- */
(async function projetos() {
  const lista = document.getElementById('lista-projetos');
  const filtros = document.getElementById('filtros');
  let repos;

  try {
    // Busca só os repositórios em destaque, em paralelo
    repos = await Promise.all(
      CONFIG.projetosDestaque.map(nome => fetchJSON(`${API}/repos/${CONFIG.githubUser}/${nome}`))
    );
    // Se a API não detectar a linguagem, usa a da lista fixa
    repos = repos.map(r => {
      const reserva = CONFIG.projetosReserva.find(p => p.name === r.name) || {};
      return {
        name: r.name,
        description: r.description || reserva.description || 'Sem descrição.',
        language: r.language || reserva.language || 'Outros',
        html_url: r.html_url
      };
    });
  } catch (e) {
    repos = CONFIG.projetosReserva; // API falhou: usa a lista escrita no código
  }

  // Monta os cards
  lista.innerHTML = repos.map(r => `
    <article class="card project reveal" data-lang="${escapeHTML(r.language)}">
      <h3>${escapeHTML(r.name)}</h3>
      <p>${escapeHTML(r.description)}</p>
      <div class="project-meta">
        <span class="lang" style="--lang-color:${LANG_COLORS[r.language] || 'var(--accent)'}">${escapeHTML(r.language)}</span>
        <a class="project-link" href="${escapeHTML(r.html_url)}" target="_blank" rel="noopener"
           aria-label="Ver ${escapeHTML(r.name)} no GitHub">Ver no GitHub →</a>
      </div>
    </article>`).join('');

  // Gera o filtro automaticamente a partir das linguagens encontradas
  const linguagens = ['Todos', ...new Set(repos.map(r => r.language))];
  filtros.innerHTML = linguagens.map((l, i) =>
    `<button type="button" class="filter-btn" data-filter="${escapeHTML(l)}" aria-pressed="${i === 0}">${escapeHTML(l)}</button>`
  ).join('');

  filtros.addEventListener('click', e => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    const alvo = btn.dataset.filter;
    filtros.querySelectorAll('.filter-btn').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
    lista.querySelectorAll('.project').forEach(card => {
      card.hidden = alvo !== 'Todos' && card.dataset.lang !== alvo;
    });
  });

  observarReveal(lista.querySelectorAll('.reveal'));
})();

/* ---------- 7. Reveal ao rolar ---------- */
const reduzMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const observer = ('IntersectionObserver' in window && !reduzMovimento)
  ? new IntersectionObserver((entradas) => {
      entradas.forEach(entrada => {
        if (!entrada.isIntersecting) return;
        entrada.target.classList.add('visible');
        observer.unobserve(entrada.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })
  : null;

function observarReveal(elementos) {
  elementos.forEach(el => {
    // Delay escalonado: cada irmão com .reveal entra 80ms depois do anterior
    const irmaos = Array.from(el.parentElement.children).filter(c => c.classList.contains('reveal'));
    el.style.setProperty('--delay', (Math.min(irmaos.indexOf(el), 6) * 0.08) + 's');

    if (observer) observer.observe(el);
    else el.classList.add('visible'); // sem suporte ou com movimento reduzido: mostra direto
  });
}

observarReveal(document.querySelectorAll('.reveal'));
