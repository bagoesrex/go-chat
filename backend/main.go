package main

import (
	"log"
	"net/http"

	"github.com/bagoesrex/go-chat/backend/internal/auth"
	"github.com/bagoesrex/go-chat/backend/internal/config"
	"github.com/bagoesrex/go-chat/backend/internal/db"
	"github.com/bagoesrex/go-chat/backend/internal/room"
	"github.com/bagoesrex/go-chat/backend/internal/user"
	"github.com/bagoesrex/go-chat/backend/internal/ws"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatal(err)
	}
	conn, err := db.Connect(cfg.DBUrl)
	if err != nil {
		log.Fatal(err)
	}
	defer conn.Close()

	userRepo := user.NewRepository(conn)
	roomRepo := room.NewRepository(conn)

	authHandler := auth.NewHandler(userRepo, cfg.JWTSecret)
	userHandler := user.NewHandler(userRepo)
	roomHandler := room.NewHandler(roomRepo)

	hub := ws.NewHub(roomRepo)
	go hub.Run()
	wsHandler := ws.NewHandler(hub, userRepo, cfg.JWTSecret)

	jwtMiddleware := auth.Middleware(cfg.JWTSecret)

	mux := http.NewServeMux()

	// Auth (no middleware)
	mux.HandleFunc("POST /api/auth/register", authHandler.Register)
	mux.HandleFunc("POST /api/auth/login", authHandler.Login)

	// Protected endpoints
	mux.Handle("GET /api/users/me", jwtMiddleware(http.HandlerFunc(userHandler.Me)))
	mux.Handle("GET /api/users/search", jwtMiddleware(http.HandlerFunc(userHandler.Search)))
	mux.Handle("GET /api/rooms", jwtMiddleware(http.HandlerFunc(roomHandler.ListRooms)))
	mux.Handle("POST /api/rooms", jwtMiddleware(http.HandlerFunc(roomHandler.CreateRoom)))
	mux.Handle("POST /api/rooms/dm", jwtMiddleware(http.HandlerFunc(roomHandler.CreateDM)))
	mux.Handle("GET /api/rooms/", jwtMiddleware(http.HandlerFunc(roomHandler.GetMessages)))

	// WebSocket
	mux.Handle("GET /ws", wsHandler)

	handler := corsMiddleware(mux)
	log.Printf("listening on :%s", cfg.Port)
	log.Fatal(http.ListenAndServe(":"+cfg.Port, handler))
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
		w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}
