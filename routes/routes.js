const express = require('express');
const routes = express.Router();
const authMiddleware = require('../middleware/AuthMiddleware');
const HomeController = require('../controller/HomeController');
const UsuarioController = require('../controller/UsuarioController');
const AuthController = require('../controller/AuthController');
const cargoMiddleware = require('../middleware/CargoMiddleware');

routes.get('/', HomeController.index);

routes.get('/users', authMiddleware,cargoMiddleware, UsuarioController.listarUsuarios);
routes.post('/users', UsuarioController.create);
routes.patch('/users/:id', authMiddleware,cargoMiddleware,  UsuarioController.atualizarCargo);


// Auth routes(Autenticação das rotas de login e logout)
routes.post('/auth/login', AuthController.login);



module.exports = routes;
