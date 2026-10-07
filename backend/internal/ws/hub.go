package ws

import (
	"context"
	"log"

	"github.com/bagoesrex/go-chat/backend/internal/room"
)

type broadcastMsg struct {
	roomID  string
	payload []byte
	except  *Client // nil = send to all
}

type Hub struct {
	clients    map[*Client]bool
	rooms      map[string]map[*Client]bool // roomID → set of clients
	Register   chan *Client
	Unregister chan *Client
	Broadcast  chan broadcastMsg
	roomRepo   *room.Repository
}

func NewHub(roomRepo *room.Repository) *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		rooms:      make(map[string]map[*Client]bool),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		Broadcast:  make(chan broadcastMsg, 256),
		roomRepo:   roomRepo,
	}
}

func (h *Hub) Run() {
	for {
		select {
		case c := <-h.Register:
			h.clients[c] = true
			h.broadcastPresence(c, "online")

		case c := <-h.Unregister:
			if h.clients[c] {
				h.broadcastPresence(c, "offline") // before removing from rooms
				delete(h.clients, c)
				close(c.send)
				for roomID, members := range h.rooms {
					if members[c] {
						delete(members, c)
						if len(members) == 0 {
							delete(h.rooms, roomID)
						}
					}
				}
			}

		case msg := <-h.Broadcast:
			members := h.rooms[msg.roomID]
			for c := range members {
				if c == msg.except {
					continue
				}
				select {
				case c.send <- msg.payload:
				default:
					// slow client: drop and disconnect
					delete(h.clients, c)
					close(c.send)
				}
			}
		}
	}
}

func (h *Hub) JoinRoom(c *Client, roomID string) {
	if h.rooms[roomID] == nil {
		h.rooms[roomID] = make(map[*Client]bool)
	}
	h.rooms[roomID][c] = true
}

func (h *Hub) LeaveRoom(c *Client, roomID string) {
	if members, ok := h.rooms[roomID]; ok {
		delete(members, c)
		if len(members) == 0 {
			delete(h.rooms, roomID)
		}
	}
}

func (h *Hub) broadcastPresence(c *Client, status string) {
	payload := []byte(`{"type":"presence","user_id":"` + c.userID +
		`","username":"` + c.username + `","status":"` + status + `"}`)
	for _, members := range h.rooms {
		for other := range members {
			if other == c {
				continue
			}
			select {
			case other.send <- payload:
			default:
				log.Printf("ws: presence drop for slow client")
			}
		}
	}
}

// SaveMessageAsync saves to DB in a goroutine; logs on error, never crashes Hub.
// ponytail: fire-and-forget, add result channel if callers need guaranteed delivery
func (h *Hub) SaveMessageAsync(roomID, senderID, content string, onSaved func(room.Message)) {
	go func() {
		msg, err := h.roomRepo.SaveMessage(context.Background(), roomID, senderID, content)
		if err != nil {
			log.Printf("ws: save message error: %v", err)
			return
		}
		if onSaved != nil {
			onSaved(msg)
		}
	}()
}
