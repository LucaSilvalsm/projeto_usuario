const { test } = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcrypt");
const UsuarioService = require("../services/UsuarioService");
const UsuarioRepository = require("../repositories/UsuarioRepository");
const TokenService = require("../services/TokenService");
const authMiddleware = require("../middleware/AuthMiddleware");
const cargoMiddleware = require("../middleware/CargoMiddleware");
const UsuarioController = require("../controller/UsuarioController");

function resposta() {
  return {
    statusCode: 200,
    status(codigo) { this.statusCode = codigo; return this; },
    json(corpo) { this.body = corpo; return this; },
  };
}

test("cadastro cria Cliente, ignora cargo enviado e não expõe senha", async (t) => {
  t.mock.method(UsuarioRepository, "buscarPorEmail", async () => undefined);
  let dadosSalvos;
  t.mock.method(UsuarioRepository, "criar", async (dados) => {
    dadosSalvos = dados;
    return { id: 1, ...dados };
  });
  const res = resposta();
  await UsuarioController.create({ body: {
    nome: "Ana", sobrenome: "Silva", email: "ana@exemplo.com",
    senha: "segredo123", cargo: "Admin",
  } }, res);
  assert.equal(res.statusCode, 201);
  assert.equal(dadosSalvos.cargo, "Cliente");
  assert.notEqual(dadosSalvos.senha, "segredo123");
  assert.equal(await bcrypt.compare("segredo123", dadosSalvos.senha), true);
  assert.equal(res.body.dados.cargo, "Cliente");
  assert.equal(Object.hasOwn(res.body.dados, "senha"), false);
});

test("cadastro recusa dados obrigatórios ausentes e email duplicado", async (t) => {
  const criar = t.mock.method(UsuarioRepository, "criar", async () => { throw new Error("não deve criar"); });
  const semNome = resposta();
  await UsuarioController.create({ body: { email: "a@b.com", senha: "123" } }, semNome);
  assert.equal(semNome.statusCode, 400);
  assert.equal(criar.mock.callCount(), 0);
  t.mock.method(UsuarioRepository, "buscarPorEmail", async () => ({ id: 1 }));
  const duplicado = resposta();
  await UsuarioController.create({ body: { nome: "Ana", email: "a@b.com", senha: "123" } }, duplicado);
  assert.equal(duplicado.statusCode, 400);
  assert.equal(criar.mock.callCount(), 0);
});

test("rota protegida exige token Bearer válido", async (t) => {
  const verificar = t.mock.method(TokenService, "verificar", (token) => {
    if (token !== "valido") throw new Error("token inválido");
    return { id: 1, cargo: "Admin" };
  });
  for (const authorization of [undefined, "valido", "Bearer invalido"]) {
    const req = { headers: { authorization } };
    const res = resposta();
    let avancou = false;
    await authMiddleware(req, res, () => { avancou = true; });
    assert.equal(res.statusCode, 401);
    assert.equal(avancou, false);
  }
  const req = { headers: { authorization: "Bearer valido" } };
  let avancou = false;
  await authMiddleware(req, resposta(), () => { avancou = true; });
  assert.equal(avancou, true);
  assert.equal(req.usuario.id, 1);
  assert.equal(verificar.mock.callCount(), 2);
});

test("permissões administrativas usam cargo atual do banco", async (t) => {
  let cargo = "Cliente";
  t.mock.method(UsuarioRepository, "buscarPorId", async () => ({ id: 1, cargo }));
  const req = { usuario: { id: 1, cargo: "Admin" } };
  const negado = resposta();
  let avancou = false;
  await cargoMiddleware(req, negado, () => { avancou = true; });
  assert.equal(negado.statusCode, 403);
  assert.equal(avancou, false);
  cargo = "Admin";
  req.usuario.cargo = "Cliente";
  await cargoMiddleware(req, resposta(), () => { avancou = true; });
  assert.equal(avancou, true);
  assert.equal(req.usuarioBanco.cargo, "Admin");
});

test("permissão administrativa recusa usuário ausente ou removido", async (t) => {
  t.mock.method(UsuarioRepository, "buscarPorId", async () => undefined);
  for (const usuario of [undefined, { id: 99 }]) {
    const res = resposta();
    let avancou = false;
    await cargoMiddleware({ usuario }, res, () => { avancou = true; });
    assert.equal(res.statusCode, 401);
    assert.equal(avancou, false);
  }
});

test("consulta de usuário não devolve senha", async (t) => {
  t.mock.method(UsuarioRepository, "buscarPorId", async () => ({ id: 1, cargo: "Cliente", senha: "hash" }));
  const usuario = await UsuarioService.buscarPorId(1);
  assert.equal(usuario.cargo, "Cliente");
  assert.equal(Object.hasOwn(usuario, "senha"), false);
});

test("alteração de cargo aceita apenas Admin ou Cliente", async (t) => {
  const atualizar = t.mock.method(UsuarioService, "atualizarCargo", async (_id, cargo) => ({ id: 2, cargo }));
  const invalido = resposta();
  await UsuarioController.atualizarCargo({ params: { id: "2" }, body: { cargo: "SuperAdmin" } }, invalido);
  assert.equal(invalido.statusCode, 400);
  assert.equal(atualizar.mock.callCount(), 0);
  for (const cargo of ["Admin", "Cliente"]) {
    const res = resposta();
    await UsuarioController.atualizarCargo({ params: { id: "2" }, body: { cargo } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.dados.cargo, cargo);
  }
});
