const UsuarioRepository = require("../repositories/UsuarioRepository");
const bcrypt = require("bcrypt");

class UsuarioService {
  async listar() {
    return await UsuarioRepository.buscarTodos();
  }

  async criar(dados) {
    const existe = await UsuarioRepository.buscarPorEmail(dados.email);

    if (existe) {
      throw new Error("Usuário já existe");
    }

    const senhaHash = await bcrypt.hash(dados.senha, 10);

    const usuario = await UsuarioRepository.criar({
      nome: dados.nome,
      sobrenome: dados.sobrenome,
      email: dados.email,
      senha: senhaHash,
      cargo: "Cliente", // sempre fixo aqui, nunca vindo de dados.cargo
    });

    delete usuario.senha;

    return usuario;
  }
  async buscarPorId(id) {
    const usuario = await UsuarioRepository.buscarPorId(id);

    if (!usuario) {
      throw new Error("Usuário não encontrado.");
    }
    const { senha: _, ...usuarioSemSenha } = usuario;
    return usuarioSemSenha;
  }
  async atualizarCargo(id, cargo) {
    const usuario = await UsuarioRepository.buscarPorId(id);

    if (!usuario) {
      throw new Error("Usuário não encontrado.");
    }

    const usuarioAtualizado = await UsuarioRepository.atualizarCargo(id, cargo);

    delete usuarioAtualizado.senha;

    return usuarioAtualizado;
  }
  async deletar(id) {
    const usuario = await UsuarioRepository.buscarPorId(id);
    if (!usuario) {
      throw new Error("Usuário não encontrado.");
    }

    await UsuarioRepository.deletar(id);

    return { mensagem: "Usuário deletado com sucesso." };
  }
  async buscarPorEmail(email) {
    const usuario = await UsuarioRepository.buscarPorEmail(email);

    if (!usuario) {
      throw new Error("Usuário não encontrado.");
    }

    const { senha: _, ...usuarioSemSenha } = usuario;
    return usuarioSemSenha;
  }
  async atualizarSenha(id, novaSenha) {
    const usuario = await UsuarioRepository.buscarPorId(id);

    if (!usuario) {
      throw new Error("Usuário não encontrado.");
    }

    const senhaIgual = await bcrypt.compare(novaSenha, usuario.senha);

    if (senhaIgual) {
      throw new Error("A nova senha não pode ser igual às senhas anteriores.");
    }

    const senhaHash = await bcrypt.hash(novaSenha, 10);

    const usuarioAtualizado = await UsuarioRepository.atualizarSenha(
      id,
      senhaHash,
    );

    delete usuarioAtualizado.senha;

    return usuarioAtualizado;
  }
}

module.exports = new UsuarioService();
