package room

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/bagoesrex/go-chat/backend/internal/ctxkey"
)

type RealtimeNotifier interface {
	SendToUser(userID string, payload []byte)
}

type Handler struct {
	repo     *Repository
	notifier RealtimeNotifier
}

func NewHandler(repo *Repository, notifier RealtimeNotifier) *Handler {
	return &Handler{repo: repo, notifier: notifier}
}

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

func (h *Handler) ExploreRooms(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(ctxkey.UserIDKey).(string)
	rooms, err := h.repo.GetExploreRooms(r.Context(), userID)
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	if rooms == nil {
		rooms = []ExploreRoom{}
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

func (h *Handler) JoinRoom(w http.ResponseWriter, r *http.Request) {
	val := r.Context().Value(ctxkey.UserIDKey)
	if val == nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	userID := val.(string)

	roomID := r.PathValue("id")
	if roomID == "" {
		parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
		// ["api", "rooms", "{id}", "join"]
		if len(parts) >= 3 {
			roomID = parts[2]
		}
	}
	if roomID == "" {
		http.Error(w, "room_id required", http.StatusBadRequest)
		return
	}

	rm, err := h.repo.JoinRoom(r.Context(), roomID, userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
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

	userRoom, err := h.repo.GetRoomByID(r.Context(), rm.ID, userID)
	if err != nil {
		userRoom = rm
	}

	// Realtime notify target user through WS hub
	if h.notifier != nil {
		targetRoom, err := h.repo.GetRoomByID(r.Context(), rm.ID, body.TargetUserID)
		if err == nil {
			payload, _ := json.Marshal(map[string]any{
				"type": "room_created",
				"room": targetRoom,
			})
			h.notifier.SendToUser(body.TargetUserID, payload)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(userRoom)
}

// GetMessages handles GET /api/rooms/{id}/messages
func (h *Handler) GetMessages(w http.ResponseWriter, r *http.Request) {
	// path: /api/rooms/{id}/messages
	parts := strings.Split(r.URL.Path, "/")
	// ["", "api", "rooms", "{id}", "messages"]
	if len(parts) < 5 || parts[3] == "" || parts[4] != "messages" {
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
