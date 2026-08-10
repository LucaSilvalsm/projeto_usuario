const GoogleAuthService = require("../services/GoogleAuthService");
const AuthService = require("../services/AuthService");

class GoogleAuthController {

    async login(req, res) {
        try {
            const url = GoogleAuthService.gerarUrl();

            return res.redirect(url);

        } catch (error) {
            return res.status(500).json({
                sucesso: false,
                mensagem: error.message
            });
        }
    }

    async callback(req, res) {
        try {

            const { code } = req.query;

            if (!code) {
                return res.status(400).json({
                    sucesso: false,
                    mensagem: "Código de autorização não informado."
                });
            }

            // Pega os dados do Google
            const dadosGoogle =
                await GoogleAuthService.obterDadosUsuario(code);

            // Cria/encontra usuário e gera JWT
            const resultado =
                await AuthService.loginGoogle(dadosGoogle);

            // Pega somente o token
            const { token } = resultado;

            // Redireciona para o Vue
            return res.redirect(
                `${process.env.APP_URL}/auth/google/callback?token=${token}`
            );

        } catch (error) {

            console.error(error);

            return res.redirect(
                `${process.env.APP_URL}/login?erro=google`
            );
        }
    }
}

module.exports = new GoogleAuthController();