package handlers

import (
	"github.com/egeuysall/cove/internal/utils"
	"net/http"
)

func HandleRoot(w http.ResponseWriter, r *http.Request) {
	utils.SendJson(w, "Welcome to the Cove API. Cove is a private, minimalist feed for sharing cool links with close friends. Create small groups, post interesting finds, and keep it all lightweight, personal, and distraction-free.", http.StatusOK)
}

func HandlePing(w http.ResponseWriter, r *http.Request) {
	utils.SendJson(w, "Pong", http.StatusOK)
}
