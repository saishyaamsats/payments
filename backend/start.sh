#!/bin/bash

# Install Go dependencies
go mod tidy

# Build and run the Go server
go run main.go