# Arquitetura de Camadas - Controller, Service e Repository

## Visao geral

O projeto usa uma separacao em camadas para organizar melhor as responsabilidades da API.

As principais camadas sao:

- `Controller`
- `Service`
- `Repository`

Cada camada tem uma funcao especifica. Essa divisao evita que uma unica parte do sistema fique responsavel por tudo.

## Fluxo geral da requisicao

O fluxo mais comum da API funciona assim:

```txt
Cliente HTTP
  -> Route
  -> Controller
  -> Service
  -> Repository
  -> Banco de dados
```

Depois, a resposta volta pelo caminho contrario:

```txt
Banco de dados
  -> Repository
  -> Service
  -> Controller
  -> Cliente HTTP
```

## Routes

As rotas definem o endereco da API e apontam qual metodo do controller deve ser executado.

Exemplo:

```js
routes.get('/users', UsuarioController.listarUsuarios);
routes.post('/users', UsuarioController.create);
routes.post('/auth/login', AuthController.login);
```

A rota nao deve conter regra de negocio. Ela deve apenas dizer:

- Qual e o metodo HTTP.
- Qual e o caminho da URL.
- Quais middlewares devem ser executados.
- Qual controller vai tratar a requisicao.

## Controller

O controller e a porta de entrada da regra da API.

Ele recebe:

- `req`, com dados da requisicao.
- `res`, usado para devolver a resposta.

Responsabilidades do controller:

- Receber dados da requisicao.
- Chamar o service correto.
- Retornar resposta HTTP com status e JSON.
- Tratar erros vindos do service.

Exemplo do projeto:

```js
async create(req, res) {
  try {
    const usuario = await UsuarioService.criar(req.body);

    return res.status(201).json({
      sucesso: true,
      mensagem: "Usuario criado com sucesso.",
      dados: usuario,
    });
  } catch (error) {
    return res.status(400).json({
      sucesso: false,
      mensagem: error.message,
    });
  }
}
```

O controller nao deveria fazer consulta direta ao banco e tambem nao deveria concentrar regras complexas de negocio.

## Service

O service concentra a regra de negocio.

Ele decide o que precisa acontecer antes de acessar ou alterar os dados.

Responsabilidades do service:

- Validar regras de negocio.
- Verificar se um usuario ja existe.
- Gerar hash da senha.
- Comparar senha no login.
- Definir quais dados podem ser retornados.
- Chamar repositories para buscar ou gravar dados.

Exemplo do cadastro de usuario:

```txt
UsuarioService.criar
  -> verifica se o email ja existe
  -> gera hash da senha
  -> envia os dados para o repository
  -> remove a senha da resposta
  -> retorna o usuario criado
```

O service nao deve depender de `req` ou `res`. Ele deve receber dados simples e retornar dados simples.

Isso deixa a regra de negocio mais facil de testar e reutilizar.

## Repository

O repository e a camada responsavel pelo acesso ao banco de dados.

No projeto, ele usa Knex para falar com a tabela `usuarios`.

Responsabilidades do repository:

- Executar consultas no banco.
- Inserir registros.
- Atualizar registros.
- Deletar registros.
- Isolar o uso do Knex do restante da aplicacao.

Exemplo:

```js
async buscarPorEmail(email) {
  return await knex("usuarios")
    .select("id", "nome", "sobrenome", "email", "senha", "cargo")
    .where({ email })
    .first();
}
```

O repository nao deve decidir regras como:

- Quem pode acessar uma rota.
- Se uma senha e valida.
- Se um usuario pode alterar outro usuario.

Essas decisoes pertencem ao service ou aos middlewares.

## Middleware

Middleware e uma camada intermediaria executada antes do controller.

No projeto, o `AuthMiddleware` tem a funcao de validar o token JWT.

Fluxo esperado:

```txt
Requisicao
  -> AuthMiddleware
  -> Controller
```

Se o token for valido, o middleware adiciona os dados do usuario em:

```js
req.usuario
```

Assim, os proximos middlewares ou controllers conseguem saber quem esta fazendo a requisicao.

