const RecuperacaoSenhaService = require("../services/RecuperacaoSenhaService");
class RecuperaSenhaController {

    async criar(req, res) {

        try {

            const token = await RecuperacaoSenhaService.criar(req.body.email);

            return res.status(200).json({
                sucesso: true,
                mensagem: "Token gerado com sucesso.",
                dados: token
            });

        } catch (error) {

            return res.status(400).json({
                sucesso: false,
                mensagem: error.message
            });

        }

    }

}

module.exports = new RecuperaSenhaController();