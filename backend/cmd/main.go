package main

import (
	"github.com/cuturic01/eth-crawler/backend/bootstrap"
)

func main() {
	_ = bootstrap.Run()

	select {}
}
