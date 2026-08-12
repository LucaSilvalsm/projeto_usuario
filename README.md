# Projeto Usuario

API REST em Node.js e Express criada como base de estudo para cadastro de usuarios, autenticacao, autorizacao por perfil e recuperacao de senha. A ideia central do projeto e praticar boas praticas de seguranca junto com uma arquitetura em camadas, separando responsabilidades entre rotas, controllers, services, repositories, middlewares e banco de dados.

## Objetivo

O projeto funciona como uma base reutilizavel para APIs que precisam de:

- Cadastro de usuarios.
- Login com email e senha.
- Login com Google usando OAuth 2.0.
- Geracao e validacao de token JWT.
- Controle de acesso por cargo.
- Rotas administrativas protegidas.
- Consulta do usuario autenticado.
- Logout simples para fluxo stateless com JWT.
- Recuperacao e redefinicao de senha por token temporario.
- Rate limit geral da API e limite especifico para login.
- Persistencia em PostgreSQL usando Knex.

Mais do que entregar uma funcionalidade isolada, o foco e treinar organizacao de codigo, separacao de responsabilidades, protecao de credenciais e fluxo seguro de autenticacao.

## Tecnologias

- Node.js
- Express
- PostgreSQL
- Knex
- bcrypt
- jsonwebtoken
- googleapis
- google-auth-library
- express-rate-limit
- nodemailer
- dotenv
- cors

## Arquitetura

O projeto usa arquitetura em camadas. Cada camada tem uma responsabilidade clara e evita concentrar regra de negocio, acesso a banco e detalhes HTTP no mesmo arquivo.

Fluxo principal de uma requisicao:

```txt
Cliente HTTP
  -> Express
  -> routes/routes.js
  -> Middlewares
  -> Controllers
  -> Services
  -> Repositories
  -> PostgreSQL
```

Fluxo da resposta:

```txt
PostgreSQL
  -> Repositories
  -> Services
  -> Controllers
  -> Cliente HTTP
```

### Responsabilidades por camada

| Camada | Responsabilidade |
| --- | --- |
| `index.js` | Configura Express, middlewares globais, rotas e inicializacao do servidor |
| `routes` | Define URLs, metodos HTTP, middlewares e controllers |
| `middleware` | Autentica, autoriza, valida parametros ou limita requisicoes |
| `controller` | Le `req`, chama services e devolve respostas HTTP |
| `services` | Concentra regras de negocio |
| `repositories` | Isola consultas e alteracoes no banco usando Knex |
| `database` | Configura conexao e migrations |

## Estrutura de pastas

```txt
.
+-- controller
|   +-- AuthController.js
|   +-- GoogleAuthController.js
|   +-- HomeController.js
|   +-- RecuperaSenhaController.js
|   +-- UsuarioController.js
+-- database
|   +-- database.js
|   +-- migrations
|       +-- Token_senha.js
|       +-- Usuario.js
+-- middleware
|   +-- AuthMiddleware.js
|   +-- CargoMiddleware.js
|   +-- Ratelimite.js
|   +-- ValidarId.js
|   +-- emailMiddleware.js
+-- repositories
|   +-- TokenSenhaRepository.js
|   +-- UsuarioRepository.js
+-- routes
|   +-- routes.js
+-- services
|   +-- AuthService.js
|   +-- EmailService.js
|   +-- GoogleAuthService.js
|   +-- RecuperacaoSenhaService.js
|   +-- TokenService.js
|   +-- UsuarioService.js
+-- index.js
+-- knexfile.js
+-- package.json
+-- ANALISE_REQUISITOS.md
+-- ARQUITETURA_CAMADAS.md
```

## Como o projeto funciona

### Inicializacao

O arquivo `index.js` e a entrada da aplicacao. Ele:

1. Carrega variaveis de ambiente com `dotenv`.
2. Cria a aplicacao Express.
3. Configura `cors`, `express.json()` e `express.urlencoded()`.
4. Registra as rotas em `routes/routes.js`.
5. Testa a conexao com PostgreSQL usando Knex.
6. Inicia o servidor somente se o banco responder.

### Cadastro de usuario

Fluxo:

```txt
POST /users
  -> UsuarioController.create
  -> UsuarioService.criar
  -> UsuarioRepository.buscarPorEmail
  -> bcrypt.hash
  -> UsuarioRepository.criar
  -> resposta 201
```

Regras aplicadas:

- `nome`, `email` e `senha` sao obrigatorios no controller.
- O email deve ser unico.
- A senha e salva com hash usando `bcrypt`.
- O cargo enviado pelo cliente e ignorado.
- Todo usuario novo nasce com cargo `Cliente`.
- A senha nao e retornada na resposta.

### Login

Fluxo:

