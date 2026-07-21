# Arquitetura de Camadas - Estado Atual

## Visao geral

O projeto usa uma arquitetura em camadas para organizar a API Express.

As camadas atuais sao:

- `Routes`
- `Middlewares`
- `Controllers`
- `Services`
- `Repositories`
- `Database`

Essa separacao ajuda a manter cada parte do sistema com uma responsabilidade clara.

## Fluxo geral da requisicao

O fluxo principal da API funciona assim:

```txt
Cliente HTTP
  -> Express
  -> routes/routes.js
  -> Middlewares
  -> Controller
  -> Service
  -> Repository
  -> PostgreSQL
```

A resposta volta pelo caminho contrario:

```txt
PostgreSQL
  -> Repository
  -> Service
  -> Controller
  -> Cliente HTTP
```

## Entrada da aplicacao

Arquivo principal:

```txt
index.js
```

Responsabilidades atuais:

- Carregar variaveis de ambiente com `dotenv`.
- Criar a aplicacao Express.
- Configurar `cors`.
- Configurar `express.json()`.
- Configurar `express.urlencoded()`.
- Registrar as rotas principais.
- Testar conexao com PostgreSQL usando Knex.
- Iniciar o servidor somente se a conexao com o banco funcionar.

Fluxo de inicializacao:

```txt
index.js
  -> carrega .env
  -> configura Express
  -> registra routes
  -> testa banco com SELECT 1
  -> inicia app.listen
```

## Routes

Arquivo atual:

```txt
routes/routes.js
```

Responsabilidades:

- Definir metodo HTTP.
- Definir URL.
- Aplicar middlewares.
- Encaminhar a requisicao para o controller correto.

Rotas atuais:

```txt
GET /                              -> HomeController.index
POST /users                        -> UsuarioController.create
GET /users                         -> AuthMiddleware, CargoMiddleware, UsuarioController.listarUsuarios
GET /users/:id                     -> AuthMiddleware, CargoMiddleware, ValidarId, UsuarioController.buscarPorId
PATCH /users/:id                   -> AuthMiddleware, CargoMiddleware, ValidarId, UsuarioController.atualizarCargo
DELETE /users/:id                  -> AuthMiddleware, CargoMiddleware, ValidarId, UsuarioController.deletar
POST /auth/login                   -> loginLimiter, AuthController.login
POST /auth/esqueci-senha           -> emailMiddleware, RecuperaSenhaController.criar
GET /auth/redefinir-senha/:token   -> RecuperaSenhaController.validarToken
PATCH /auth/redefinir-senha/:token -> RecuperaSenhaController.redefinir
```

Tambem existe um `apiLimiter` aplicado globalmente nas rotas.

## Middlewares

Middlewares sao executados antes dos controllers.

Eles servem para bloquear, validar ou preparar a requisicao.

### AuthMiddleware

Arquivo:

```txt
middleware/AuthMiddleware.js
```

Responsabilidade:

- Ler o header `Authorization`.
- Verificar se o token existe.
- Verificar se o formato e `Bearer token`.
- Validar o JWT com `TokenService`.
- Adicionar o payload em `req.usuario`.

Fluxo:

```txt
Authorization: Bearer token
  -> AuthMiddleware
  -> TokenService.verificar
  -> req.usuario = payload
  -> next()
```

### CargoMiddleware

Arquivo:

```txt
middleware/CargoMiddleware.js
```

Responsabilidade:

- Verificar se existe `req.usuario`.
- Verificar se `req.usuario.cargo` e `Admin`.
- Bloquear usuarios comuns em rotas administrativas.

Fluxo:

```txt
req.usuario
  -> cargo === "Admin"
  -> next()
```

### ValidarId

Arquivo:

```txt
middleware/ValidarId.js
```

Responsabilidade:

- Validar se `req.params.id` contem apenas numeros.
- Retornar erro `400` quando o id for invalido.

### emailMiddleware

Arquivo:

```txt
middleware/emailMiddleware.js
```

Responsabilidade:

- Verificar se `email` foi enviado no corpo da requisicao.
- Validar formato basico de email.
- Usado na rota de esqueci senha.

### Ratelimite

Arquivo:

```txt
middleware/Ratelimite.js
```

Responsabilidades:

- `apiLimiter`: limite geral para a API.
- `loginLimiter`: limite especifico para tentativas de login.
- `skipSuccessfulRequests`: login com sucesso nao conta no limite.

## Controllers

Controllers recebem `req` e `res`.