## Middleware de permissao

Para controlar Admin e Cliente, o projeto deve ter um middleware de permissao.

Exemplo de responsabilidade:

```txt
AdminMiddleware
  -> verifica req.usuario.cargo
  -> permite se for Admin
  -> bloqueia se for Cliente
```

Esse middleware deve ser usado em rotas administrativas.

Exemplo esperado:

```js
routes.get(
  '/users',
  AuthMiddleware,
  AdminMiddleware,
  UsuarioController.listarUsuarios
);
```

## Exemplo completo: listar usuarios

Listar usuarios deve ser uma acao restrita ao Admin.

Fluxo esperado:

```txt
GET /users
  -> AuthMiddleware valida o token
  -> AdminMiddleware verifica se o cargo e Admin
  -> UsuarioController.listarUsuarios recebe a requisicao
  -> UsuarioService.listar aplica a regra da listagem
  -> UsuarioRepository.buscarTodos consulta o banco
  -> Controller retorna a resposta JSON
```

## Exemplo completo: criar usuario

Cadastro de usuario deve ser uma rota publica.

Fluxo:

```txt
POST /users
  -> UsuarioController.create
  -> UsuarioService.criar
  -> UsuarioRepository.buscarPorEmail
  -> bcrypt.hash
  -> UsuarioRepository.criar
  -> Controller retorna usuario criado sem senha
```

Nesse caso, o service protege a regra mais importante: nunca salvar senha pura no banco.

## Exemplo completo: login

Fluxo:

```txt
POST /auth/login
  -> AuthController.login
  -> AuthService.login
  -> UsuarioRepository.buscarPorEmail
  -> bcrypt.compare
  -> TokenService.gerar
  -> AuthController retorna usuario e token
```

O login tambem nao deve retornar a senha do usuario.

## Exemplo completo: trocar senha

Fluxo recomendado:

```txt
PATCH /users/password
  -> AuthMiddleware valida token
  -> UsuarioController.trocarSenha
  -> UsuarioService.trocarSenha
  -> UsuarioRepository.buscarPorId
  -> bcrypt.compare valida senha atual
  -> bcrypt.hash gera nova senha
  -> UsuarioRepository.atualizar salva a nova senha
  -> Controller retorna sucesso
```

Essa regra deve ficar no service porque envolve decisao de negocio e seguranca.

## Exemplo completo: alterar tipo de usuario

Fluxo recomendado:

```txt
PATCH /users/:id/cargo
  -> AuthMiddleware valida token
  -> AdminMiddleware verifica permissao
  -> UsuarioController.alterarCargo
  -> UsuarioService.alterarCargo
  -> valida se o cargo e Cliente ou Admin
  -> UsuarioRepository.atualizar
  -> Controller retorna sucesso
```

Essa rota deve ser protegida porque altera permissao dentro do sistema.

## Beneficios dessa organizacao

- O codigo fica mais facil de entender.
- Cada arquivo tem uma responsabilidade mais clara.
- Fica mais facil testar regras de negocio.
- Fica mais facil trocar a tecnologia do banco no futuro.
- Fica mais seguro controlar onde cada regra deve ficar.
- O projeto fica melhor preparado para ser reutilizado como base.

## Resumo das responsabilidades

| Camada | Responsabilidade |
| --- | --- |
| Route | Define URL, metodo HTTP, middlewares e controller |
| Controller | Recebe requisicao e devolve resposta HTTP |
| Service | Executa regras de negocio |
| Repository | Acessa o banco de dados |
| Middleware | Executa validacoes antes do controller |
| TokenService | Gera e valida token JWT |

## Regra pratica

Ao criar uma nova funcionalidade, pense assim:

```txt
Precisa criar uma nova URL?
  -> Mexa em routes

Precisa receber req/res?
  -> Mexa no controller

Precisa aplicar regra de negocio?
  -> Mexa no service

Precisa consultar ou alterar o banco?
  -> Mexa no repository

Precisa bloquear acesso antes da rota?
  -> Mexa em middleware
```