```txt
POST /auth/login
  -> apiLimiter
  -> loginLimiter
  -> AuthController.login
  -> AuthService.login
  -> UsuarioRepository.buscarPorEmail
  -> bcrypt.compare
  -> TokenService.gerar
  -> resposta 200 com usuario e token
```

Regras aplicadas:

- O usuario autentica com `email` e `senha`.
- A senha enviada e comparada com o hash salvo no banco.
- Em caso de sucesso, a API retorna um JWT.
- O token contem `id`, `email` e `cargo`.
- A senha e removida do objeto retornado.

### Login com Google OAuth 2.0

O projeto tambem possui login com Google usando OAuth 2.0. O fluxo usa o Google como provedor de identidade e, depois da confirmacao do usuario, a propria API gera um JWT interno para acessar as rotas protegidas.

Fluxo:

```txt
GET /auth/google
  -> GoogleAuthController.login
  -> GoogleAuthService.gerarUrl
  -> redireciona o usuario para o Google

GET /auth/google/callback?code=...
  -> GoogleAuthController.callback
  -> GoogleAuthService.obterDadosUsuario
  -> AuthService.loginGoogle
  -> UsuarioRepository.buscarPorEmail
  -> cria usuario se nao existir
  -> TokenService.gerar
  -> redireciona para APP_URL/google/callback?token=...
```

Regras aplicadas:

- A URL de autorizacao e gerada com `google.auth.OAuth2`.
- O escopo solicita email e perfil do usuario.
- O callback recebe o `code` enviado pelo Google.
- A API troca o `code` por tokens do Google.
- A API consulta os dados publicos do usuario no endpoint `oauth2.userinfo`.
- Se o email ainda nao existir no banco, um novo usuario e criado com cargo `Cliente`.
- Para usuarios criados pelo Google, a senha local e temporaria e recebe hash com `bcrypt`.
- Ao final, a API gera o JWT interno do projeto com `id`, `email` e `cargo`.

Observacao: o token retornado ao cliente continua sendo o JWT da sua API. Os tokens recebidos do Google sao usados apenas para obter os dados do usuario durante o callback.

### Logout

O projeto possui a rota `POST /auth/logout`, protegida por `AuthMiddleware`.

Como o JWT atual e stateless e nao existe blacklist ou tabela de sessoes revogadas, o logout implementado apenas confirma a saida para o cliente. A invalidacao real do acesso deve acontecer no frontend removendo o token armazenado.

Fluxo:

```txt
POST /auth/logout
  -> AuthMiddleware
  -> AuthController.logout
  -> resposta 200
```

### Usuario autenticado

A rota `GET /auth/me` retorna os dados do usuario autenticado com base no `id` presente no JWT.

Fluxo:

```txt
GET /auth/me
  -> AuthMiddleware
  -> AuthController.me
  -> UsuarioService.buscarPorId
  -> resposta 200 com usuario sem senha
```

### Autenticacao JWT

Rotas protegidas usam `AuthMiddleware`.

O middleware:

- Le o header `Authorization`.
- Exige o formato `Bearer token`.
- Valida o token com `TokenService.verificar`.
- Adiciona o payload em `req.usuario`.
- Retorna `401` para token ausente, mal formatado, invalido ou expirado.

Exemplo de header:

```txt
Authorization: Bearer seu_token_jwt
```

### Autorizacao por cargo

Rotas administrativas usam `CargoMiddleware` depois do `AuthMiddleware`.

O middleware:

- Verifica se existe `req.usuario`.
- Confirma se `req.usuario.cargo` e `Admin`.
- Bloqueia usuarios `Cliente` com status `403`.

### Recuperacao de senha

Solicitacao:

```txt
POST /auth/esqueci-senha
  -> emailMiddleware
  -> RecuperaSenhaController.criar
  -> RecuperacaoSenhaService.criar
  -> UsuarioRepository.buscarPorEmail
  -> TokenSenhaRepository.removerTokensAtivos
  -> crypto.randomBytes
  -> TokenSenhaRepository.criar
  -> EmailService.enviar
```

Redefinicao:

```txt
PATCH /auth/redefinir-senha/:token
  -> RecuperaSenhaController.redefinir
  -> RecuperacaoSenhaService.redefinir
  -> TokenSenhaRepository.buscarPorToken
  -> validacao de uso e expiracao
  -> UsuarioService.atualizarSenha
  -> TokenSenhaRepository.marcarComoUsado
```

Regras aplicadas:

- O token e gerado com `crypto.randomBytes(32)`.
- O token expira em 15 minutos.
- Tokens ativos antigos do mesmo usuario sao removidos antes de criar um novo.
- Token inexistente, usado ou expirado e recusado.
- A nova senha precisa ser confirmada.
- A nova senha nao pode ser igual a senha atual.
- Depois da redefinicao, o token e marcado como usado.

### Rate limit

