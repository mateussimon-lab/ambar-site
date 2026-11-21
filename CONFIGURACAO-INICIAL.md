# Configuração inicial (fazer uma única vez)

Tempo estimado: 30 a 40 minutos. Depois disso, você e a Ângela editam o site só pelo painel
(veja `COMO-EDITAR.md`) e nunca mais precisam mexer em arquivos.

> Os nomes dos botões da Netlify e do GitHub mudam de vez em quando. Se algum nome abaixo
> não estiver exatamente igual na tela, procure o equivalente mais próximo.

## O que você vai precisar

- Sua conta no GitHub (já existe).
- Acesso à conta da Netlify onde está o site `ambarach`.
- O e-mail ou usuário do GitHub da Ângela (ela precisa criar uma conta gratuita em github.com).

---

## Passo 1 — Criar o repositório e colocar o site nele

1. No GitHub, clique em **New repository**.
2. Nome: `ambar-site` (use exatamente este, o painel já está configurado para ele). Marque **Private**.
   Não marque nenhuma opção de README, .gitignore ou licença (o repositório deve nascer vazio).
3. Coloque os arquivos do site no repositório. Duas formas:
   - **Pelo navegador:** na página do repositório vazio, clique em **uploading an existing file**
     e arraste o *conteúdo* da pasta do site (não o zip). O GitHub aceita até 100 arquivos por envio.
   - **Pelo GitHub Desktop:** *File → Add local repository*, escolha a pasta do site e clique em
     **Publish repository** (mantenha "Keep this code private" marcado).

## Passo 2 — Conferir o nome do repositório no painel

O arquivo `admin/config.yml` já vem com esta linha preenchida:

```
repo: mateussimon-lab/ambar-site
```

- Se você criou o repositório com **exatamente** o nome `ambar-site`, **não precisa fazer nada** neste passo.
- Se usou outro nome, edite a linha pelo próprio GitHub (abra o arquivo, clique no lápis,
  troque o texto e salve). O formato é `usuário/nome-do-repositório`, o mesmo texto que aparece
  depois de `github.com/` no endereço do repositório.

## Passo 3 — Ligar o repositório à Netlify

1. Na Netlify: **Add new project → Import an existing project → GitHub** e escolha `ambar-site`.
2. Não precisa preencher comando de build nem pasta de publicação: o arquivo `netlify.toml`
   já informa tudo. Confirme e aguarde o primeiro "Deploy".
3. **Atenção ao endereço do site.** O site antigo `ambarach` foi publicado arrastando uma pasta,
   e esse tipo de site não pode ser religado a um repositório. Então este passo cria um site
   *novo*. Para ficar com o mesmo endereço:
   - primeiro renomeie o site antigo (*Site configuration → Change site name*, por exemplo `ambarach-antigo`);
   - depois renomeie o site novo para `ambarach`.
   Se houver domínio próprio ligado ao site antigo, ele também precisa ser movido para o novo.
   (Se a Netlify do seu painel oferecer a opção de ligar um repositório ao site existente, pode usá-la.)

## Passo 4 — Liberar o login com GitHub no painel

O painel precisa de uma "autorização" para entrar com a conta do GitHub.

1. No GitHub: **Settings → Developer settings → OAuth Apps → New OAuth App** e preencha:
   - Application name: `Âmbar CMS`
   - Homepage URL: `https://ambararquitetura.com.br`
   - Authorization callback URL: `https://api.netlify.com/auth/done` (este não muda)
2. Clique em **Register application**. Depois clique em **Generate a new client secret**.
   Guarde o **Client ID** e o **Client Secret** (o secret só aparece uma vez).
3. Na Netlify, no projeto novo: **Project configuration → Security → OAuth → Authentication providers → Install provider**.
   Escolha **GitHub** e cole o Client ID e o Client Secret.
   (A Netlify chama o site de "Project" nas telas mais novas; se o nome estiver diferente, procure por OAuth em Security.)

## Passo 5 — Dar acesso à Ângela

1. No repositório do GitHub: **Settings → Collaborators → Add people**.
2. Procure pelo usuário da Ângela e convide com permissão de escrita.
3. Ela recebe um e-mail e precisa **aceitar o convite**.

## Passo 6 — Testar

1. Abra `https://ambararquitetura.com.br/admin/`.
2. Clique em **Login with GitHub** e autorize.
3. Faça uma alteração pequena (por exemplo, uma letra num texto), clique em **Publicar** e
   confira se, depois de alguns minutos, o site mostra a mudança. Depois desfaça a alteração.

Pronto. A partir daqui, é só usar o painel.

---

## Se algo não funcionar

- **"Failed to load config" / tela em branco no /admin/:** a linha `repo` do `admin/config.yml`
  foi escrita errada (o formato é `usuário/nome-do-repositório`).
- **Login abre e fecha sem entrar:** confira o *callback URL* do passo 4 e se o Client ID e o
  Secret foram colados no site certo da Netlify.
- **Entra, mas não consegue salvar:** a pessoa não aceitou o convite do passo 5, ou não tem
  permissão de escrita no repositório.
- **O site não muda depois de publicar:** na Netlify, abra a aba **Deploys** e veja se o último
  deploy terminou ou deu erro. A mensagem de erro aparece no registro do deploy.
