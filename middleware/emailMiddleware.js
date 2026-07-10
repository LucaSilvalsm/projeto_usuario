const emailMiddleware = (req, res, next) => {

    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            sucesso: false,
            mensagem: "O e-mail é obrigatório."
        });
    }

    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!regexEmail.test(email)) {
        return res.status(400).json({
            sucesso: false,
            mensagem: "E-mail inválido."
        });
    }

    next();
};

module.exports = emailMiddleware;