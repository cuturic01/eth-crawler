package bootstrap

import (
	"github.com/cuturic01/eth-crawler/backend/api"
	"github.com/cuturic01/eth-crawler/backend/eth"
	"github.com/gin-gonic/gin"
)
type App struct {
	HttpServer *gin.Engine
	EthClient *eth.Client
}

func Run() App {
	app := App{}
	app.EthClient = eth.InitClient("7B2FCSSWMFTC1BRFGKUX6A8MA1Z17CG9B4")
	app.HttpServer = api.InitHttpServer("8080", app.EthClient)
	return app
}