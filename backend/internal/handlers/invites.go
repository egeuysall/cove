package handlers

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"net/http"

	"github.com/egeuysall/cove/internal/middleware"
	"github.com/egeuysall/cove/internal/models"
	supabase "github.com/egeuysall/cove/internal/supabase/generated"
	"github.com/egeuysall/cove/internal/utils"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
)

func HandleCreateInvite(w http.ResponseWriter, r *http.Request) {
	var req models.CreateInviteRequest
	err := json.NewDecoder(r.Body).Decode(&req)

	if err != nil {
		utils.SendError(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if req.GroupID == "" {
		utils.SendError(w, "Group ID is required", http.StatusBadRequest)
		return
	}

	userIdStr, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		utils.SendError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	userId, err := utils.ParseUUID(userIdStr)
	if err != nil {
		utils.SendError(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	groupId, err := utils.ParseUUID(req.GroupID)
	if err != nil {
		utils.SendError(w, "Invalid group ID", http.StatusBadRequest)
		return
	}

	inGroupParams := supabase.IsUserInGroupParams{
		GroupID: groupId,
		UserID:  userId,
	}

	isMember, err := utils.Queries.IsUserInGroup(r.Context(), inGroupParams)
	if err != nil {
		utils.SendError(w, "Error checking group membership", http.StatusInternalServerError)
		return
	}
	if !isMember {
		utils.SendError(w, "Not authorized to create invites for this group", http.StatusForbidden)
		return
	}

	b := make([]byte, 8)
	_, err = rand.Read(b)
	if err != nil {
		utils.SendError(w, "Failed to generate invite code", http.StatusInternalServerError)
		return
	}

	code := base64.RawURLEncoding.EncodeToString(b)[:10]

	createParams := supabase.CreateInviteParams{
		Code:    code,
		GroupID: groupId,
	}

	invite, err := utils.Queries.CreateInvite(r.Context(), createParams)
	if err != nil {
		utils.SendError(w, "Error creating invite", http.StatusInternalServerError)
		return
	}

	response := models.InviteResponse{
		Code:      invite.Code,
		GroupID:   utils.UUIDToString(invite.GroupID),
		CreatedAt: invite.CreatedAt.Time,
	}

	utils.SendJson(w, response, http.StatusCreated)
}

func HandleGetInviteByCode(w http.ResponseWriter, r *http.Request) {
	code := chi.URLParam(r, "code")
	if code == "" {
		utils.SendError(w, "Missing invite code parameter", http.StatusBadRequest)
		return
	}

	invite, err := utils.Queries.GetInviteByCode(r.Context(), code)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			utils.SendError(w, "Invite not found", http.StatusNotFound)
			return
		}
		utils.SendError(w, "Failed to get invite", http.StatusInternalServerError)
		return
	}

	if invite.UsedBy.Valid {
		utils.SendError(w, "Invite has already been used", http.StatusBadRequest)
		return
	}

	response := models.InviteResponse{
		Code:      invite.Code,
		GroupID:   utils.UUIDToString(invite.GroupID),
		CreatedAt: invite.CreatedAt.Time,
	}

	utils.SendJson(w, response, http.StatusOK)
}

func HandleAcceptInviteByCode(w http.ResponseWriter, r *http.Request) {
	code := chi.URLParam(r, "code")
	if code == "" {
		utils.SendError(w, "Missing invite code parameter", http.StatusBadRequest)
		return
	}

	userIdStr, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		utils.SendError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	userId, err := utils.ParseUUID(userIdStr)
	if err != nil {
		utils.SendError(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	invite, err := utils.Queries.GetUnusedInvite(r.Context(), code)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			utils.SendError(w, "Invalid or already used invite", http.StatusNotFound)
			return
		}
		utils.SendError(w, "Failed to get invite", http.StatusInternalServerError)
		return
	}

	inGroupParams := supabase.IsUserInGroupParams{
		GroupID: invite.GroupID,
		UserID:  userId,
	}

	isMember, err := utils.Queries.IsUserInGroup(r.Context(), inGroupParams)
	if err == nil && isMember {
		utils.SendError(w, "You are already a member of this group", http.StatusBadRequest)
		return
	}

	addParams := supabase.AddUserToGroupParams{
		UserID:  userId,
		GroupID: invite.GroupID,
	}

	err = utils.Queries.AddUserToGroup(r.Context(), addParams)
	if err != nil {
		utils.SendError(w, "Failed to add user to group", http.StatusInternalServerError)
		return
	}

	markParams := supabase.MarkInviteAsUsedParams{
		UsedBy: userId,
		Code:   code,
	}

	err = utils.Queries.MarkInviteAsUsed(r.Context(), markParams)
	if err != nil {
		utils.SendError(w, "Failed to mark invite as used", http.StatusInternalServerError)
	}

	utils.SendJson(w, map[string]string{"message": "Successfully joined group"}, http.StatusOK)
}

func HandleGetInvitesByGroup(w http.ResponseWriter, r *http.Request) {
	groupIdStr := chi.URLParam(r, "id")
	if groupIdStr == "" {
		utils.SendError(w, "Missing group ID parameter", http.StatusBadRequest)
		return
	}

	groupId, err := utils.ParseUUID(groupIdStr)
	if err != nil {
		utils.SendError(w, "Invalid group ID format", http.StatusBadRequest)
		return
	}

	userIdStr, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		utils.SendError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	userId, err := utils.ParseUUID(userIdStr)
	if err != nil {
		utils.SendError(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	inGroupParams := supabase.IsUserInGroupParams{
		GroupID: groupId,
		UserID:  userId,
	}

	isMember, err := utils.Queries.IsUserInGroup(r.Context(), inGroupParams)
	if err != nil {
		utils.SendError(w, "Error checking group membership", http.StatusInternalServerError)
		return
	}
	if !isMember {
		utils.SendError(w, "Not authorized to view invites for this group", http.StatusForbidden)
		return
	}

	invites, err := utils.Queries.GetInvitesByGroup(r.Context(), groupId)
	if err != nil {
		utils.SendError(w, "Failed to get invites", http.StatusInternalServerError)
		return
	}

	var response []models.InviteResponse
	for _, invite := range invites {
		inviteResponse := models.InviteResponse{
			Code:      invite.Code,
			GroupID:   utils.UUIDToString(invite.GroupID),
			CreatedAt: invite.CreatedAt.Time,
		}
		if invite.UsedBy.Valid {
			inviteResponse.UsedBy = utils.UUIDToString(invite.UsedBy)
		}
		response = append(response, inviteResponse)
	}

	utils.SendJson(w, response, http.StatusOK)
}
