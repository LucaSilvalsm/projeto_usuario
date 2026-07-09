const UsuarioService = require("../services/UsuarioService");

class UsuarioController {
  async index(req, res) {}

  async create(req, res) {
    try {
      // validando dados da requisição
      if (!req.body.nome || !req.body.email || !req.body.senha) {
        return res.status(400).json({
          sucesso: false,
          mensagem: "Nome, email e senha são obrigatórios.",
        });
      }
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

  async atualizarCargo(req, res) {
    
    if(req.body.cargo !== "Admin" && req.body.cargo !== "Cliente") {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Cargo inválido. Use 'Admin' ou 'Cliente'.",
      });
    }

    try {
      const usuario = await UsuarioService.atualizarCargo(
        req.params.id,
        req.body.cargo
      );

      return res.status(200).json({
        sucesso: true,
        mensagem: "Cargo atualizado com sucesso.",
        dados: usuario,
      });
    } catch (error) {
      return res.status(500).json({
        sucesso: false,
        mensagem: error.message,
      });
    }
  }
  async buscarPorId(req, res) {
    try {
      const usuario = await UsuarioService.buscarPorId(req.params.id);

      return res.status(200).json({
        sucesso: true,
        mensagem: "Usuário encontrado com sucesso.",
        dados: usuario,
      });
    } catch (error) {
      return res.status(404).json({
        sucesso: false,
        mensagem: error.message,
      });
    }
  }
  async deletar(req,res){
    try{
      const resultado = await UsuarioService.deletar(req.params.id);

      return res.status(200).json({
        sucesso: true,
        mensagem: resultado.mensagem,
      });
    } catch (error) {
      return res.status(404).json({
        sucesso: false,
        mensagem: error.message,
      });
    }
  }
}

module.exports = new UsuarioController();
