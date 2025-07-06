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

type InviteResponse struct {
	Code      string    `json:"code"`
	GroupID   string    `json:"group_id"`
	UsedBy    string    `json:"used_by,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

type CreateLinkRequest struct {
	GroupID string `json:"group_id"`
	URL     string `json:"url"`
	Title   string `json:"title,omitempty"`
	Comment string `json:"comment,omitempty"`
}

type UpdateLinkCommentRequest struct {
	Comment string `json:"comment"`
}

type LinkResponse struct {
	ID        string    `json:"id"`
	GroupID   string    `json:"group_id"`
	UserID    string    `json:"user_id"`
	URL       string    `json:"url"`
	Title     string    `json:"title,omitempty"`
	Comment   string    `json:"comment,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}
