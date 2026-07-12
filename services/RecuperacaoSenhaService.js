const TokenSenhaRepository = require("../repositories/TokenSenhaRepository");
const UsuarioService = require("../services/UsuarioService");
const crypto = require("crypto");
const EmailService = require("../services/EmailService");

class RecuperacaoSenhaService {
  async criar(email) {
    const usuario = await UsuarioService.buscarPorEmail(email);

    if (!usuario) {
      throw new Error("Usuário não encontrado.");
    }

    await TokenSenhaRepository.marcarComoUsado(usuario.id);

    const token = require("crypto").randomBytes(32).toString("hex");

    const expiraEm = new Date(Date.now() + 15 * 60 * 1000);

    await TokenSenhaRepository.criar({
      usuario_id: usuario.id,
      token,
      usado: false,
      expira_em: expiraEm,
    });

    const link = `http://localhost:5000/auth/redefinir-senha/${token}`;

    await EmailService.enviar(
      usuario.email,
      "Recuperação de senha",
      `
                <h2>Recuperação de senha</h2>

                <p>Olá, ${usuario.nome}.</p>

                <p>Clique no botão abaixo para redefinir sua senha.</p>

                <a href="${link}"
                   style="
                        background:#2563eb;
                        color:white;
                        padding:12px 20px;
                        text-decoration:none;
                        border-radius:5px;
                   ">
                   Redefinir senha
                </a>

                <p>Este link expira em 15 minutos.</p>
            `,
    );

    return;
  }

  async validarToken(token) {
    const tokenBanco = await TokenSenhaRepository.buscarPorToken(token);

    if (!tokenBanco) {
      throw new Error("Token inválido.");
    }

    if (tokenBanco.usado) {
      throw new Error("Token já utilizado.");
    }

    if (new Date() > new Date(tokenBanco.expira_em)) {
      throw new Error("Token expirado.");
    }

    return tokenBanco;
  }
  async redefinir(token, senha, confirmarSenha) {
    // 1 - verificar se as senhas conferem
    if (senha !== confirmarSenha) {
      throw new Error("As senhas não conferem.");
    }

    // 2 - procurar token
    const tokenBanco = await TokenSenhaRepository.buscarPorToken(token);

    if (!tokenBanco) {
      throw new Error("Token inválido.");
    }

    // 3 - verificar se já foi usado
    if (tokenBanco.usado) {
      throw new Error("Token já utilizado.");
    }

    // 4 - verificar expiração
    if (new Date() > tokenBanco.expira_em) {
      throw new Error("Token expirado.");
    }

    // 5 - atualizar senha
    await UsuarioService.atualizarSenha(tokenBanco.usuario_id, senha);

    // 6 - marcar token como usado
    await TokenSenhaRepository.marcarComoUsado(tokenBanco.id);

    return {
      mensagem: "Senha redefinida com sucesso.",
    };
  }
}
module.exports = new RecuperacaoSenhaService();
