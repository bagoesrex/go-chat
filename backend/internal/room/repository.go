package room

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/bagoesrex/go-chat/backend/internal/user"
)

type Room struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	IsDM        bool      `json:"is_dm"`
	CreatedBy   string    `json:"created_by"`
	CreatedAt   time.Time `json:"created_at"`
	UnreadCount int       `json:"unread_count"`
}

type ExploreRoom struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	CreatedBy   string    `json:"created_by"`
	CreatedAt   time.Time `json:"created_at"`
	MemberCount int       `json:"member_count"`
	IsJoined    bool      `json:"is_joined"`
}

type Message struct {
	ID        string    `json:"id"`
	RoomID    string    `json:"room_id"`
	Sender    user.User `json:"sender"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
}

type Repository struct{ db *sql.DB }

func NewRepository(db *sql.DB) *Repository { return &Repository{db: db} }

func (r *Repository) Create(ctx context.Context, name, createdBy string) (Room, error) {
	var rm Room
	err := r.db.QueryRowContext(ctx,
		`INSERT INTO rooms (name, created_by) VALUES ($1,$2)
		 RETURNING id, name, is_dm, created_by, created_at`,
		name, createdBy,
	).Scan(&rm.ID, &rm.Name, &rm.IsDM, &rm.CreatedBy, &rm.CreatedAt)
	if err != nil {
		return rm, err
	}
	_, err = r.db.ExecContext(ctx,
		`INSERT INTO room_members (room_id, user_id) VALUES ($1,$2)`, rm.ID, createdBy)
	return rm, err
}

func (r *Repository) GetRoomByID(ctx context.Context, roomID, userID string) (Room, error) {
	var rm Room
	err := r.db.QueryRowContext(ctx,
		`SELECT r.id,
		        CASE 
		            WHEN r.is_dm = TRUE THEN COALESCE(
		                (SELECT u.username FROM room_members other_rm JOIN users u ON u.id=other_rm.user_id
		                 WHERE other_rm.room_id=r.id AND other_rm.user_id!=$1 LIMIT 1),
		                r.name
		            )
		            ELSE r.name
		        END,
		        r.is_dm, r.created_by, r.created_at,
		        COALESCE((
		            SELECT COUNT(*)
		            FROM messages m
		            WHERE m.room_id = r.id
		              AND m.sender_id != $1
		              AND NOT EXISTS (
		                  SELECT 1 FROM message_reads mr 
		                  WHERE mr.message_id = m.id AND mr.user_id = $1
		              )
		        ), 0) AS unread_count
		 FROM rooms r
		 WHERE r.id=$2`, userID, roomID,
	).Scan(&rm.ID, &rm.Name, &rm.IsDM, &rm.CreatedBy, &rm.CreatedAt, &rm.UnreadCount)
	return rm, err
}

func (r *Repository) GetUserRooms(ctx context.Context, userID string) ([]Room, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT r.id,
		        CASE 
		            WHEN r.is_dm = TRUE THEN COALESCE(
		                (SELECT u.username FROM room_members other_rm JOIN users u ON u.id=other_rm.user_id
		                 WHERE other_rm.room_id=r.id AND other_rm.user_id!=$1 LIMIT 1),
		                r.name
		            )
		            ELSE r.name
		        END,
		        r.is_dm, r.created_by, r.created_at,
		        COALESCE((
		            SELECT COUNT(*)
		            FROM messages m
		            WHERE m.room_id = r.id
		              AND m.sender_id != $1
		              AND NOT EXISTS (
		                  SELECT 1 FROM message_reads mr 
		                  WHERE mr.message_id = m.id AND mr.user_id = $1
		              )
		        ), 0) AS unread_count
		 FROM rooms r JOIN room_members rm ON r.id=rm.room_id
		 WHERE rm.user_id=$1 ORDER BY r.created_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var rooms []Room
	for rows.Next() {
		var rm Room
		if err := rows.Scan(&rm.ID, &rm.Name, &rm.IsDM, &rm.CreatedBy, &rm.CreatedAt, &rm.UnreadCount); err != nil {
			return nil, err
		}
		rooms = append(rooms, rm)
	}
	return rooms, rows.Err()
}

func (r *Repository) GetExploreRooms(ctx context.Context, userID string) ([]ExploreRoom, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT r.id, r.name, r.created_by, r.created_at,
		        COUNT(rm.user_id) AS member_count,
		        EXISTS(SELECT 1 FROM room_members user_rm WHERE user_rm.room_id=r.id AND user_rm.user_id=$1) AS is_joined
		 FROM rooms r
		 LEFT JOIN room_members rm ON r.id=rm.room_id
		 WHERE r.is_dm=FALSE
		 GROUP BY r.id, r.name, r.created_by, r.created_at
		 ORDER BY is_joined ASC, member_count DESC, r.created_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var rooms []ExploreRoom
	for rows.Next() {
		var er ExploreRoom
		if err := rows.Scan(&er.ID, &er.Name, &er.CreatedBy, &er.CreatedAt, &er.MemberCount, &er.IsJoined); err != nil {
			return nil, err
		}
		rooms = append(rooms, er)
	}
	return rooms, rows.Err()
}

func (r *Repository) JoinRoom(ctx context.Context, roomID, userID string) (Room, error) {
	var rm Room
	err := r.db.QueryRowContext(ctx,
		`SELECT id, name, is_dm, created_by, created_at FROM rooms WHERE id=$1`, roomID,
	).Scan(&rm.ID, &rm.Name, &rm.IsDM, &rm.CreatedBy, &rm.CreatedAt)
	if err != nil {
		return rm, err
	}
	if rm.IsDM {
		return rm, errors.New("cannot join DM room")
	}
	_, err = r.db.ExecContext(ctx,
		`INSERT INTO room_members (room_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
		roomID, userID)
	return rm, err
}

