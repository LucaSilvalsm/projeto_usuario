const TokenSenhaRepository = require("../repositories/TokenSenhaRepository");

const UsuarioService = require("../services/UsuarioService");
const crypto = require("crypto");

class RecuperacaoSenhaService {
  async criar(email) {
    const usuario = await UsuarioService.buscarPorEmail(email);

    if (!usuario) {
      throw new Error("Usuário não encontrado.");
    }

    // Remove todos os tokens ativos
    await TokenSenhaRepository.removerTokensAtivos(usuario.id);

    const token = crypto.randomBytes(32).toString("hex");

    const tokenCriado = await TokenSenhaRepository.criar({
      usuario_id: usuario.id,
      token,
      usado: false,
      expira_em: new Date(Date.now() + 15 * 60 * 1000),
    });

    return tokenCriado;
  }
}
module.exports = new RecuperacaoSenhaService();
