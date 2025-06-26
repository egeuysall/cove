package main

import (
	"fmt"
	"github.com/egeuysall/cove/internal/utils"
	"log"
	"net/http"
	"os"

	"github.com/egeuysall/cove/internal/api"
	supabase "github.com/egeuysall/cove/internal/supabase"
	generated "github.com/egeuysall/cove/internal/supabase/generated"
	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading environment")
	}

	dbConn := supabase.Connect()
	defer dbConn.Close()

	queries := generated.New(dbConn)

	utils.Init(queries)

	router := api.Router()

	portStr := os.Getenv("PORT")

	if portStr == "" {
		log.Fatal("PORT not set in environment")
	}

	addr := fmt.Sprintf(":%s", portStr)

	log.Printf("Server starting on https://presentapi.egeuysal.com")
	err = http.ListenAndServe(addr, router)

	if err != nil {
		log.Fatal(err)
	}
}
