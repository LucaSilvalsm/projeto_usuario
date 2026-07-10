const knex = require("../database/database");

class TokenSenhaRepository {

    async criar(dados) {
        const [token] = await knex("token_senhas")
            .insert(dados)
            .returning("*");

        return token;
    }

    async buscarPorToken(token) {
        return await knex("token_senhas")
            .where({ token })
            .first();
    }

    async marcarComoUsado(id) {
        return await knex("token_senhas")
            .where({ id })
            .update({ usado: true });
    }

    async removerTokensAtivos(usuario_id) {
        return await knex("token_senhas")
            .where({
                usuario_id,
                usado: false
            })
            .delete();
    }

}

module.exports = new TokenSenhaRepository();