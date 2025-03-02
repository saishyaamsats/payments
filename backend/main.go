package main

import (
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"time"

	"github.com/gorilla/mux"
	"github.com/rs/cors"
)

// PaymentRequest represents the payment data sent from the frontend
type PaymentRequest struct {
	Method      string  `json:"method"`
	Amount      float64 `json:"amount"`
	UpiId       string  `json:"upiId,omitempty"`
	AccountNum  string  `json:"accountNumber,omitempty"`
	IfscCode    string  `json:"ifscCode,omitempty"`
	AccountName string  `json:"accountName,omitempty"`
	CardNumber  string  `json:"cardNumber,omitempty"`
	ExpiryDate  string  `json:"expiryDate,omitempty"`
	NameOnCard  string  `json:"nameOnCard,omitempty"`
}

// PaymentResponse is the response sent back to the frontend
type PaymentResponse struct {
	Success  bool   `json:"success"`
	OrderID  string `json:"orderId,omitempty"`
	Message  string `json:"message,omitempty"`
	ErrorMsg string `json:"error,omitempty"`
}

// generateOrderID creates a random order ID
func generateOrderID() string {
	const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
	result := make([]byte, 16)
	for i := range result {
		result[i] = chars[rand.Intn(len(chars))]
	}
	return string(result)
}

// processLocalPayment handles local payment processing
func processLocalPayment(w http.ResponseWriter, r *http.Request) {
	// Set headers
	w.Header().Set("Content-Type", "application/json")

	// Parse request body
	var paymentReq PaymentRequest
	err := json.NewDecoder(r.Body).Decode(&paymentReq)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(PaymentResponse{
			Success:  false,
			ErrorMsg: "Invalid request format",
		})
		return
	}

	// Simulate payment processing delay
	time.Sleep(1500 * time.Millisecond)

	// Validate payment details based on method
	var validationError string
	switch paymentReq.Method {
	case "upi":
		if paymentReq.UpiId == "" {
			validationError = "UPI ID is required"
		}
	case "bank":
		if paymentReq.AccountNum == "" || paymentReq.IfscCode == "" || paymentReq.AccountName == "" {
			validationError = "All bank details are required"
		}
	case "card":
		if paymentReq.CardNumber == "" || paymentReq.ExpiryDate == "" || paymentReq.NameOnCard == "" {
			validationError = "All card details are required"
		}
	default:
		validationError = "Invalid payment method"
	}

	if validationError != "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(PaymentResponse{
			Success:  false,
			ErrorMsg: validationError,
		})
		return
	}

	// Generate order ID for successful payment
	orderID := generateOrderID()

	// Return success response
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(PaymentResponse{
		Success: true,
		OrderID: orderID,
		Message: fmt.Sprintf("Payment successful via %s", paymentReq.Method),
	})
}

func main() {
	// Initialize random seed
	rand.Seed(time.Now().UnixNano())

	// Create router
	r := mux.NewRouter()

	// Define routes
	r.HandleFunc("/api/local-payment", processLocalPayment).Methods("POST")

	// Add health check endpoint
	r.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Server is running"))
	}).Methods("GET")

	// Configure CORS
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173", "http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	})
	handler := c.Handler(r)

	// Start server
	port := "8080"
	fmt.Printf("Server starting on port %s...\n", port)
	log.Fatal(http.ListenAndServe(":"+port, handler))
}