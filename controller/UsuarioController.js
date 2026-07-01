class UsuarioController{

    async index(req, res){
        res.send("APP EXPRESS! - Acessando a Home");
    }
    async create(req, res){
        console.log(req.body);
        res.send("APP EXPRESS! - Acessando a Home");
    }


}

module.exports = new UsuarioController();