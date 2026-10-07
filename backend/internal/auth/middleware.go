package auth

import (
	"context"
	"net/http"
	"strings"

	"github.com/bagoesrex/go-chat/backend/internal/ctxkey"
)

// UserIDKey re-exported for callers that import auth directly.
const UserIDKey = ctxkey.UserIDKey

func Middleware(secret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			h := r.Header.Get("Authorization")
			if !strings.HasPrefix(h, "Bearer ") {
				http.Error(w, "unauthorized", http.StatusUnauthorized)
				return
			}
			userID, err := VerifyToken(strings.TrimPrefix(h, "Bearer "), secret)
			if err != nil {
				http.Error(w, "unauthorized", http.StatusUnauthorized)
				return
			}
			ctx := context.WithValue(r.Context(), ctxkey.UserIDKey, userID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
