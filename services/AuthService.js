const bcrypt = require("bcrypt");
const crypto = require("crypto");

const UsuarioRepository = require("../repositories/UsuarioRepository");
const TokenService = require("./TokenService");

class AuthService {
  // Login tradicional
  async login(email, senha) {
    const usuario = await UsuarioRepository.buscarPorEmail(email);

    if (!usuario) {
      throw new Error("Usuário não encontrado");
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);

    if (!senhaValida) {
      throw new Error("Senha inválida");
    }

    const token = TokenService.gerar({
      id: usuario.id,
      email: usuario.email,
      cargo: usuario.cargo,
    });

    

    const { senha: _, ...usuarioSemSenha } = usuario;

    return {
      usuario: usuarioSemSenha,
      token,
    };
  }

  // Login utilizando Google
  async loginGoogle(dadosGoogle) {
    const { email, given_name, family_name } = dadosGoogle;

    if (!email) {
      throw new Error("Google não forneceu um e-mail.");
    }

    // Verifica se o usuário já existe
    let usuario = await UsuarioRepository.buscarPorEmail(email);

    // Se não existir, cria
    if (!usuario) {
      const senhaTemporaria = await bcrypt.hash(crypto.randomUUID(), 10);

      usuario = await UsuarioRepository.criar({
        nome: given_name || "Usuário",
        sobrenome: family_name || "",
        email,
        senha: senhaTemporaria,
        cargo: "Cliente",
      });
    }

    // Gera o JWT da sua API
    const token = TokenService.gerar({
      id: usuario.id,
      email: usuario.email,
      cargo: usuario.cargo,
    });

    
    // Dados públicos do usuário
    const usuarioSemSenha = {
      id: usuario.id,
      nome: usuario.nome,
      sobrenome: usuario.sobrenome,
      email: usuario.email,
      cargo: usuario.cargo,
    };

    return {
      usuario: usuarioSemSenha,
      token,
    };
  }
}

module.exports = new AuthService();
