const express = require('express');
const routes = express.Router();

const HomeController = require('../controller/HomeController');
const UsuarioController = require('../controller/UsuarioController');
const AuthController = require('../controller/AuthController');

routes.get('/', HomeController.index);

routes.get('/users', UsuarioController.listarUsuarios);
routes.post('/users', UsuarioController.create);


// Auth routes(Autenticação das rotas de login e logout)
routes.post('/auth/login', AuthController.login);



module.exports = routes;
