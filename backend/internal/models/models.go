package models

import "time"

type Group struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at,omitempty"`
	CreatedBy string    `json:"created_by,omitempty"`
}

type User struct {
	UserId string `json:"user_id"`
}

type CreateInviteRequest struct {
	GroupID string `json:"group_id"`
}

// InviteResponse is the response structure for invite data
type InviteResponse struct {
	Code      string    `json:"code"`
	GroupID   string    `json:"group_id"`
	UsedBy    string    `json:"used_by,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}
