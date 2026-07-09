const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  limit: 3,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // só conta login que FALHOU, não sucesso
  handler: (req, res) => {
    return res.status(429).json({
      sucesso: false,
      mensagem: "Você excedeu o número de tentativas de login. Tente novamente mais tarde.",
      tentativasRestantes: req.rateLimit?.remaining ?? null,
    });
  },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { loginLimiter, apiLimiter };