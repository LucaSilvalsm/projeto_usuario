const GoogleAuthService = require("../services/GoogleAuthService");
const AuthService = require("../services/AuthService");

class GoogleAuthController {

  async login(req, res) {
    try {
      const url = GoogleAuthService.gerarUrl();

      return res.redirect(url);

    } catch (error) {

      return res.status(500).json({
        sucesso: false,
        mensagem: error.message
      });

    }
  }

  async callback(req, res) {
    try {

      const { code } = req.query;

      if (!code) {
        return res.redirect(
          `${process.env.APP_URL}/login?erro=google_code`
        );
      }

      const dadosGoogle =
        await GoogleAuthService.obterDadosUsuario(code);

      const resultado =
        await AuthService.loginGoogle(dadosGoogle);

      const { usuario, token } = resultado;

      return res.redirect(
        `${process.env.APP_URL}/google/callback?token=${encodeURIComponent(token)}`
      );

    } catch (error) {

      console.error("Erro no callback Google:", error);

      return res.redirect(
        `${process.env.APP_URL}/login?erro=google`
      );
    }
  }
}

module.exports = new GoogleAuthController();