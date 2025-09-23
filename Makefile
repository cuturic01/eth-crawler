.PHONY: backend frontend

backend:
	cd backend && go run ./cmd/main.go

frontend:
	cd frontend && npm run dev