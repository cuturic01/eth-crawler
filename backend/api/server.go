package api

import (
	"time"

	"github.com/cuturic01/eth-crawler/backend/eth"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func InitHttpServer(httpPort string, ethClient *eth.Client) *gin.Engine {
	httpServer := gin.Default()
	httpServer.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"}, 
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))
	InitRoutes(httpServer, ethClient)
	go func() {
		if err := httpServer.Run(":" + httpPort); err != nil {
			panic(err)
		}
	}()
	return httpServer
}
