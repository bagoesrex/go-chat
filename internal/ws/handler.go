package ws

import (
	"context"
	"log"
	"net/http"

	"github.com/bagoesrex/go-chat/internal/auth"
	"github.com/bagoesrex/go-chat/internal/user"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		origin := r.Header.Get("Origin")
		return origin == "http://localhost:5173" || origin == ""
	},
}

type WSHandler struct {
	hub       *Hub
	userRepo  *user.Repository
	jwtSecret string
}

func NewHandler(hub *Hub, userRepo *user.Repository, secret string) *WSHandler {
	return &WSHandler{hub: hub, userRepo: userRepo, jwtSecret: secret}
}

func (h *WSHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	if token == "" {
		http.Error(w, "token required", http.StatusUnauthorized)
		return
	}
	userID, err := auth.VerifyToken(token, h.jwtSecret)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	u, err := h.userRepo.FindByID(context.Background(), userID)
	if err != nil {
		http.Error(w, "user not found", http.StatusUnauthorized)
		return
	}
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("ws upgrade: %v", err)
		return
	}
	c := NewClient(h.hub, conn, userID, u.Username)
	h.hub.Register <- c
	go c.WritePump()
	go c.ReadPump()
}
