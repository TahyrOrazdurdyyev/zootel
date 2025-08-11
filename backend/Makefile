# Zootel Backend Makefile

.PHONY: build run trial-checker clean help

# Build main application
build:
	go build -o zootel ./cmd/main.go

# Run main application
run:
	go run ./cmd/main.go

# Build and run trial checker
trial-checker:
	go build -o trial-checker.exe ./cmd/trial-checker
	./trial-checker.exe

# Build trial checker only
build-trial-checker:
	go build -o trial-checker.exe ./cmd/trial-checker

# Run trial checker
run-trial-checker:
	go run ./cmd/trial-checker/main.go

# Clean build artifacts
clean:
	rm -f zootel trial-checker.exe

# Install dependencies
deps:
	go mod tidy
	go mod download

# Run tests
test:
	go test ./...

# Run linter
lint:
	golangci-lint run

# Database migrations
migrate-up:
	migrate -path ./migrations -database "${DATABASE_URL}" up

migrate-down:
	migrate -path ./migrations -database "${DATABASE_URL}" down

# Help
help:
	@echo "Available targets:"
	@echo "  build              - Build main application"
	@echo "  run                - Run main application"
	@echo "  trial-checker      - Build and run trial checker"
	@echo "  build-trial-checker - Build trial checker only"
	@echo "  run-trial-checker  - Run trial checker without building"
	@echo "  clean              - Clean build artifacts"
	@echo "  deps               - Install dependencies"
	@echo "  test               - Run tests"
	@echo "  lint               - Run linter"
	@echo "  migrate-up         - Run database migrations up"
	@echo "  migrate-down       - Run database migrations down"
	@echo "  help               - Show this help" 