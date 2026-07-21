# Analise de Requisitos - Base de Usuarios

## Objetivo do projeto

Este projeto serve como uma base reutilizavel para APIs que precisam de cadastro de usuarios, autenticacao, autorizacao por perfil e recuperacao de senha.

A ideia principal e praticar uma API Express organizada em camadas, com regras de negocio separadas do acesso ao banco de dados.

## Escopo atual

O sistema atualmente permite:

- Cadastrar usuarios.
- Autenticar usuarios por email e senha.
- Gerar token JWT para usuarios autenticados.
- Identificar o tipo do usuario pelo campo `cargo`.
- Controlar acesso a rotas administrativas pelo cargo `Admin`.
- Listar usuarios apenas para administradores.
- Buscar usuario por id apenas para administradores.
- Alterar cargo de usuario apenas para administradores.
- Deletar usuario apenas para administradores.
- Solicitar recuperacao de senha por email.
- Validar token de recuperacao de senha.
- Redefinir senha usando token de recuperacao.
- Aplicar limite de requisicoes na API e limite especifico no login.

## Regras de negocio implementadas

### Usuario

- Todo usuario possui `nome`, `sobrenome`, `email`, `senha` e `cargo`.
- O email deve ser unico no banco.
- A senha e armazenada com hash usando `bcrypt`.
- O cargo padrao e `Cliente`.
- O cargo pode ser `Cliente` ou `Admin`.
- O cadastro sempre cria usuario como `Cliente`, mesmo que outro cargo seja enviado no corpo da requisicao.
- A senha nao deve ser retornada nas respostas da API.

### Autenticacao

- O usuario faz login usando `email` e `senha`.
- Em caso de login valido, a API retorna um token JWT.
- O token carrega `id`, `email` e `cargo`.
- Rotas protegidas exigem token no formato `Bearer token`.
- Token ausente, mal formatado, invalido ou expirado retorna erro `401`.

### Autorizacao

- Rotas administrativas exigem usuario autenticado.
- Rotas administrativas exigem `cargo` igual a `Admin`.
- Usuario com cargo `Cliente` nao pode listar, buscar, alterar cargo ou deletar usuarios.

### Recuperacao de senha

- O usuario informa o email em `POST /auth/esqueci-senha`.
- Se o email existir, o sistema remove tokens ativos antigos daquele usuario.
- Um novo token aleatorio e criado com `crypto.randomBytes`.
- O token expira em 15 minutos.
- O link de recuperacao usa `APP_URL`.
- A senha pode ser redefinida com token valido.
- Token usado, expirado ou inexistente e recusado.
- Depois da redefinicao, o token e marcado como usado.
- A nova senha nao pode ser igual a senha atual.

### Rate limit

- Toda a API usa um limite geral de requisicoes.
- A rota de login possui limite especifico.
- Logins bem-sucedidos nao contam no limite de tentativas de login.

## Rotas atuais

### Publicas

```txt
GET /
POST /users
POST /auth/login
POST /auth/esqueci-senha
GET /auth/redefinir-senha/:token
PATCH /auth/redefinir-senha/:token
```

### Administrativas

Todas exigem `AuthMiddleware` e `CargoMiddleware`.

```txt
GET /users
GET /users/:id
PATCH /users/:id
DELETE /users/:id
```

Observacao: atualmente `PATCH /users/:id` altera apenas o cargo do usuario.

## Estrutura desenvolvida

- API Express configurada em `index.js`.
- Rotas centralizadas em `routes/routes.js`.
- Conexao com PostgreSQL via Knex.
- Configuracao do Knex em `database/database.js` e `knexfile.js`.
- Migration da tabela `usuarios`.
- Migration da tabela `token_senhas`.
- Camadas principais:
  - `controller`
  - `services`
  - `repositories`
  - `middleware`
  - `database`
  - `routes`
- Cadastro de usuario.
- Login com JWT.
- Hash de senha com `bcrypt`.
- Middleware de autenticacao JWT.
- Middleware de autorizacao por cargo.
- Middleware de validacao de id numerico.
- Middleware de validacao simples de email.
- Rate limit geral da API.
- Rate limit especifico para login.
- Service para envio de email com `nodemailer`.
- Service para geracao e validacao de JWT.
- Service de recuperacao de senha.
- Repository de usuarios.
- Repository de tokens de recuperacao de senha.
- Scripts no `package.json`:
  - `start`
  - `dev`
  - `migrate`

## Pontos fortes do estado atual

- Boa separacao entre rotas, controllers, services e repositories.
- O projeto ja evita deixar toda a regra dentro do `index.js`.
- Uso correto de `async/await`.
- Senha e salva com hash, nao em texto puro.
- JWT esta isolado em um service proprio.
- Autorizacao por cargo foi separada em middleware.
- Recuperacao de senha tem token, expiracao e controle de uso.
- As respostas seguem um padrao parecido com `sucesso`, `mensagem` e `dados`.
- Migrations possuem constraints importantes, como `unique`, `notNullable` e chave estrangeira.

