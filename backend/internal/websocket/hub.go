package websocket

import (
	"encoding/json"
	"log"
	"sync"

	"github.com/gorilla/websocket"
)

// Client represents a WebSocket client connection
type Client struct {
	Hub      *Hub
	Conn     *websocket.Conn
	Send     chan []byte
	UserID   string
	GroupIDs map[string]bool // Set of group IDs this client is subscribed to
	mu       sync.RWMutex
}

// Hub maintains active clients and broadcasts messages to them
type Hub struct {
	// Registered clients by user ID
	clients map[string]*Client

	// Register requests from clients
	register chan *Client

	// Unregister requests from clients
	unregister chan *Client

	// Broadcast message to all clients in a group
	broadcast chan *BroadcastMessage

	mu sync.RWMutex
}

// BroadcastMessage contains a message and the group ID to broadcast to
type BroadcastMessage struct {
	GroupID string
	Message []byte
}

// NewHub creates a new Hub instance
func NewHub() *Hub {
	return &Hub{
		clients:    make(map[string]*Client),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan *BroadcastMessage, 256),
	}
}

// Run starts the hub's main loop
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client.UserID] = client
			h.mu.Unlock()
			log.Printf("Client registered: %s", client.UserID)

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client.UserID]; ok {
				delete(h.clients, client.UserID)
				close(client.Send)
				log.Printf("Client unregistered: %s", client.UserID)
			}
			h.mu.Unlock()

		case message := <-h.broadcast:
			h.mu.RLock()
			for _, client := range h.clients {
				client.mu.RLock()
				isSubscribed := client.GroupIDs[message.GroupID]
				client.mu.RUnlock()

				if isSubscribed {
					select {
					case client.Send <- message.Message:
					default:
						// Client's send channel is full, close the connection
						h.mu.RUnlock()
						h.mu.Lock()
						close(client.Send)
						delete(h.clients, client.UserID)
						h.mu.Unlock()
						h.mu.RLock()
					}
				}
			}
			h.mu.RUnlock()
		}
	}
}

// BroadcastToGroup sends a message to all clients subscribed to a group
func (h *Hub) BroadcastToGroup(groupID string, messageType string, data interface{}) {
	message := map[string]interface{}{
		"type": messageType,
		"data": data,
	}

	messageBytes, err := json.Marshal(message)
	if err != nil {
		log.Printf("Error marshaling broadcast message: %v", err)
		return
	}

	h.broadcast <- &BroadcastMessage{
		GroupID: groupID,
		Message: messageBytes,
	}
}

// SubscribeToGroup adds a group ID to the client's subscription list
func (c *Client) SubscribeToGroup(groupID string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.GroupIDs[groupID] = true
	log.Printf("Client %s subscribed to group %s", c.UserID, groupID)
}

// UnsubscribeFromGroup removes a group ID from the client's subscription list
func (c *Client) UnsubscribeFromGroup(groupID string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	delete(c.GroupIDs, groupID)
	log.Printf("Client %s unsubscribed from group %s", c.UserID, groupID)
}

// ReadPump pumps messages from the WebSocket connection to the hub
func (c *Client) ReadPump() {
	defer func() {
		c.Hub.unregister <- c
		c.Conn.Close()
	}()

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		// Handle incoming messages (e.g., subscribe/unsubscribe)
		var msg map[string]interface{}
		if err := json.Unmarshal(message, &msg); err != nil {
			log.Printf("Error unmarshaling message: %v", err)
			continue
		}

		msgType, ok := msg["type"].(string)
		if !ok {
			continue
		}

		switch msgType {
		case "subscribe":
			if groupID, ok := msg["groupId"].(string); ok {
				c.SubscribeToGroup(groupID)
			}
		case "unsubscribe":
			if groupID, ok := msg["groupId"].(string); ok {
				c.UnsubscribeFromGroup(groupID)
			}
		}
	}
}

// WritePump pumps messages from the hub to the WebSocket connection
func (c *Client) WritePump() {
	defer func() {
		c.Conn.Close()
	}()

	for message := range c.Send {
		if err := c.Conn.WriteMessage(websocket.TextMessage, message); err != nil {
			log.Printf("Error writing message: %v", err)
			return
		}
	}
}
