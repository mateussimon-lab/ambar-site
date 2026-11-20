# Âmbar Arquitetura — site

Site institucional e portfólio da Âmbar Arquitetura (Bento Gonçalves/RS).
HTML, CSS e JavaScript puros, publicado na Netlify, com painel de edição (Decap CMS).

## Documentação

- `CONFIGURACAO-INICIAL.md` — passo a passo para ligar GitHub, Netlify e o painel (uma única vez).
- `COMO-EDITAR.md` — guia de uso do painel para quem edita o site.

## Como funciona

```
conteúdo (content/*.json)  ──►  editado pelo painel em /admin  ──►  commit no GitHub
                                                                        │
         site publicado  ◄──  Netlify roda "npm run build" e publica "dist"
```

- **Textos e fotos** ficam em `content/*.json`. Quem edita é o painel (`admin/config.yml`).
- **Páginas** (`*.html`) são modelos; `assets/js/main.js` lê o conteúdo e desenha cada página.
- **Fotos novas** enviadas pelo painel vão para `assets/img/uploads/`.
- **Build** (`scripts/build.mjs`): monta a pasta `dist` e reduz fotos pesadas (lado maior 2400 px,
  qualidade 82; logos até 900 px de largura). Só a cópia publicada é reduzida; os originais do
  repositório não são alterados.

## Arquivos de conteúdo

| Arquivo | O que controla |
| --- | --- |
| `content/geral.json` | Nome e descrição ao lado do logo |
| `content/home.json` | Fotos da capa |
| `content/sobre.json` | Texto do escritório, sócios e fotos |
| `content/arquitetura.json` | Frases de abertura da página Arquitetura |
| `content/planejamento.json` | Página Planejamento e suas seções |
| `content/gestao.json` | Frase de abertura da Gestão Técnica |
| `content/contato.json` | E-mail, endereço, mapa e Instagram |
| `content/projetos.json` | Todos os projetos (a ordem da lista é a ordem no site) |
| `content/tema.json` | Fontes e tamanhos (não aparece no painel de propósito) |

Se um campo for adicionado a um JSON, ele também precisa existir em `admin/config.yml`
para poder ser editado pelo painel (e vice-versa).

## Rodar no seu computador

Requer Node 20.9 ou superior.

```
npm install
npm run preview      # monta "dist" e abre em http://localhost:8080
```

Abrir os `.html` direto no navegador (duplo clique) não funciona: o site precisa de um servidor
para ler `content/*.json`.

## Trechos desativados no HTML

Algumas seções estão comentadas nos `.html` (textos de apresentação da Home, projetos em
destaque, blocos de conceitos em Sobre). Foram mantidas como estavam. Para reativá-las, é
preciso descomentar o HTML, recriar o código que as preenche em `assets/js/main.js` e
adicionar os campos correspondentes em `content/` e `admin/config.yml`.
