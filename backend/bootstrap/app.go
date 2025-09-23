package bootstrap

import (
	"github.com/cuturic01/eth-crawler/backend/api"
	"github.com/cuturic01/eth-crawler/backend/eth"
	"github.com/cuturic01/eth-crawler/backend/storage"
	"github.com/gin-gonic/gin"
)

type App struct {
	Cache      *storage.Cache
	EthClient  *eth.Client
	HttpServer *gin.Engine
}

func Run() App {
	app := App{}
	app.Cache = storage.InitCache("redis://localhost:6379/0")
	app.EthClient = eth.InitClient("7B2FCSSWMFTC1BRFGKUX6A8MA1Z17CG9B4")
	app.HttpServer = api.InitHttpServer("8080", app.EthClient, app.Cache)
	return app
}
