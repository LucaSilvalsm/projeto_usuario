require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
const conectar = require("./database/database");
const routes = require("./routes/routes");


// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas
app.use("/", routes);

app.get("/", (req, res) => {
  res.send("Hello World!");
});
// conecntando o email


// Conexão com o banco de dados
conectar
  .raw("SELECT 1")
  .then(() => {
    console.log("✅ Conexão com PostgreSQL estabelecida");

    app.listen(port, () => {
      console.log(`🚀 Servidor rodando na porta ${port}`);
    });
  })
  .catch((err) => {
    console.error("❌ Erro ao conectar ao banco:", err);
  });
