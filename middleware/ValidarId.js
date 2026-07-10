// middleware/ValidarId.js
const validarId = module.exports = (req, res, next) => {
  const { id } = req.params;

  if (!/^\d+$/.test(id)) {
    return res.status(400).json({
      sucesso: false,
      mensagem: "ID inválido. Deve ser um número.",
    });
  }

  next();
};