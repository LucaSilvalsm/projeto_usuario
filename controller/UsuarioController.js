const UsuarioService = require("../services/UsuarioService");

class UsuarioController {
  async index(req, res) {



  }

  async create(req, res) {
    try {
      const usuario = await UsuarioService.criar(req.body);

      return res.status(201).json({
        sucesso: true,
        mensagem: "Usuário criado com sucesso.",
        dados: usuario,
      });
    } catch (error) {
      return res.status(400).json({
        sucesso: false,
        mensagem: error.message,
      });
    }
  }

  async listarUsuarios(req, res) {
    try {
      const usuarios = await UsuarioService.listar();

      return res.status(200).json({
        sucesso: true,
        mensagem: "Usuários listados com sucesso.",
        dados: usuarios,
      });
    } catch (error) {
      return res.status(500).json({
        sucesso: false,
        mensagem: error.message,
      });
    }
  }
}

module.exports = new UsuarioController();
