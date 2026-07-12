const RecuperacaoSenhaService = require("../services/RecuperacaoSenhaService");
const UsuarioServicec = require("../services/UsuarioService");

class RecuperaSenhaController {
  async criar(req, res) {
    try {
      await RecuperacaoSenhaService.criar(req.body.email);

      return res.status(200).json({
        sucesso: true,
        mensagem:
          "Se o e-mail estiver cadastrado, um link de recuperação foi enviado.",
      });
    } catch (error) {
      return res.status(400).json({
        sucesso: false,
        mensagem: error.message,
      });
    }
  }
  async validarToken(req, res) {
    try {
      const { token } = req.params;

      await RecuperacaoSenhaService.validarToken(token);

      return res.status(200).json({
        sucesso: true,
        mensagem: "Token válido.",
      });
    } catch (error) {
      return res.status(400).json({
        sucesso: false,
        mensagem: error.message,
      });
    }
  }
  async redefinir(req, res) {
    try {
      const { token } = req.params;

      const { senha, confirmarSenha } = req.body;

      const resultado = await RecuperacaoSenhaService.redefinir(
        token,
        senha,
        confirmarSenha,
      );

      return res.status(200).json({
        sucesso: true,
        mensagem: resultado.mensagem,
      });
    } catch (error) {
      return res.status(400).json({
        sucesso: false,
        mensagem: error.message,
      });
    }
  }
}

module.exports = new RecuperaSenhaController();