O projeto usa `express-rate-limit` em dois niveis:

- `apiLimiter`: limite geral de 100 requisicoes a cada 15 minutos.
- `loginLimiter`: limite de 3 tentativas de login a cada 15 minutos.

No login, `skipSuccessfulRequests` esta habilitado. Assim, logins bem-sucedidos nao contam no limite de tentativas.

## Rotas

### Publicas

| Metodo | Rota | Descricao |
| --- | --- | --- |
| `GET` | `/` | Rota inicial da API |
| `POST` | `/users` | Cria usuario com cargo padrao `Cliente` |
| `POST` | `/auth/login` | Autentica usuario e retorna JWT |
| `GET` | `/auth/google` | Redireciona para login com Google |
| `GET` | `/auth/google/callback` | Recebe callback do Google, cria/busca usuario e gera JWT |
| `POST` | `/auth/esqueci-senha` | Solicita recuperacao de senha |
| `GET` | `/auth/redefinir-senha/:token` | Valida token de recuperacao |
| `PATCH` | `/auth/redefinir-senha/:token` | Redefine senha usando token valido |

### Protegidas

Exigem `Authorization: Bearer token`.

| Metodo | Rota | Descricao |
| --- | --- | --- |
| `GET` | `/auth/me` | Retorna o usuario autenticado |
| `POST` | `/auth/logout` | Confirma logout do cliente |

### Administrativas

Todas exigem `Authorization: Bearer token` e cargo `Admin`.

| Metodo | Rota | Descricao |
| --- | --- | --- |
| `GET` | `/users` | Lista usuarios |
| `GET` | `/users/:id` | Busca usuario por id |
| `PATCH` | `/users/:id` | Atualiza o cargo do usuario |
| `DELETE` | `/users/:id` | Deleta usuario |

## Exemplos de requisicao

### Criar usuario

```http
POST /users
Content-Type: application/json
```

```json
{
  "nome": "Maria",
  "sobrenome": "Silva",
  "email": "maria@email.com",
  "senha": "senha123"
}
```

### Login

```http
POST /auth/login
Content-Type: application/json
```

```json
{
  "email": "maria@email.com",
  "senha": "senha123"
}
```

### Iniciar login com Google

```http
GET /auth/google
```

Essa rota redireciona o usuario para a tela de autorizacao do Google.

### Callback do Google

```http
GET /auth/google/callback?code=authorization_code
```

Essa rota e chamada pelo Google depois da autorizacao. Em caso de sucesso, a API redireciona para:

```txt
APP_URL/google/callback?token=jwt_da_api
```

### Buscar usuario autenticado

```http
GET /auth/me
Authorization: Bearer seu_token_jwt
```

### Logout

```http
POST /auth/logout
Authorization: Bearer seu_token_jwt
```

### Alterar cargo

```http
PATCH /users/1
Authorization: Bearer seu_token_jwt
Content-Type: application/json
```

```json
{
  "cargo": "Admin"
}
```

### Solicitar recuperacao de senha

```http
POST /auth/esqueci-senha
Content-Type: application/json
```

```json
{
  "email": "maria@email.com"
}
```

### Redefinir senha

```http
PATCH /auth/redefinir-senha/seu_token
Content-Type: application/json
```

```json
{
  "senha": "novaSenha123",
  "confirmarSenha": "novaSenha123"
}
```

## Banco de dados

O projeto usa PostgreSQL com Knex.

### Tabela `usuarios`

Campos principais:

- `id`
- `nome`
- `sobrenome`
- `email`
- `senha`
- `cargo`
- `created_at`
- `updated_at`

Regras da migration:

- `email` e unico.
- `nome`, `sobrenome`, `email`, `senha` e `cargo` sao obrigatorios.
- `cargo` aceita apenas `Cliente` ou `Admin`.
- `cargo` tem valor padrao `Cliente`.

### Tabela `token_senhas`

Campos principais:

- `id`
- `token`
- `usuario_id`
- `usado`
- `expira_em`
- `created_at`
- `updated_at`

Regras da migration:

- `token` e unico.
- `usuario_id` referencia `usuarios.id`.
- A relacao usa `CASCADE` em update e delete.
- `usado` inicia como `false`.
- `expira_em` e obrigatorio.

## Variaveis de ambiente

Crie um arquivo `.env` a partir do `.env.example`.

```env
DB_NAME=nome_do_banco
DB_USER=usuario_do_banco
DB_PASSWORD=senha_do_banco
DB_HOST=localhost
DB_PORT=PORT
DB_DIALECT=pg
DB_TIMEZONE=America/Sao_Paulo

PORT=PORT

JWT_SECRET=um_segredo_forte
JWT_EXPIRES_IN=1d

GOOGLE_CLIENT_ID=seu_google_client_id
GOOGLE_CLIENT_SECRET=seu_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback

HOST_EMAIL=smtp.exemplo.com
PORT_EMAIL=PORT
SECURE_EMAIL=false
EMAIL_USER=seu_email
EMAIL_PASS=sua_senha_ou_app_password

APP_URL=http://localhost
```

