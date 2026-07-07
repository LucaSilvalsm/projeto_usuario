const bcrypt = require('bcrypt');
const UsuarioRepository = require('../repositories/UsuarioRepository');
const TokenService = require('./TokenService');

class AuthService {

    async login(email, senha) {

        const usuario =
            await UsuarioRepository.buscarPorEmail(email);

        if (!usuario) {
            throw new Error('Usuário não encontrado');
        }

        const senhaValida = await bcrypt.compare(
            senha,
            usuario.senha
        );

        if (!senhaValida) {
            throw new Error('Senha inválida');
        }

        const token = TokenService.gerar({
            id: usuario.id,
            email: usuario.email,
            cargo: usuario.cargo
        });
        console.log("TOKEN GERADO:", token);

        const { senha: _, ...usuarioSemSenha } = usuario;

        return {
            usuario: usuarioSemSenha,
            token
        };
    }
}

module.exports = new AuthService();
