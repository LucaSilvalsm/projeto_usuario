const UsuarioRepository = require("../repositories/UsuarioRepository");

const cargoMiddleware = async (req, res, next) => {
    try {
        if (!req.usuario) {
            return res.status(401).json({
                sucesso: false,
                mensagem: "Usuário não autenticado."
            });
        }

        const usuario = await UsuarioRepository.buscarPorId(req.usuario.id);

        if (!usuario) {
            return res.status(401).json({
                sucesso: false,
                mensagem: "Usuário não encontrado."
            });
        }

        if (usuario.cargo !== "Admin") {
            return res.status(403).json({
                sucesso: false,
                mensagem: "Acesso não autorizado."
            });
        }

        req.usuarioBanco = usuario;

        next();

    } catch (error) {
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro ao verificar autorização."
        });
    }
};

module.exports = cargoMiddleware;