Importante: o arquivo `.env` nao deve ser versionado, pois contem credenciais e segredos.

## Como rodar

Instale as dependencias:

```bash
npm install
```

Configure o `.env` e garanta que o banco PostgreSQL exista.

Execute as migrations:

```bash
npm run migrate
```

Inicie em modo desenvolvimento:

```bash
npm run dev
```

Ou inicie em modo normal:

```bash
npm start
```

Por padrao, se `PORT` nao estiver configurada, a API usa a porta `5000`.

## Scripts

| Script | Descricao |
| --- | --- |
| `npm start` | Inicia a API com Node |
| `npm run dev` | Inicia a API com Nodemon |
| `npm run migrate` | Executa migrations do Knex |

## Boas praticas de seguranca ja aplicadas

- Senhas sao armazenadas com hash usando `bcrypt`.
- Senhas nao sao retornadas nas principais respostas.
- JWT fica isolado em um service proprio.
- Rotas protegidas exigem token no formato `Bearer`.
- Rotas administrativas exigem cargo `Admin`.
- Login com Google usa OAuth 2.0 e gera um JWT interno da API.
- Usuarios criados via Google recebem senha temporaria com hash, nao senha em texto puro.
- Recuperacao de senha usa token aleatorio, expiracao e controle de uso.
- Tokens antigos de recuperacao sao removidos antes de criar um novo.
- Rate limit geral reduz abuso da API.
- Rate limit especifico no login reduz tentativas de forca bruta.
- `.env.example` separa configuracoes de ambiente do codigo.

## Pontos de melhoria recomendados

- Corrigir encoding dos textos retornados pela API.
- Remover imports nao utilizados.
- Remover logs sensiveis, principalmente token JWT e payload.
- Validar `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` e demais variaveis obrigatorias antes de iniciar o servidor.
- Criar validacao centralizada de entrada com `zod`, `joi` ou `express-validator`.
- Validar senha minima, formato de email, tamanho maximo de campos e corpo vazio.
- Criar middleware global de erro.
- Criar classes de erro com status HTTP.
- Renomear `PATCH /users/:id` para `PATCH /users/:id/cargo`.
- Separar rotas por dominio, como `userRoutes.js` e `authRoutes.js`.
- Criar rota autenticada para troca de senha com senha atual.
- Implementar logout com revogacao real caso o projeto passe a exigir invalidacao server-side de JWT.
- Avaliar uso de `state` no OAuth 2.0 para reduzir risco de CSRF no fluxo Google.
- Evitar enviar JWT em query string em producao; preferir cookie seguro ou troca controlada no frontend.
- Configurar `app.set("trust proxy", ...)` conforme o ambiente de deploy.
- Adicionar testes automatizados com Jest ou Vitest e Supertest.

## Testes recomendados

Ainda nao ha testes automatizados no projeto. Os principais cenarios sugeridos sao:

- Cadastro de usuario.
- Cadastro com email duplicado.
- Login com senha correta.
- Login com senha incorreta.
- Login com Google quando o usuario ja existe.
- Login com Google criando usuario novo.
- Callback do Google sem `code`.
- Acesso sem token.
- Acesso com token invalido.
- Rota `/auth/me` com token valido.
- Rota `/auth/logout` com e sem token.
- Bloqueio de usuario `Cliente` em rota administrativa.
- Permissao de usuario `Admin` em rota administrativa.
- Alteracao de cargo.
- Recuperacao de senha.
- Token de recuperacao expirado.
- Token de recuperacao ja usado.

## Regra pratica para evoluir o projeto

```txt
Precisa criar uma nova URL?
  -> Edite routes

Precisa usar req ou res?
  -> Edite controller

Precisa aplicar regra de negocio?
  -> Edite service

Precisa consultar ou alterar o banco?
  -> Edite repository

Precisa bloquear acesso antes do controller?
  -> Edite middleware

Precisa mudar estrutura de tabela?
  -> Crie ou altere uma migration
```

## Status atual

Funcionalidades ja presentes:

- Cadastro de usuarios.
- Login com JWT.
- Login com Google usando OAuth 2.0.
- Rota de usuario autenticado `/auth/me`.
- Rota de logout `/auth/logout`.
- Hash de senha com `bcrypt`.
- Autenticacao via middleware.
- Autorizacao por cargo `Admin`.
- CRUD administrativo parcial de usuarios.
- Recuperacao e redefinicao de senha.
- Rate limit geral e especifico para login.
- Migrations para usuarios e tokens de recuperacao.
