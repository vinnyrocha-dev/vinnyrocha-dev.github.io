# vini.dev

Portfólio pessoal de **Vinicius Rocha Pacheco**, estudante de Análise e Desenvolvimento de Sistemas em busca de estágio em Desenvolvimento Back-End.

🔗 **Acesse:** https://vinnyrocha-dev.github.io/

## Sobre o projeto

Site de uma página só, feito com **HTML, CSS e JavaScript puros**, sem framework. O visual segue o estilo "terminal de dev": tema escuro por padrão, com opção de tema claro.

## Funcionalidades

- Tema claro e escuro, com a escolha salva no navegador (localStorage)
- Números de repositórios e seguidores buscados ao vivo na API pública do GitHub
- Projetos carregados pela API do GitHub, com filtro por linguagem gerado automaticamente
- Lista fixa de projetos como reserva, caso a API falhe ou estoure o limite de requisições
- Animações de entrada ao rolar a página com IntersectionObserver
- Botão flutuante para conversar pelo WhatsApp
- Layout mobile first e responsivo

## Acessibilidade

- Tags semânticas (`header`, `nav`, `main`, `section`, `footer`)
- Foco visível ao navegar pelo teclado
- Link "Pular para o conteúdo"
- Texto alternativo nas imagens
- As animações são desativadas quando o sistema pede menos movimento (`prefers-reduced-motion`)

## Estrutura

```
├── index.html
├── style.css
├── script.js
└── assets/
    ├── foto-vinicius.jpg
    └── curriculo-vinicius-rocha-pacheco.pdf
```

## Como rodar localmente

Clone o repositório e abra o `index.html` no navegador:

```bash
git clone https://github.com/vinnyrocha-dev/vinnyrocha-dev.github.io.git
```

## Contato

- LinkedIn: https://www.linkedin.com/in/vinipache/
- E-mail: viniciusgp45@gmail.com