func (r *Repository) GetOrCreateDM(ctx context.Context, userA, userB string) (Room, error) {
	var rm Room
	err := r.db.QueryRowContext(ctx,
		`SELECT r.id, r.name, r.is_dm, r.created_by, r.created_at
		 FROM rooms r
		 JOIN room_members m1 ON r.id=m1.room_id AND m1.user_id=$1
		 JOIN room_members m2 ON r.id=m2.room_id AND m2.user_id=$2
		 WHERE r.is_dm=TRUE LIMIT 1`, userA, userB,
	).Scan(&rm.ID, &rm.Name, &rm.IsDM, &rm.CreatedBy, &rm.CreatedAt)
	if err == nil {
		return rm, nil
	}
	if err != sql.ErrNoRows {
		return rm, err
	}
	err = r.db.QueryRowContext(ctx,
		`INSERT INTO rooms (name, is_dm, created_by) VALUES ('dm', TRUE, $1)
		 RETURNING id, name, is_dm, created_by, created_at`, userA,
	).Scan(&rm.ID, &rm.Name, &rm.IsDM, &rm.CreatedBy, &rm.CreatedAt)
	if err != nil {
		return rm, err
	}
	_, err = r.db.ExecContext(ctx,
		`INSERT INTO room_members (room_id, user_id) VALUES ($1,$2),($1,$3)`, rm.ID, userA, userB)
	return rm, err
}

func (r *Repository) IsMember(ctx context.Context, roomID, userID string) (bool, error) {
	var exists bool
	err := r.db.QueryRowContext(ctx,
		`SELECT EXISTS(SELECT 1 FROM room_members WHERE room_id=$1 AND user_id=$2)`,
		roomID, userID,
	).Scan(&exists)
	return exists, err
}

func (r *Repository) AddMember(ctx context.Context, roomID, userID string) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO room_members (room_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
		roomID, userID)
	return err
}

func (r *Repository) SaveMessage(ctx context.Context, roomID, senderID, content string) (Message, error) {
	var msg Message
	var sender user.User
	err := r.db.QueryRowContext(ctx,
		`WITH ins AS (
		     INSERT INTO messages (room_id, sender_id, content) VALUES ($1,$2,$3)
		     RETURNING id, room_id, sender_id, content, created_at
		 )
		 SELECT ins.id, ins.room_id, u.id, u.username, u.email, u.created_at, ins.content, ins.created_at
		 FROM ins JOIN users u ON u.id=ins.sender_id`,
		roomID, senderID, content,
	).Scan(&msg.ID, &msg.RoomID, &sender.ID, &sender.Username, &sender.Email, &sender.CreatedAt,
		&msg.Content, &msg.CreatedAt)
	msg.Sender = sender
	return msg, err
}

func (r *Repository) GetMessages(ctx context.Context, roomID, before string, limit int) ([]Message, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	var rows *sql.Rows
	var err error
	if before == "" {
		rows, err = r.db.QueryContext(ctx,
			`SELECT m.id, m.room_id, u.id, u.username, u.email, u.created_at, m.content, m.created_at
			 FROM messages m JOIN users u ON u.id=m.sender_id
			 WHERE m.room_id=$1 ORDER BY m.created_at DESC LIMIT $2`,
			roomID, limit)
	} else {
		rows, err = r.db.QueryContext(ctx,
			`SELECT m.id, m.room_id, u.id, u.username, u.email, u.created_at, m.content, m.created_at
			 FROM messages m JOIN users u ON u.id=m.sender_id
			 WHERE m.room_id=$1 AND m.created_at < (SELECT created_at FROM messages WHERE id=$2)
			 ORDER BY m.created_at DESC LIMIT $3`,
			roomID, before, limit)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var msgs []Message
	for rows.Next() {
		var msg Message
		var sender user.User
		if err := rows.Scan(&msg.ID, &msg.RoomID, &sender.ID, &sender.Username, &sender.Email,
			&sender.CreatedAt, &msg.Content, &msg.CreatedAt); err != nil {
			return nil, err
		}
		msg.Sender = sender
		msgs = append(msgs, msg)
	}
	return msgs, rows.Err()
}

func (r *Repository) MarkRead(ctx context.Context, messageID, userID string) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO message_reads (message_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
		messageID, userID)
	return err
}

func (r *Repository) MarkRoomAsRead(ctx context.Context, roomID, userID string) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO message_reads (message_id, user_id)
		 SELECT m.id, $2
		 FROM messages m
		 WHERE m.room_id = $1 AND m.sender_id != $2
		 ON CONFLICT DO NOTHING`,
		roomID, userID)
	return err
}

func (r *Repository) GetRoomMemberIDs(ctx context.Context, roomID string) ([]string, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT user_id FROM room_members WHERE room_id=$1`, roomID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var userIDs []string
	for rows.Next() {
		var uid string
		if err := rows.Scan(&uid); err != nil {
			return nil, err
		}
		userIDs = append(userIDs, uid)
	}
	return userIDs, rows.Err()
}
