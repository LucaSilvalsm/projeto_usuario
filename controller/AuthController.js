const AuthService = require('../services/AuthService');

class AuthController {

    async login(req, res) {

        try {

            const { email, senha } = req.body;

            const resultado =
                await AuthService.login(
                    email,
                    senha
                );

            return res.status(200).json({
                sucesso: true,
                mensagem: 'Login realizado com sucesso.',
                dados: resultado
            });

        } catch (error) {

            return res.status(401).json({
                sucesso: false,
                mensagem: error.message
            });

        }

    }

}

module.exports = new AuthController();