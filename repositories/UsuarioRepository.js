const knex = require("../database/database");

class UsuarioRepository {
  async buscarTodos() {
    return await knex("usuarios").select(
      "id",
      "nome",
      "sobrenome",
      "email",
      "cargo",
    );
  }

  async buscarPorId(id) {
    return await knex("usuarios").where({ id }).first();
  }

  async buscarPorEmail(email) {
    return await knex("usuarios")
      .select("id", "nome", "sobrenome", "email", "senha", "cargo")
      .where({ email })
      .first();
  }
  async criar(usuario) {
    const [novoUsuario] = await knex("usuarios").insert(usuario).returning("*");

    return novoUsuario;
  }

  async atualizar(id, dados) {
    const [usuarioAtualizado] = await knex("usuarios")
      .where({ id })
      .update(dados)
      .returning("*");

    return usuarioAtualizado;
  }

  async deletar(id) {
    return await knex("usuarios").where({ id }).delete();
  }

  async atualizarCargo(id, cargo) {
    const [usuarioAtualizado] = await knex("usuarios")
      .where({ id })
      .update({ cargo })
      .returning("*");

    return usuarioAtualizado;
  }
  async atualizarSenha(id, senha) {
    const [usuarioAtualizado] = await knex("usuarios")
      .where({ id })
      .update({ senha })
      .returning(["id", "nome", "sobrenome", "email", "cargo", "updated_at"]);

    return usuarioAtualizado;
  }
}

module.exports = new UsuarioRepository();
