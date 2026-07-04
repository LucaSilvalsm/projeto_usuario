# Analise de Requisitos - Base de Usuarios

## Objetivo do projeto

Este projeto deve servir como uma base reutilizavel para futuros sistemas que precisem de controle de usuarios, autenticacao e autorizacao por tipo de usuario.

A ideia principal e centralizar funcionalidades comuns, como cadastro, login, protecao de rotas, permissao por perfil e manutencao dos dados do usuario.

## Escopo principal

O sistema deve permitir:

- Cadastrar usuarios.
- Autenticar usuarios por email e senha.
- Gerar token JWT para usuarios autenticados.
- Identificar o tipo do usuario: `Cliente` ou `Admin`.
- Controlar quais usuarios podem acessar determinadas rotas.
- Permitir que usuarios alterem a propria senha.
- Permitir que administradores alterem o tipo de outro usuario.
- Permitir que somente administradores listem usuarios do sistema.

## Regras de negocio esperadas

### Usuario

- Todo usuario deve possuir nome, sobrenome, email, senha e cargo.
- O email deve ser unico.
- A senha deve ser armazenada com hash.
- O cargo padrao deve ser `Cliente`.
- O cargo pode ser `Cliente` ou `Admin`.

### Autenticacao

- O usuario deve fazer login usando email e senha.
- A API deve retornar um token JWT em caso de login valido.
- O token deve carregar informacoes basicas do usuario, como `id`, `email` e `cargo`.
- Rotas protegidas devem exigir o token no formato `Bearer token`.

### Autorizacao

- Nem todo usuario autenticado deve ter acesso a todas as rotas.
- Rotas administrativas devem ser acessadas apenas por usuarios com cargo `Admin`.
- A listagem de usuarios deve ser restrita ao `Admin`.
- Alterar o tipo de usuario tambem deve ser uma acao restrita ao `Admin`.

### Troca de senha

- O usuario autenticado deve poder trocar a propria senha.
- A rota deve receber a senha atual e a nova senha.
- A senha atual deve ser validada antes da troca.
- A nova senha deve ser salva com hash.

### Alteracao do tipo de usuario

- Apenas `Admin` deve poder alterar o tipo de outro usuario.
- A rota deve receber o `id` do usuario e o novo cargo.
- O novo cargo deve ser validado para aceitar apenas `Cliente` ou `Admin`.

## Desenvolvido

- Estrutura inicial em camadas:
  - `routes`
  - `controller`
  - `services`
  - `repositories`
  - `middleware`
  - `database`
- API Express configurada.
- Conexao com PostgreSQL via Knex.
- Migration da tabela `usuarios`.
- Campo `cargo` ja existe na tabela de usuarios.
- Valores previstos para `cargo`: `Cliente` e `Admin`.
- Cadastro de usuario.
- Verificacao de email duplicado no cadastro.
- Hash de senha com `bcrypt`.
- Login com email e senha.
- Geracao de token JWT.
- Middleware inicial para validar token JWT.
- Repository com metodos basicos:
  - buscar todos
  - buscar por id
  - buscar por email
  - criar
  - atualizar
  - deletar
- Respostas JSON com indicacao de sucesso ou falha em parte dos controllers/middlewares.

## Em desenvolvimento

- Padronizacao completa das respostas da API.
- Organizacao final das rotas de usuario.
- Definicao do papel do metodo `index` em `UsuarioController`.
- Uso efetivo do `AuthMiddleware` nas rotas protegidas.
- Definicao clara de quais rotas serao publicas e quais serao privadas.

## Falta desenvolver

### Controle de acesso por tipo de usuario

Criar um middleware de autorizacao para verificar o cargo do usuario autenticado.

Exemplo esperado:

```js
somenteAdmin(req, res, next)
```

Esse middleware deve:

- Ler `req.usuario`, preenchido pelo `AuthMiddleware`.
- Verificar se `req.usuario.cargo` e igual a `Admin`.
- Bloquear o acesso caso o usuario nao seja administrador.

### Proteger listagem de usuarios

A rota `GET /users` deve ser acessivel apenas para administradores.

Fluxo esperado:

```txt
GET /users
AuthMiddleware
AdminMiddleware
UsuarioController.listarUsuarios
UsuarioService.listar
UsuarioRepository.buscarTodos
```

### Criar rota para troca de senha

Rota sugerida:

```txt
PATCH /users/password
```

Essa rota deve:

- Exigir usuario autenticado.
- Receber `senhaAtual` e `novaSenha`.
- Validar a senha atual.
- Gerar hash da nova senha.
- Atualizar a senha no banco.

Controller sugerido:

```js
UsuarioController.trocarSenha
```

Service sugerido:

```js
UsuarioService.trocarSenha
```

Repository sugerido:

```js
UsuarioRepository.atualizar
```

### Criar rota para alterar tipo do usuario

Rota sugerida:

```txt
PATCH /users/:id/cargo
```

Essa rota deve:

- Exigir usuario autenticado.
- Exigir cargo `Admin`.
- Receber o novo cargo no corpo da requisicao.
- Validar se o cargo e `Cliente` ou `Admin`.
- Atualizar o usuario no banco.

Controller sugerido:

```js
UsuarioController.alterarCargo
```

Service sugerido:

```js
UsuarioService.alterarCargo
```

Repository sugerido:

```js
UsuarioRepository.atualizar
```

### Validacao de dados

Adicionar validacoes para:

- Nome obrigatorio.
- Sobrenome obrigatorio.
- Email obrigatorio.
- Email em formato valido.
- Senha obrigatoria.
- Senha com tamanho minimo.
- Cargo limitado a `Cliente` ou `Admin`.
- Nova senha diferente da senha atual.

### Tratamento de erro

Padronizar todas as respostas de erro no formato:

```json
{
  "sucesso": false,
  "mensagem": "Descricao do erro"
}
```

Padronizar respostas de sucesso no formato:

```json
{
  "sucesso": true,
  "mensagem": "Descricao da acao realizada",
  "dados": {}
}
```

### Scripts e manutencao do projeto

Adicionar scripts no `package.json`, por exemplo:

```json
{
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "migrate": "knex migrate:latest",
    "rollback": "knex migrate:rollback"
  }
}
```

### Testes

Criar testes para:

- Cadastro de usuario.
- Login.
- Listagem restrita a Admin.
- Bloqueio de listagem para Cliente.
- Troca de senha.
- Alteracao de cargo.
- Token ausente.
- Token invalido.

## Rotas recomendadas

### Publicas

```txt
GET /
POST /users
POST /auth/login
```

### Autenticadas

```txt
PATCH /users/password
```

### Administrativas

```txt
GET /users
PATCH /users/:id/cargo
```

## Ordem recomendada de implementacao

1. Criar middleware de permissao por cargo.
2. Aplicar `AuthMiddleware` e middleware de Admin em `GET /users`.
3. Criar service/controller para troca de senha.
4. Criar rota `PATCH /users/password`.
5. Criar service/controller para alterar cargo.
6. Criar rota `PATCH /users/:id/cargo`.
7. Adicionar validacoes de entrada.
8. Criar testes principais.

## Criterios de aceite

- Usuario comum consegue se cadastrar e fazer login.
- Usuario comum nao consegue listar usuarios.
- Admin consegue listar usuarios.
- Usuario autenticado consegue trocar a propria senha.
- Usuario nao autenticado nao consegue trocar senha.
- Cliente nao consegue alterar cargo de outro usuario.
- Admin consegue alterar cargo de outro usuario.
- Senhas nunca sao retornadas nas respostas da API.
- Senhas sempre sao salvas com hash.
