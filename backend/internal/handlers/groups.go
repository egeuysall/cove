package handlers

import (
	"encoding/json"
	"errors"
	"github.com/egeuysall/cove/internal/middleware"
	"github.com/egeuysall/cove/internal/models"
	supabase "github.com/egeuysall/cove/internal/supabase/generated"
	"github.com/egeuysall/cove/internal/utils"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"net/http"
)

func HandleCreateGroup(w http.ResponseWriter, r *http.Request) {
	var req models.Group
	err := json.NewDecoder(r.Body).Decode(&req)

	if err != nil {
		utils.SendError(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if req.Name == "" {
		utils.SendError(w, "Name is required", http.StatusBadRequest)
		return
	}

	userIdStr, ok := middleware.UserIDFromContext(r.Context())

	if !ok {
		utils.SendError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var userId pgtype.UUID
	err = userId.Scan(userIdStr)

	if err != nil {
		utils.SendError(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	createParams := supabase.CreateGroupParams{
		Name:      req.Name,
		CreatedBy: userId,
	}
	group, err := utils.Queries.CreateGroup(r.Context(), createParams)

	if err != nil {
		utils.SendError(w, "Error creating group", http.StatusBadRequest)
		return
	}

	addParams := supabase.AddUserToGroupParams{
		UserID:  userId,
		GroupID: group.ID,
	}
	err = utils.Queries.AddUserToGroup(r.Context(), addParams)

	if err != nil {
		utils.SendError(w, "Failed to add user as group member", http.StatusInternalServerError)
		return
	}

	utils.SendJson(w, group, http.StatusCreated)
}

func HandleGetGroupsByUser(w http.ResponseWriter, r *http.Request) {
	userIdStr, ok := middleware.UserIDFromContext(r.Context())

	if !ok {
		utils.SendError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var userId pgtype.UUID
	err := userId.Scan(userIdStr)

	if err != nil {
		utils.SendError(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	groups, err := utils.Queries.GetGroupsByUser(r.Context(), userId)
	if err != nil {
		utils.SendError(w, "Failed to get groups", http.StatusInternalServerError)
		return
	}

	utils.SendJson(w, groups, http.StatusOK)
}

func HandleGetGroupById(w http.ResponseWriter, r *http.Request) {
	groupIdStr := chi.URLParam(r, "id")

	if groupIdStr == "" {
		utils.SendError(w, "Missing groupId parameter", http.StatusBadRequest)
		return
	}

	var groupId pgtype.UUID

	err := groupId.Scan(groupIdStr)

	if err != nil {
		utils.SendError(w, "Invalid groupId format", http.StatusBadRequest)
		return
	}

	_, ok := middleware.UserIDFromContext(r.Context())

	if !ok {
		utils.SendError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	group, err := utils.Queries.GetGroupByID(r.Context(), groupId)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			utils.SendError(w, "Group not found", http.StatusNotFound)
			return
		}

		utils.SendError(w, "Failed to get group", http.StatusInternalServerError)
		return
	}

	utils.SendJson(w, group, http.StatusOK)
}

func HandleDeleteGroup(w http.ResponseWriter, r *http.Request) {

}

func HandleAddUserToGroup(w http.ResponseWriter, r *http.Request) {

}

func HandleGetGroupMembers(w http.ResponseWriter, r *http.Request) {

}