Eles devem:

- Ler parametros, query ou body.
- Chamar services.
- Retornar status HTTP e JSON.
- Tratar erros esperados.

### UsuarioController

Arquivo:

```txt
controller/UsuarioController.js
```

Metodos atuais:

- `create`
- `listarUsuarios`
- `buscarPorId`
- `atualizarCargo`
- `deletar`

Responsabilidades atuais:

- Validar campos obrigatorios simples no cadastro.
- Chamar `UsuarioService`.
- Retornar respostas JSON.
- Validar se o cargo recebido e `Admin` ou `Cliente` na alteracao de cargo.

Observacao:

- Existe um metodo `index` vazio.
- A rota `PATCH /users/:id` altera cargo, apesar do caminho nao deixar isso explicito.

### AuthController

Arquivo:

```txt
controller/AuthController.js
```

Metodo atual:

- `login`

Responsabilidades atuais:

- Ler `email` e `senha`.
- Chamar `AuthService.login`.
- Retornar usuario e token.
- Retornar tentativas restantes quando o rate limit informa esse dado.

### RecuperaSenhaController

Arquivo:

```txt
controller/RecuperaSenhaController.js
```

Metodos atuais:

- `criar`
- `validarToken`
- `redefinir`

Responsabilidades atuais:

- Solicitar recuperacao de senha.
- Validar token de recuperacao.
- Redefinir senha usando token.

### HomeController

Arquivo:

```txt
controller/HomeController.js
```

Responsabilidade:

- Responder a rota inicial da API.

## Services

Services concentram regras de negocio.

Eles nao devem depender diretamente de `req` ou `res`.

### UsuarioService

Arquivo:

```txt
services/UsuarioService.js
```

Responsabilidades atuais:

- Listar usuarios.
- Criar usuario.
- Verificar email duplicado.
- Gerar hash da senha com `bcrypt`.
- Definir cargo padrao como `Cliente`.
- Buscar usuario por id.
- Atualizar cargo.
- Deletar usuario.
- Buscar usuario por email sem retornar senha.
- Atualizar senha.
- Impedir que nova senha seja igual a senha atual.

Fluxo do cadastro:

```txt
UsuarioService.criar
  -> UsuarioRepository.buscarPorEmail
  -> bcrypt.hash
  -> UsuarioRepository.criar
  -> remove senha da resposta
```

### AuthService

Arquivo:

```txt
services/AuthService.js
```

Responsabilidades atuais:

- Buscar usuario por email.
- Comparar senha com `bcrypt.compare`.
- Gerar JWT com `TokenService`.
- Retornar usuario sem senha e token.

Fluxo do login:

```txt
AuthService.login
  -> UsuarioRepository.buscarPorEmail
  -> bcrypt.compare
  -> TokenService.gerar
  -> remove senha da resposta
```

### TokenService

Arquivo:

```txt
services/TokenService.js
```

Responsabilidades atuais:

- Gerar token JWT.
- Verificar token JWT.
- Usar `JWT_SECRET` e `JWT_EXPIRES_IN` do ambiente.

### RecuperacaoSenhaService

Arquivo:

```txt
services/RecuperacaoSenhaService.js
```

Responsabilidades atuais:

- Criar token de recuperacao de senha.
- Remover tokens ativos antigos do usuario.
- Definir expiracao de 15 minutos.
- Montar link de recuperacao usando `APP_URL`.
- Enviar email pelo `EmailService`.
- Validar token.
- Redefinir senha.
- Marcar token como usado.

Fluxo de recuperacao:

```txt
POST /auth/esqueci-senha
  -> RecuperacaoSenhaService.criar
  -> UsuarioRepository.buscarPorEmail
  -> TokenSenhaRepository.removerTokensAtivos
  -> crypto.randomBytes
  -> TokenSenhaRepository.criar
  -> EmailService.enviar
```

Fluxo de redefinicao:

```txt
PATCH /auth/redefinir-senha/:token
  -> RecuperacaoSenhaService.redefinir
  -> TokenSenhaRepository.buscarPorToken
  -> valida usado/expirado
  -> UsuarioService.atualizarSenha
  -> TokenSenhaRepository.marcarComoUsado
```

### EmailService

Arquivo:

```txt
services/EmailService.js
```

Responsabilidades atuais:

- Configurar transporte com `nodemailer`.
- Enviar emails HTML.
- Usar configuracoes de email do `.env`.

## Repositories

Repositories isolam o acesso ao banco de dados.

