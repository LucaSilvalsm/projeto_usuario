const { google } = require("googleapis");

class GoogleAuthService {

  constructor() {

    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_CALLBACK_URL
    );

  }

  gerarUrl() {

    return this.oauth2Client.generateAuthUrl({
      access_type: "offline",

      scope: [
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile"
      ],

      prompt: "consent"
    });

  }

  async obterDadosUsuario(code) {

    const { tokens } =
      await this.oauth2Client.getToken(code);

    this.oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({
      auth: this.oauth2Client,
      version: "v2"
    });

    const { data } =
      await oauth2.userinfo.get();

    return data;

  }

}

module.exports = new GoogleAuthService();