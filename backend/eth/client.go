package eth

import (
	"context"
	"encoding/json"
	"fmt"
	"math/big"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/cuturic01/eth-crawler/backend/domain"
	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
)

type Client struct {
	apiKey string
	base   string
	http   *http.Client
	rpc    *ethclient.Client
}

func InitClient(apiKey string) *Client {
	rpc, err := ethclient.Dial("https://mainnet.infura.io/v3/d3d909553eb14d4b88fcf160d4a149bf")
	if err != nil {
		return nil
	}
	return &Client{
		apiKey: apiKey,
		base:   "https://api.etherscan.io/api",
		http:   &http.Client{Timeout: 25 * time.Second},
		rpc:    rpc,
	}
}

func (c *Client) call(params url.Values, out any) error {
	params.Set("apikey", c.apiKey)
	u := c.base + "?" + params.Encode()
	resp, err := c.http.Get(u)
	if err != nil { return err }
	defer resp.Body.Close()
	return json.NewDecoder(resp.Body).Decode(out)
}

func (c *Client) TxList(addr string, start, end uint64) (*domain.TxListResp, error) {
	v := url.Values{}
	v.Set("module", "account")
	v.Set("action", "txlist")
	v.Set("address", addr)
	v.Set("startblock", fmt.Sprintf("%d", start))
	v.Set("endblock", fmt.Sprintf("%d", end))
	v.Set("sort", "asc")
	var out domain.TxListResp
	if err := c.call(v, &out); err != nil { return nil, err }
	return &out, nil
}

type BlockByTimeResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
	Result  string `json:"result"`
}

func (c *Client) BlockNumberAtUTC(utcMidnight int64) (uint64, error) {
	v := url.Values{}
	v.Set("module", "block")
	v.Set("action", "getblocknobytime")
	v.Set("timestamp", fmt.Sprintf("%d", utcMidnight))
	v.Set("closest", "before")

	var out BlockByTimeResponse
	if err := c.call(v, &out); err != nil {
		return 0, err
	}
	if out.Status != "1" {
		return 0, fmt.Errorf("getblocknobytime: %s", out.Message)
	}
	var bn uint64
	if _, err := fmt.Sscan(out.Result, &bn); err != nil {
		return 0, fmt.Errorf("parse block number: %w", err)
	}
	return bn, nil
}

func (c *Client) ETHBalanceAtBlock(ctx context.Context, addr string, blockNo uint64) (*big.Int, error) {
	address := common.HexToAddress(addr)
	tag := new(big.Int).SetUint64(blockNo)
	return c.rpc.BalanceAt(ctx, address, tag)
}

func (c *Client) ERC20DecimalsAtBlock(ctx context.Context, tokenAddr string, blockNo uint64) (int, error) {
	const decimalsABI = `[{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"}]`

	parsed, err := abi.JSON(strings.NewReader(decimalsABI))
	if err != nil {
		return 0, err
	}
	data, err := parsed.Pack("decimals")
	if err != nil {
		return 0, err
	}
	call := ethereum.CallMsg{
		To:   func(a common.Address) *common.Address { return &a }(common.HexToAddress(tokenAddr)),
		Data: data,
	}
	tag := new(big.Int).SetUint64(blockNo)
	out, err := c.rpc.CallContract(ctx, call, tag)
	if err != nil {
		return 0, err
	}

	var u8 uint8
	if err := parsed.UnpackIntoInterface(&u8, "decimals", out); err == nil {
		return int(u8), nil
	}
	var u256 *big.Int
	if err := parsed.UnpackIntoInterface(&u256, "decimals", out); err == nil {
		return int(u256.Int64()), nil
	}
	bi := new(big.Int).SetBytes(out)
	if bi.Sign() > 0 {
		return int(bi.Int64()), nil
	}
	return 0, fmt.Errorf("unable to decode decimals")
}

func (c *Client) ERC20BalanceAtBlock(ctx context.Context, tokenAddr, holder string, blockNo uint64) (*big.Int, error) {
	const erc20ABI = `[{"constant":true,"inputs":[{"name":"account","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}]`

	parsed, err := abi.JSON(strings.NewReader(erc20ABI))
	if err != nil {
		return nil, err
	}

	data, err := parsed.Pack("balanceOf", common.HexToAddress(holder))
	if err != nil {
		return nil, err
	}

	call := ethereum.CallMsg{
		To:   func(a common.Address) *common.Address { return &a }(common.HexToAddress(tokenAddr)),
		Data: data,
	}

	tag := new(big.Int).SetUint64(blockNo)
	out, err := c.rpc.CallContract(ctx, call, tag)
	if err != nil {
		return nil, err
	}

	var balance = new(big.Int)
	err = parsed.UnpackIntoInterface(&balance, "balanceOf", out)
	if err != nil {
		balance.SetBytes(out)
	}
	return balance, nil
}