## Pontos que ainda precisam melhorar

### Validacao de entrada

Atualmente existem validacoes simples, mas ainda falta uma validacao mais completa e centralizada.

Melhorias recomendadas:

- Validar formato de email tambem no cadastro e login.
- Validar tamanho minimo da senha.
- Validar obrigatoriedade de `sobrenome`, ja que a migration exige esse campo.
- Validar tamanho maximo de campos como `nome`, `sobrenome` e `email`.
- Validar corpo vazio em rotas que recebem JSON.
- Considerar uso de uma biblioteca como `zod`, `joi` ou `express-validator`.

### Tratamento de erro

Hoje cada controller trata erro com `try/catch`.

Melhorias recomendadas:

- Criar um middleware global de erro.
- Criar classes de erro com status HTTP.
- Evitar retornar mensagens internas do sistema em erros inesperados.
- Usar status mais especificos, como:
  - `400` para dados invalidos.
  - `401` para nao autenticado.
  - `403` para sem permissao.
  - `404` para recurso nao encontrado.
  - `409` para conflito, como email ja cadastrado.
  - `500` para erro interno.

### Organizacao das rotas

O projeto funciona, mas algumas rotas podem ficar mais expressivas.

Estado atual:

```txt
PATCH /users/:id
```

Essa rota altera o cargo, mas o caminho nao deixa isso claro.

Sugestao futura:

```txt
PATCH /users/:id/cargo
```

Tambem pode ser interessante separar as rotas em arquivos menores no futuro:

```txt
routes/userRoutes.js
routes/authRoutes.js
```

### Troca de senha autenticada

O projeto ja tem redefinicao de senha por token de recuperacao.

Ainda falta uma rota para o usuario autenticado trocar a propria senha informando a senha atual.

Sugestao:

```txt
PATCH /users/password
```

Fluxo esperado:

```txt
AuthMiddleware
UsuarioController.trocarSenha
UsuarioService.trocarSenha
UsuarioRepository.buscarPorId
bcrypt.compare
bcrypt.hash
UsuarioRepository.atualizarSenha
```

### Limpeza de codigo

Existem alguns imports nao utilizados.

Exemplos:

- `AuthController.js` importa dependencias que nao usa.
- `CargoMiddleware.js` importa `UsuarioService`, mas nao usa.
- `RecuperaSenhaController.js` possui um import com nome incorreto e nao utilizado.

Tambem existem alguns `console.log` que devem ser removidos antes de producao, principalmente o log do token JWT.

### Encoding dos arquivos

Algumas mensagens do codigo ainda aparecem com caracteres quebrados por causa de encoding.

Recomendacao:

- Padronizar os arquivos como UTF-8.
- Revisar textos retornados pela API.

### Seguranca e producao

Antes de deploy, ainda e recomendado:

- Configurar `app.set("trust proxy", ...)` conforme o ambiente.
- Remover logs sensiveis.
- Garantir que `.env` nao seja versionado.
- Garantir que `.env.example` tenha todas as variaveis necessarias sem segredos reais.
- Validar se `JWT_SECRET` existe antes de subir o servidor.
- Validar configuracoes obrigatorias de banco e email.

### Testes

Ainda nao ha testes automatizados.

Testes recomendados:

- Cadastro de usuario.
- Cadastro com email duplicado.
- Login com senha correta.
- Login com senha incorreta.
- Acesso sem token.
- Acesso com token invalido.
- Bloqueio de Cliente em rota administrativa.
- Permissao de Admin em rota administrativa.
- Alteracao de cargo.
- Recuperacao de senha.
- Token de recuperacao expirado.
- Token de recuperacao ja usado.

## Criterios de aceite atuais

Ja atendidos:

- Usuario comum consegue se cadastrar.
- Usuario consegue fazer login.
- Token JWT e gerado no login.
- Senhas sao salvas com hash.
- Senhas nao sao retornadas nas principais respostas.
- Usuario comum nao consegue acessar rotas administrativas.
- Admin consegue listar usuarios.
- Admin consegue buscar usuario por id.
- Admin consegue alterar cargo.
- Admin consegue deletar usuario.
- Usuario consegue solicitar recuperacao de senha.
- Usuario consegue redefinir senha com token valido.

Ainda pendentes ou parciais:

- Validacao completa de dados de entrada.
- Troca de senha autenticada com senha atual.
- Testes automatizados.
- Middleware global de erro.
- Limpeza de imports e logs.
- Revisao de encoding.
- Documentacao de instalacao e uso no README.

## Proxima ordem recomendada

1. Corrigir encoding dos textos.
2. Remover imports nao usados e logs sensiveis.
3. Melhorar validacoes de entrada.
4. Criar middleware global de erro.
5. Renomear `PATCH /users/:id` para `PATCH /users/:id/cargo`.
6. Criar rota de troca de senha autenticada.
7. Adicionar testes com Jest ou Vitest e Supertest.
8. Criar README com setup, variaveis de ambiente e exemplos de rotas.
