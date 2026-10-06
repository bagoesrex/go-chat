package room

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/bagoesrex/go-chat/internal/ctxkey"
)

type Handler struct{ repo *Repository }

func NewHandler(repo *Repository) *Handler { return &Handler{repo: repo} }

func (h *Handler) ListRooms(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(ctxkey.UserIDKey).(string)
	rooms, err := h.repo.GetUserRooms(r.Context(), userID)
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	if rooms == nil {
		rooms = []Room{}
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(rooms)
}

func (h *Handler) CreateRoom(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(ctxkey.UserIDKey).(string)
	var body struct {
		Name string `json:"name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Name == "" {
		http.Error(w, "name required", http.StatusBadRequest)
		return
	}
	rm, err := h.repo.Create(r.Context(), body.Name, userID)
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(rm)
}

func (h *Handler) CreateDM(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(ctxkey.UserIDKey).(string)
	var body struct {
		TargetUserID string `json:"target_user_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.TargetUserID == "" {
		http.Error(w, "target_user_id required", http.StatusBadRequest)
		return
	}
	rm, err := h.repo.GetOrCreateDM(r.Context(), userID, body.TargetUserID)
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(rm)
}

// GetMessages handles GET /api/rooms/{id}/messages
func (h *Handler) GetMessages(w http.ResponseWriter, r *http.Request) {
	// path: /api/rooms/{id}/messages
	parts := strings.Split(r.URL.Path, "/")
	// ["", "api", "rooms", "{id}", "messages"]
	if len(parts) < 5 {
		http.Error(w, "bad path", http.StatusBadRequest)
		return
	}
	roomID := parts[3]
	before := r.URL.Query().Get("before")
	limit := 50
	msgs, err := h.repo.GetMessages(r.Context(), roomID, before, limit)
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	if msgs == nil {
		msgs = []Message{}
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(msgs)
}
