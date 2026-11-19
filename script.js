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

/* ---------- 5. Números do GitHub (seção Sobre + painel de estatísticas) ---------- */
(async function stats() {
  // Uma única chamada à API alimenta os dois lugares que mostram números
  const sobreRepos = document.getElementById('stat-repos');
  const sobreSeg = document.getElementById('stat-followers');
  const campos = document.querySelectorAll('[data-gh]'); // ex.: data-gh="followers"

  try {
    const user = await fetchJSON(`${API}/users/${CONFIG.githubUser}`);
    sobreRepos.textContent = user.public_repos;
    sobreSeg.textContent = user.followers;
    // Cada elemento diz qual campo da API ele quer ler
    campos.forEach(el => { el.textContent = user[el.dataset.gh] ?? '-'; });
    document.querySelectorAll('[data-live]').forEach(b => { b.hidden = false; });
  } catch (e) {
    // Se a API falhar, mostra "-" em vez de inventar número ou quebrar a página
    sobreRepos.textContent = '-';
    sobreSeg.textContent = '-';
    campos.forEach(el => { el.textContent = '-'; });
  }
})();

// As imagens do github-readme-stats vêm de um serviço externo.
// Se ele estiver fora do ar, a imagem quebrada é escondida.
document.querySelectorAll('.gh-card-img').forEach(img => {
  // Caso a imagem já tenha falhado antes deste script rodar
  if (img.complete && img.naturalWidth === 0) img.hidden = true;
  img.addEventListener('error', () => { img.hidden = true; });
});

/* ---------- 6. Projetos ---------- */
(async function projetos() {
  const grid = document.getElementById('projectGrid');
  const barra = document.getElementById('filterBar');
  let repos;

  // 6.1 Busca os dados: API primeiro, lista fixa se der erro
  try {
    repos = await Promise.all(
      CONFIG.projetosDestaque.map(nome => fetchJSON(`${API}/repos/${CONFIG.githubUser}/${nome}`))
    );
    // Se a API não trouxer descrição ou linguagem, completa com a lista fixa
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
    repos = CONFIG.projetosReserva;
  }

  // 6.2 Monta um card para cada repositório
  grid.innerHTML = repos.map(r => `
    <article class="project-card reveal" data-lang="${escapeHTML(r.language)}">
      <div class="project-top">
        <h3>${escapeHTML(r.name)}</h3>
        <span class="lang-tag">${escapeHTML(r.language)}</span>
      </div>
      <p>${escapeHTML(r.description)}</p>
      <a class="project-link" href="${escapeHTML(r.html_url)}" target="_blank" rel="noopener"
         aria-label="Ver ${escapeHTML(r.name)} no GitHub (abre em nova aba)">Ver no GitHub ↗</a>
    </article>`).join('');

  // 6.3 Cria os botões de filtro só com as linguagens que existem nos projetos.
  // Assim nunca aparece um filtro que deixa a tela vazia.
  const linguagens = ['Todos', ...new Set(repos.map(r => r.language))];
  barra.innerHTML = linguagens.map((l, i) =>
    `<button type="button" class="filter-btn" data-lang="${escapeHTML(l)}" aria-pressed="${i === 0}">${escapeHTML(l)}</button>`
  ).join('');

  // 6.4 Filtro: um único "ouvinte" na barra cuida de todos os botões (delegação de eventos)
  barra.addEventListener('click', e => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    const alvo = btn.dataset.lang;

    // Marca só o botão clicado como ativo
    barra.querySelectorAll('.filter-btn').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));

    grid.querySelectorAll('.project-card').forEach(card => {
      const mostrar = alvo === 'Todos' || card.dataset.lang === alvo;
      if (mostrar) {
        card.hidden = false;
        // Espera o navegador "ver" o card antes de tirar a classe, para a transição acontecer
        requestAnimationFrame(() => card.classList.remove('is-hidden'));
      } else {
        card.classList.add('is-hidden');
        // Some de vez depois da transição de 0.3s
        setTimeout(() => { if (card.classList.contains('is-hidden')) card.hidden = true; }, 300);
      }
    });
  });

  observarReveal(grid.querySelectorAll('.reveal'));
})();

/* ---------- 7. Reveal ao rolar ---------- */
const reduzMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const observer = ('IntersectionObserver' in window && !reduzMovimento)
  ? new IntersectionObserver((entradas) => {
      entradas.forEach(entrada => {
        if (!entrada.isIntersecting) return;
        entrada.target.classList.add('in-view');
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
    else el.classList.add('in-view'); // sem suporte ou com movimento reduzido: mostra direto
  });
}

observarReveal(document.querySelectorAll('.reveal'));
