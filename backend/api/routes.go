package api

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/cuturic01/eth-crawler/backend/domain"
	"github.com/cuturic01/eth-crawler/backend/eth"
	"github.com/cuturic01/eth-crawler/backend/storage"
	"github.com/gin-gonic/gin"
)

type Handler struct {
	ethClient *eth.Client
	cache     *storage.Cache
}

func InitRoutes(server *gin.Engine, ethClient *eth.Client, cache *storage.Cache) {
	handler := &Handler{ethClient: ethClient, cache: cache}
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

	key := fmt.Sprintf("txs:%s:%d:%d", strings.ToLower(addr), start, end)
	cctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	if raw, ok, err := handler.cache.Get(cctx, key); err == nil && ok {
		var cached domain.TxListResp
		if err := json.Unmarshal([]byte(raw), &cached); err == nil {
			paginateAndRespond(ctx, cached.Result, page, size)
			return
		}
	}

	resp, err := handler.ethClient.TxList(addr, start, end)
	if err != nil {
		ctx.JSON(http.StatusBadGateway, gin.H{"error": err.Error()})
		return
	}

	if b, err := json.Marshal(resp); err == nil {
		_ = handler.cache.Set(context.Background(), key, string(b), 5*time.Minute)
	}

	paginateAndRespond(ctx, resp.Result, page, size)
}

func paginateAndRespond(ctx *gin.Context, items []domain.TxListRow, page, size int) {
	total := len(items)
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
		"items":    items[startIdx:endIdx],
		"page":     page,
		"pageSize": size,
		"total":    total,
		"cached":   true,
	})
}

func (handler *Handler) GetBalanceAt(ctx *gin.Context) {
	addr := cleanAddr(ctx.Param("address"))
	dateStr := ctx.Query("date")
	token := strings.TrimSpace(ctx.DefaultQuery("token", "ETH"))

	if dateStr == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "missing ?date=YYYY-MM-DD"})
		return
	}

	t, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid date format"})
		return
	}
	utcMidnight := time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, time.UTC).Unix()

	blockNo, err := handler.ethClient.BlockNumberAtUTC(utcMidnight)
	if err != nil {
		ctx.JSON(http.StatusBadGateway, gin.H{"error": "getblocknobytime failed", "detail": err.Error()})
		return
	}

	ctx2, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if token == "" || strings.EqualFold(token, "ETH") {
		bal, err := handler.ethClient.ETHBalanceAtBlock(ctx2, addr, blockNo)
		if err != nil {
			ctx.JSON(http.StatusBadGateway, gin.H{"error": "eth_getBalance failed", "detail": err.Error()})
			return
		}
		ctx.JSON(http.StatusOK, gin.H{
			"address":     addr,
			"token":       "ETH",
			"dateUTC":     dateStr,
			"blockAtDate": blockNo,
			"balanceWei":  bal.String(),
		})
		return
	}

	bal, err := handler.ethClient.ERC20BalanceAtBlock(ctx2, token, addr, blockNo)
	if err != nil {
		ctx.JSON(http.StatusBadGateway, gin.H{"error": "eth_call(balanceOf) failed", "detail": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{
		"address":     addr,
		"token":       token,
		"dateUTC":     dateStr,
		"blockAtDate": blockNo,
		"balanceRaw":  bal.String(),
	})
}
