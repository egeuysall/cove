package websocket

import (
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// Allow connections from configured origins
		origin := r.Header.Get("Origin")
		return origin == "https://www.cove.egeuysal.com" ||
		       origin == "http://localhost:3000" ||
		       origin == "http://localhost:3001"
	},
}

// Handler handles WebSocket upgrade requests
type Handler struct {
	Hub *Hub
}

// NewHandler creates a new WebSocket handler
func NewHandler(hub *Hub) *Handler {
	return &Handler{
		Hub: hub,
	}
}

// ServeWs handles WebSocket requests from clients
func (h *Handler) ServeWs(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context (set by JWT middleware)
	userID, ok := r.Context().Value("userID").(string)
	if !ok || userID == "" {
		log.Printf("No user ID in context")
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Failed to upgrade connection: %v", err)
		return
	}

	client := &Client{
		Hub:      h.Hub,
		Conn:     conn,
		Send:     make(chan []byte, 256),
		UserID:   userID,
		GroupIDs: make(map[string]bool),
	}

	client.Hub.register <- client

	// Start goroutines for reading and writing
	go client.WritePump()
	go client.ReadPump()

	log.Printf("WebSocket connection established for user: %s", userID)
}
