const TokenService = require('../services/TokenService');

module.exports = async (req, res, next) => {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            sucesso: false,
            mensagem: 'Token não informado'
        });
    }

    if (!authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            sucesso: false,
            mensagem: 'Formato do token inválido'
        });
    }

    const [, token] = authHeader.split(' ');

    try {

        const payload =
            TokenService.verificar(token);

        req.usuario = payload;

        next();

    } catch (error) {

        return res.status(401).json({
            sucesso: false,
            mensagem: 'Token inválido'
        });

    }
};
