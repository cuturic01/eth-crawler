package api

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/cuturic01/eth-crawler/backend/eth"
	"github.com/gin-gonic/gin"
)

type Handler struct {
	ethClient *eth.Client
}

func InitRoutes(server *gin.Engine, ethClient *eth.Client) {
	handler := &Handler{ethClient: ethClient}
	routes := server.Group("/api")
	{
		routes.GET("/", handler.AddressMetaData)
		routes.GET("/:address", handler.GetTxs)
		routes.GET("/balance-at/:address", handler.GetBalanceAt)
	}
}

func (handler *Handler) AddressMetaData(ctx *gin.Context) {

}

func cleanAddr(a string) string { return strings.TrimSpace(a) }

func mustUint(q string, def uint64) uint64 {
	if q == "" {
		return def
	}
	v, err := strconv.ParseUint(q, 10, 64)
	if err != nil {
		return def
	}
	return v
}

func (handler *Handler) GetTxs(ctx *gin.Context) {
	addr := cleanAddr(ctx.Param("address"))
	start := mustUint(ctx.Query("startBlock"), 0)
	end := mustUint(ctx.Query("endBlock"), 99999999)
	page, _ := strconv.Atoi(ctx.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(ctx.DefaultQuery("pageSize", "50"))

	resp, err := handler.ethClient.TxList(addr, start, end)
	if err != nil {
		ctx.JSON(http.StatusBadGateway, gin.H{"error": err.Error()})
		return
	}

	total := len(resp.Result)
	if size <= 0 || size > 200 {
		size = 50
	}
	if page < 1 {
		page = 1
	}
	startIdx := (page - 1) * size
	if startIdx > total {
		startIdx = total
	}
	endIdx := startIdx + size
	if endIdx > total {
		endIdx = total
	}

	ctx.JSON(http.StatusOK, gin.H{
		"items":    resp.Result[startIdx:endIdx],
		"page":     page,
		"pageSize": size,
		"total":    total,
	})
}

func (handler *Handler) GetBalanceAt(ctx *gin.Context) {

}