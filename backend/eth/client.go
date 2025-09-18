package eth

import (
	"github.com/cuturic01/eth-crawler/backend/domain"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"time"
)

type Client struct {
	apiKey string
	base   string
	http   *http.Client
}

func InitClient(apiKey string) *Client {
	return &Client{
		apiKey: apiKey,
		base:   "https://api.etherscan.io/api",
		http:   &http.Client{Timeout: 25 * time.Second},
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

func (c *Client) BlockByTime(ts int64, closest string) (*domain.BlockByTimeResp, error) {
	v := url.Values{}
	v.Set("module", "block")
	v.Set("action", "getblocknobytime")
	v.Set("timestamp", fmt.Sprintf("%d", ts))
	v.Set("closest", closest)
	var out domain.BlockByTimeResp
	if err := c.call(v, &out); err != nil { return nil, err }
	return &out, nil
}
