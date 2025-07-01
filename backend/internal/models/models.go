package models

import "time"

type Group struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at,omitempty"`
	CreatedBy string    `json:"created_by,omitempty"`
}