No projeto, eles usam Knex.

### UsuarioRepository

Arquivo:

```txt
repositories/UsuarioRepository.js
```

Tabela principal:

```txt
usuarios
```

Metodos atuais:

- `buscarTodos`
- `buscarPorId`
- `buscarPorEmail`
- `criar`
- `atualizar`
- `deletar`
- `atualizarCargo`
- `atualizarSenha`

Responsabilidade:

- Consultar, inserir, atualizar e deletar usuarios.

### TokenSenhaRepository

Arquivo:

```txt
repositories/TokenSenhaRepository.js
```

Tabela principal:

```txt
token_senhas
```

Metodos atuais:

- `criar`
- `buscarPorToken`
- `marcarComoUsado`
- `removerTokensAtivos`

Responsabilidade:

- Gerenciar tokens de recuperacao de senha.

## Database

### Conexao

Arquivo:

```txt
database/database.js
```

Responsabilidades:

- Criar instancia do Knex.
- Ler configuracoes do `.env`.
- Configurar pool de conexoes.
- Exportar a conexao para repositories.

### Knexfile

Arquivo:

```txt
knexfile.js
```

Responsabilidades:

- Configurar ambiente `development`.
- Definir diretorio das migrations.

### Migrations

Arquivos:

```txt
database/migrations/Usuario.js
database/migrations/Token_senha.js
```

Tabela `usuarios`:

- `id`
- `nome`
- `sobrenome`
- `email`
- `senha`
- `cargo`
- `created_at`
- `updated_at`

Tabela `token_senhas`:

- `id`
- `token`
- `usuario_id`
- `usado`
- `expira_em`
- `created_at`
- `updated_at`

## Exemplos de fluxo atuais

### Criar usuario

```txt
POST /users
  -> UsuarioController.create
  -> UsuarioService.criar
  -> UsuarioRepository.buscarPorEmail
  -> bcrypt.hash
  -> UsuarioRepository.criar
  -> resposta 201
```

### Login

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

### Listar usuarios

```txt
GET /users
  -> apiLimiter
  -> AuthMiddleware
  -> CargoMiddleware
  -> UsuarioController.listarUsuarios
  -> UsuarioService.listar
  -> UsuarioRepository.buscarTodos
  -> resposta 200
```

### Alterar cargo

```txt
PATCH /users/:id
  -> apiLimiter
  -> AuthMiddleware
  -> CargoMiddleware
  -> ValidarId
  -> UsuarioController.atualizarCargo
  -> UsuarioService.atualizarCargo
  -> UsuarioRepository.buscarPorId
  -> UsuarioRepository.atualizarCargo
  -> resposta 200
```

### Redefinir senha

```txt
PATCH /auth/redefinir-senha/:token
  -> apiLimiter
  -> RecuperaSenhaController.redefinir
  -> RecuperacaoSenhaService.redefinir
  -> TokenSenhaRepository.buscarPorToken
  -> UsuarioService.atualizarSenha
  -> TokenSenhaRepository.marcarComoUsado
  -> resposta 200
```

## Resumo das responsabilidades

| Camada | Responsabilidade |
| --- | --- |
| `index.js` | Configura Express e inicia o servidor |
| `routes` | Define URLs, metodos HTTP, middlewares e controllers |
| `middleware` | Valida, autentica, autoriza ou limita requisicoes |
| `controller` | Recebe `req`, chama services e devolve `res` |
| `services` | Executa regras de negocio |
| `repositories` | Acessa o banco de dados com Knex |
| `database` | Configura conexao e migrations |

## Pontos de arquitetura que podem evoluir

- Criar middleware global de erro.
- Separar rotas por dominio, como `userRoutes` e `authRoutes`.
- Criar validators dedicados para body de cada rota.
- Remover imports nao utilizados.
- Remover logs sensiveis de token e payload.
- Renomear `PATCH /users/:id` para `PATCH /users/:id/cargo`.
- Criar uma camada ou padrao de erros customizados.
- Adicionar testes para services e rotas.

## Regra pratica para novas funcionalidades

```txt
Precisa criar uma nova URL?
  -> Mexa em routes

Precisa usar req ou res?
  -> Mexa no controller

Precisa aplicar regra de negocio?
  -> Mexa no service

Precisa consultar ou alterar o banco?
  -> Mexa no repository

Precisa bloquear acesso antes do controller?
  -> Mexa em middleware

Precisa mudar estrutura de tabela?
  -> Crie ou altere uma migration
```
