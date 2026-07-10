const express = require("express");
const routes = express.Router();

const authMiddleware = require("../middleware/AuthMiddleware");
const cargoMiddleware = require("../middleware/CargoMiddleware");
const validarId = require("../middleware/ValidarId.js");
const { loginLimiter, apiLimiter } = require("../middleware/Ratelimite.js");

const HomeController = require("../controller/HomeController");
const UsuarioController = require("../controller/UsuarioController");
const AuthController = require("../controller/AuthController");
const RecuperaSenhaController = require("../controller/RecuperaSenhaController");
const emailMiddleware = require("../middleware/emailMiddleware")

// Middleware global para todas as rotas
routes.use(apiLimiter);

// Rotas principais
routes.get("/", HomeController.index);

// Rotas de usuários Rotas de autenticação
routes.get( "/users",authMiddleware,cargoMiddleware,UsuarioController.listarUsuarios);
routes.post("/users", UsuarioController.create);
routes.get(  "/users/:id", authMiddleware,cargoMiddleware,validarId,UsuarioController.buscarPorId);
routes.patch("/users/:id",authMiddleware,cargoMiddleware,validarId,UsuarioController.atualizarCargo);
routes.delete("/users/:id",authMiddleware,cargoMiddleware,validarId,UsuarioController.deletar);

// Rotas de autenticação
// Auth routes (Autenticação das rotas de login e logout)
routes.post("/auth/login", loginLimiter, AuthController.login);


// Rotas de recuperação de senha
routes.post("/recuperacao-senha", emailMiddleware, RecuperaSenhaController.criar);

module.exports = routes;
