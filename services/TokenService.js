const jwt = require('jsonwebtoken');

class TokenService {

    gerar(payload) {

        return jwt.sign(
            payload,
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN
            }
        );
    }

    verificar(token) {

        return jwt.verify(
            token,
            process.env.JWT_SECRET
        );
    }

}

module.exports = new TokenService();