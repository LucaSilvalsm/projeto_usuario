const express = require('express');
const routes = express.Router();
const HomeController = require('../controller/HomeController');
const UsuarioController = require('../controller/UsuarioController');

routes.get('/', HomeController.index);
routes.get('/users', UsuarioController.index);
routes.post('/users', UsuarioController.create);

module.exports = routes;