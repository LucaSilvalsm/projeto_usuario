const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.HOST_EMAIL,
    port: Number(process.env.PORT_EMAIL),
    secure: false,
    requireTLS: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

class EmailService {

    async enviar(destinatario, assunto, html) {

        return await transporter.sendMail({
            from: `"Projeto Usuário" <${process.env.EMAIL_USER}>`,
            to: destinatario,
            subject: assunto,
            html
        });

    }

}

module.exports = new EmailService();