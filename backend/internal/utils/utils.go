package utils

import (
	"encoding/json"
	generated "github.com/egeuysall/cove/internal/supabase/generated"
	"log"
	"net/http"
)

var Queries *generated.Queries

func Init(q *generated.Queries) {
	Queries = q
}

func SendJson(w http.ResponseWriter, message interface{}, statusCode int) {
	w.WriteHeader(statusCode)

	response := map[string]interface{}{"data": message}
	err := json.NewEncoder(w).Encode(response)

	if err != nil {
		SendError(w, "Failed to encode JSON response", http.StatusInternalServerError)
	}
}

func SendError(w http.ResponseWriter, message string, statusCode int) {
	w.WriteHeader(statusCode)

	errorResponse := map[string]string{"error": message}
	err := json.NewEncoder(w).Encode(errorResponse)

	if err != nil {
		log.Printf("SendError encoding failed: %v", err)
	}
}
