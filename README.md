# Eth crawler

A tiny full-stack tool for exploring Ethereum balances and history.

## What it does

1. **Transactions since block**  
   For a given **address** and **starting block number**, list all transactions from that block up to the **current block**.

2. **Historical token balance**  
   For a given **address**, **UTC date (YYYY-MM-DD)**, and **token (symbol)**, show how much of that token the address held **at that date**.

## Tech stack

- **Backend:** Go (Gin)
- **Frontend:** React + TypeScript + MUI
- **Chain data:** Etherscan & Infura
- **Runtime:** Docker / Docker Compose

## Prerequisites

- Docker & Docker Compose installed
- Go (recomeded ersion 1.22.2)
- Node (recomended version 23.5.0)
- (Recommended) `make` available

## Run it (with make)

From the **project root**:

**Terminal 1**
```bash
docker compose up
```

**Terminal 2**
```bash
make backend
```

**Terminal 3**
```bash
make frontend
```

## Run it (directly)

From the **project root**:

**Terminal 1**
```bash
docker compose up
```

From eth-crawler/backend

**Terminal 2**
```bash
go run ./cmd/main.go
```

From eth-crawler/frontend

**Terminal 2**
```bash
npm run dev
```


Open the web app:  
**http://localhost:5173/**
