package handlers

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/egeuysall/cove/internal/middleware"
	"github.com/egeuysall/cove/internal/models"
	supabase "github.com/egeuysall/cove/internal/supabase/generated"
	"github.com/egeuysall/cove/internal/utils"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

func HandleCreateLink(w http.ResponseWriter, r *http.Request) {
	var req models.CreateLinkRequest
	err := json.NewDecoder(r.Body).Decode(&req)

	if err != nil {
		utils.SendError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.GroupID == "" || req.URL == "" {
		utils.SendError(w, "Group ID and URL are required", http.StatusBadRequest)
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

	if err != nil || !isMember {
		utils.SendError(w, "Not authorized to create links for this group", http.StatusForbidden)
		return
	}

	title := pgtype.Text{}
	if req.Title != "" {
		title = pgtype.Text{String: req.Title, Valid: true}
	}

	comment := pgtype.Text{}
	if req.Comment != "" {
		comment = pgtype.Text{String: req.Comment, Valid: true}
	}

	createParams := supabase.CreateLinkParams{
		GroupID: groupId,
		UserID:  userId,
		Url:     req.URL,
		Title:   title,
		Comment: comment,
	}

	link, err := utils.Queries.CreateLink(r.Context(), createParams)
	if err != nil {
		utils.SendError(w, "Failed to create link", http.StatusInternalServerError)
		return
	}

	linkResponse := convertToResponse(link)

	// Broadcast to WebSocket clients
	if utils.Hub != nil {
		utils.Hub.BroadcastToGroup(req.GroupID, "link_created", linkResponse)
	}

	utils.SendJson(w, linkResponse, http.StatusCreated)
}

func HandleGetLinkById(w http.ResponseWriter, r *http.Request) {
	linkIdStr := chi.URLParam(r, "id")
	if linkIdStr == "" {
		utils.SendError(w, "Missing link ID", http.StatusBadRequest)
		return
	}

	linkId, err := utils.ParseUUID(linkIdStr)
	if err != nil {
		utils.SendError(w, "Invalid link ID", http.StatusBadRequest)
		return
	}

	link, err := utils.Queries.GetLinkByID(r.Context(), linkId)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			utils.SendError(w, "Link not found", http.StatusNotFound)
			return
		}
		utils.SendError(w, "Failed to get link", http.StatusInternalServerError)
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
		GroupID: link.GroupID,
		UserID:  userId,
	}

	isMember, err := utils.Queries.IsUserInGroup(r.Context(), inGroupParams)
	if err != nil || !isMember {
		utils.SendError(w, "Not authorized to view this link", http.StatusForbidden)
		return
	}

	utils.SendJson(w, convertToResponse(link), http.StatusOK)
}

