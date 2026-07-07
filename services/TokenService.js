const jwt = require("jsonwebtoken");
JWT_SECRET = process.env.JWT_SECRET;

class TokenService {
  gerar(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
  }

  verificar(token) {
   

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    console.log("Payload:", payload);

    return payload;
  }
}

module.exports = new TokenService();
