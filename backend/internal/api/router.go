package api

import (
	"time"

	"github.com/egeuysall/cove/internal/handlers"
	appmid "github.com/egeuysall/cove/internal/middleware"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/httprate"
)

func Router() *chi.Mux {
	r := chi.NewRouter()

	// Global middleware
	r.Use(
		middleware.Recoverer,
		middleware.RealIP,
		middleware.Timeout(3*time.Second),
		middleware.NoCache,
		middleware.Compress(5),
		httprate.LimitByIP(30, time.Minute),
		appmid.SetContentType(),
		appmid.Cors(),
	)

	// Public routes
	r.Get("/", handlers.HandleRoot)
	r.Get("/ping", handlers.HandlePing)

	// Protected API v1 routes
	r.Route("/v1", func(r chi.Router) {
		r.Use(appmid.RequireAuth())

		// User info
		r.Get("/me", handlers.HandleMe)

		// Groups
		r.Post("/groups", handlers.HandleCreateGroup)
		r.Get("/groups", handlers.HandleGetGroupsByUser)
		r.Get("/groups/{id}", handlers.HandleGetGroupById)
		r.Delete("/groups/{id}", handlers.HandleDeleteGroup)

		// Group Members
		r.Post("/groups/{id}/members", handlers.HandleAddUserToGroup)
		r.Get("/groups/{id}/members", handlers.HandleGetGroupMembers)

		// Invites
		r.Post("/invites", handlers.HandleCreateInvite)
		r.Get("/invites/{code}", handlers.HandleGetInviteByCode)
		r.Post("/invites/{code}/accept", handlers.HandleAcceptInviteByCode)
		r.Get("/groups/{id}/invites", handlers.HandleGetInvitesByGroup)

		// Links
		r.Post("/links", handlers.HandleCreateLink)
		r.Get("/links/{id}", handlers.HandleGetLinkById)
		r.Get("/groups/{groupID}/links", handlers.HandleGetLinksByGroup)
		r.Patch("/links/{id}", handlers.HandleUpdateLinkComment)
		r.Delete("/links/{id}", handlers.HandleDeleteLink)
	})

	return r
}
