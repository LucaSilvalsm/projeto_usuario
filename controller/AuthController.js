const AuthService = require("../services/AuthService");
const UsuarioService = require("../services/UsuarioService");
const TokenSenhaRepository = require("../repositories/TokenSenhaRepository")
const bcrypt = require("bcrypt");

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
  async logout(req, res) {
    try {
        return res.status(200).json({
            sucesso: true,
            mensagem: "Logout realizado com sucesso."
        });
    } catch (error) {
        return res.status(500).json({
            sucesso: false,
            mensagem: error.message
        });
    }
}
  
}
module.exports = new AuthController();
