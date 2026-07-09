const AuthService = require("../services/AuthService");

class AuthController {
  async login(req, res) {
    try {
      const { email, senha } = req.body;

      const resultado = await AuthService.login(email, senha);

      return res.status(200).json({
        sucesso: true,
        mensagem: "Login realizado com sucesso.",
        dados: resultado,
      });
    } catch (error) {
      const restantes = req.rateLimit?.remaining ?? null;

      let mensagem = error.message;
      if (restantes !== null) {
        mensagem +=
          restantes === 1
            ? " Resta mais 1 tentativa."
            : ` Restam mais ${restantes} tentativas.`;
      }

      return res.status(401).json({
        sucesso: false,
        mensagem,
        tentativasRestantes: restantes,
      });
    }
  }
}
module.exports = new AuthController();
