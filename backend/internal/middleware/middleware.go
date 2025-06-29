package middleware

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/egeuysall/cove/internal/utils"
	"github.com/go-chi/cors"
	"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const userIDKey = contextKey("userID")

var (
	supabaseJWTSecret = os.Getenv("SUPABASE_JWT_SECRET")
	supabaseIssuer    = os.Getenv("SUPABASE_ISSUER")
	supabaseAudience  = os.Getenv("SUPABASE_AUDIENCE")
)

func RequireAuth() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				utils.SendError(w, "Unauthorized: missing Authorization header", http.StatusUnauthorized)
				return
			}

			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) != 2 || parts[0] != "Bearer" {
				utils.SendError(w, "Unauthorized: invalid Authorization header format", http.StatusUnauthorized)
				return
			}
			tokenStr := parts[1]

			token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
				if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
				}
				return []byte(supabaseJWTSecret), nil
			})

			if err != nil || !token.Valid {
				utils.SendError(w, "Unauthorized: invalid token", http.StatusUnauthorized)
				return
			}

			claims, ok := token.Claims.(jwt.MapClaims)
			if !ok {
				utils.SendError(w, "Unauthorized: invalid token claims", http.StatusUnauthorized)
				return
			}

			if iss, ok := claims["iss"].(string); !ok || iss != supabaseIssuer {
				utils.SendError(w, "Unauthorized: invalid issuer", http.StatusUnauthorized)
				return
			}
			if aud, ok := claims["aud"].(string); !ok || aud != supabaseAudience {
				utils.SendError(w, "Unauthorized: invalid audience", http.StatusUnauthorized)
				return
			}
			if exp, ok := claims["exp"].(float64); !ok || int64(exp) < time.Now().Unix() {
				utils.SendError(w, "Unauthorized: token expired", http.StatusUnauthorized)
				return
			}

			sub, ok := claims["sub"].(string)
			if !ok || sub == "" {
				utils.SendError(w, "Unauthorized: missing subject", http.StatusUnauthorized)
				return
			}

			ctx := context.WithValue(r.Context(), userIDKey, sub)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func UserIDFromContext(ctx context.Context) (string, bool) {
	userID, ok := ctx.Value(userIDKey).(string)
	return userID, ok
}

func Cors() func(next http.Handler) http.Handler {
	return cors.Handler(cors.Options{
		AllowedOrigins:   []string{"https://www.cove.egeuysal.com"},
		AllowedMethods:   []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		AllowCredentials: true,
		MaxAge:           3600,
	})
}

func SetContentType() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			next.ServeHTTP(w, r)
		})
	}
}
