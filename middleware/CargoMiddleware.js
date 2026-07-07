const UsuarioService = require("../services/UsuarioService");

const cargoMiddleware = (req, res, next) => {

    if (!req.usuario) {
        return res.status(401).json({
            sucesso: false,
            mensagem: "Usuário não autenticado."
        });
    }

    if (req.usuario.cargo !== "Admin") {
        return res.status(403).json({
            sucesso: false,
            mensagem: "Apenas administradores podem acessar esta rota."
        });
    }

    next();
};

module.exports = cargoMiddleware;