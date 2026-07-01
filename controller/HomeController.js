class HomeController{

    async index(req, res){
        res.send("APP EXPRESS! - Acessando a Home");
    }

}

module.exports = new HomeController();