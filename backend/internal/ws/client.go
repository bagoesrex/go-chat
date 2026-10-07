package ws

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/bagoesrex/go-chat/backend/internal/room"
	"github.com/gorilla/websocket"
)

const (
	writeWait  = 10 * time.Second
	pongWait   = 60 * time.Second
	pingPeriod = (pongWait * 9) / 10
	maxMsgSize = 4096
)

type Client struct {
	hub      *Hub
	conn     *websocket.Conn
	send     chan []byte
	userID   string
	username string
	rooms    map[string]bool
}

func NewClient(hub *Hub, conn *websocket.Conn, userID, username string) *Client {
	return &Client{
		hub:      hub,
		conn:     conn,
		send:     make(chan []byte, 64),
		userID:   userID,
		username: username,
		rooms:    make(map[string]bool),
	}
}

type incomingMsg struct {
	Type      string `json:"type"`
	RoomID    string `json:"room_id"`
	Content   string `json:"content"`
	MessageID string `json:"message_id"`
}

func (c *Client) ReadPump() {
	defer func() {
		c.hub.Unregister <- c
		c.conn.Close()
	}()
	c.conn.SetReadLimit(maxMsgSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, raw, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("ws read error: %v", err)
			}
			break
		}
		var msg incomingMsg
		if err := json.Unmarshal(raw, &msg); err != nil {
			c.sendError("invalid json")
			continue
		}
		c.handleMessage(msg)
	}
}

func (c *Client) WritePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()
	for {
		select {
		case msg, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.conn.WriteMessage(websocket.TextMessage, msg); err != nil {
				return
			}
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func (c *Client) handleMessage(msg incomingMsg) {
	switch msg.Type {
	case "join":
		c.handleJoin(msg.RoomID)
	case "leave":
		c.handleLeave(msg.RoomID)
	case "message":
		c.handleChat(msg.RoomID, msg.Content)
	case "read":
		c.handleRead(msg.RoomID, msg.MessageID)
	default:
		c.sendError("unknown message type")
	}
}

func (c *Client) handleJoin(roomID string) {
	ok, err := c.hub.roomRepo.IsMember(context.Background(), roomID, c.userID)
	if err != nil || !ok {
		c.sendError("not a member of this room")
		return
	}
	c.rooms[roomID] = true
	c.hub.JoinRoom(c, roomID)
}

func (c *Client) handleLeave(roomID string) {
	delete(c.rooms, roomID)
	c.hub.LeaveRoom(c, roomID)
}

func (c *Client) handleChat(roomID, content string) {
	if !c.rooms[roomID] {
		c.sendError("not a member of this room")
		return
	}
	if content == "" {
		return
	}
	c.hub.SaveMessageAsync(roomID, c.userID, content, func(msg room.Message) {
		payload, _ := json.Marshal(map[string]any{
			"type":    "message",
			"room_id": roomID,
			"message": msg,
		})
		c.hub.Broadcast <- broadcastMsg{roomID: roomID, payload: payload}
	})
}

func (c *Client) handleRead(roomID, messageID string) {
	if messageID == "" {
		return
	}
	go func() {
		_ = c.hub.roomRepo.MarkRead(context.Background(), messageID, c.userID)
	}()
	payload, _ := json.Marshal(map[string]string{
		"type": "read", "room_id": roomID, "message_id": messageID, "user_id": c.userID,
	})
	c.hub.Broadcast <- broadcastMsg{roomID: roomID, payload: payload}
}

func (c *Client) sendError(msg string) {
	payload, _ := json.Marshal(map[string]string{"type": "error", "message": msg})
	select {
	case c.send <- payload:
	default:
	}
}