func HandleGetLinksByGroup(w http.ResponseWriter, r *http.Request) {
	groupIdStr := chi.URLParam(r, "groupID")
	if groupIdStr == "" {
		utils.SendError(w, "Missing group ID", http.StatusBadRequest)
		return
	}

	groupId, err := utils.ParseUUID(groupIdStr)
	if err != nil {
		utils.SendError(w, "Invalid group ID", http.StatusBadRequest)
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
	if err != nil || !isMember {
		utils.SendError(w, "Not authorized to view links for this group", http.StatusForbidden)
		return
	}

	params := supabase.GetLinksByGroupParams{
		GroupID: groupId,
		Limit:   1000,
		Offset:  0,
	}

	links, err := utils.Queries.GetLinksByGroup(r.Context(), params)
	if err != nil {
		utils.SendError(w, "Failed to get links", http.StatusInternalServerError)
		return
	}

	response := make([]models.LinkResponse, 0, len(links))
	for _, link := range links {
		response = append(response, convertToResponse(link))
	}

	utils.SendJson(w, response, http.StatusOK)
}

func HandleUpdateLinkComment(w http.ResponseWriter, r *http.Request) {
	linkIdStr := chi.URLParam(r, "id")
	if linkIdStr == "" {
		utils.SendError(w, "Missing link ID", http.StatusBadRequest)
		return
	}

	linkId, err := utils.ParseUUID(linkIdStr)
	if err != nil {
		utils.SendError(w, "Invalid link ID", http.StatusBadRequest)
		return
	}

	var req models.UpdateLinkCommentRequest
	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		utils.SendError(w, "Invalid request body", http.StatusBadRequest)
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

	link, err := utils.Queries.GetLinkByID(r.Context(), linkId)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			utils.SendError(w, "Link not found", http.StatusNotFound)
			return
		}
		utils.SendError(w, "Failed to get link", http.StatusInternalServerError)
		return
	}

	if link.UserID != userId {
		utils.SendError(w, "Not authorized to update this link", http.StatusForbidden)
		return
	}

	comment := pgtype.Text{}
	if req.Comment != "" {
		comment = pgtype.Text{String: req.Comment, Valid: true}
	}

	updateParams := supabase.UpdateLinkCommentParams{
		ID:      linkId,
		UserID:  userId,
		Comment: comment,
	}

	err = utils.Queries.UpdateLinkComment(r.Context(), updateParams)
	if err != nil {
		utils.SendError(w, "Failed to update link", http.StatusInternalServerError)
		return
	}

	updatedLink, err := utils.Queries.GetLinkByID(r.Context(), linkId)
	if err != nil {
		utils.SendError(w, "Failed to get updated link", http.StatusInternalServerError)
		return
	}

	linkResponse := convertToResponse(updatedLink)

	// Broadcast to WebSocket clients
	if utils.Hub != nil {
		utils.Hub.BroadcastToGroup(utils.UUIDToString(updatedLink.GroupID), "link_updated", linkResponse)
	}

	utils.SendJson(w, linkResponse, http.StatusOK)
}

func HandleDeleteLink(w http.ResponseWriter, r *http.Request) {
	linkIdStr := chi.URLParam(r, "id")
	if linkIdStr == "" {
		utils.SendError(w, "Missing link ID", http.StatusBadRequest)
		return
	}

	linkId, err := utils.ParseUUID(linkIdStr)
	if err != nil {
		utils.SendError(w, "Invalid link ID", http.StatusBadRequest)
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

	// Get link before deleting to broadcast group ID
	link, err := utils.Queries.GetLinkByID(r.Context(), linkId)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			utils.SendError(w, "Link not found", http.StatusNotFound)
			return
		}
		utils.SendError(w, "Failed to get link", http.StatusInternalServerError)
		return
	}

	if link.UserID != userId {
		utils.SendError(w, "Not authorized to delete this link", http.StatusForbidden)
		return
	}

	deleteParams := supabase.DeleteLinkParams{
		ID:     linkId,
		UserID: userId,
	}

	err = utils.Queries.DeleteLink(r.Context(), deleteParams)
	if err != nil {
		utils.SendError(w, "Link not found or you're not authorized to delete it", http.StatusNotFound)
		return
	}

	// Broadcast to WebSocket clients
	if utils.Hub != nil {
		utils.Hub.BroadcastToGroup(utils.UUIDToString(link.GroupID), "link_deleted", map[string]string{
			"id": utils.UUIDToString(link.ID),
		})
	}

	utils.SendJson(w, "Link deleted successfully", http.StatusOK)
}

func convertToResponse(link supabase.Link) models.LinkResponse {
	response := models.LinkResponse{
		ID:        utils.UUIDToString(link.ID),
		GroupID:   utils.UUIDToString(link.GroupID),
		UserID:    utils.UUIDToString(link.UserID),
		URL:       link.Url,
		CreatedAt: link.CreatedAt.Time,
	}

	if link.Title.Valid {
		response.Title = link.Title.String
	}

	if link.Comment.Valid {
		response.Comment = link.Comment.String
	}

	return response
}
