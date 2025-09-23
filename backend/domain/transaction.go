package domain

type TxListResp struct {
	Status  string      `json:"status"`
	Message string      `json:"message"`
	Result  []TxListRow `json:"result"`
}
type TxListRow struct {
	Hash          string `json:"hash"`
	BlockNumber   string `json:"blockNumber"`
	TimeStamp     string `json:"timeStamp"`
	From          string `json:"from"`
	To            string `json:"to"`
	Value         string `json:"value"`
	GasPrice      string `json:"gasPrice"`
	GasUsed       string `json:"gasUsed"`
	TransactionIndex string `json:"transactionIndex"`
}

type BlockByTimeResp struct {
	Status  string `json:"status"`
	Message string `json:"message"`
	Result  string `json:"result"`
}
