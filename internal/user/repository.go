package user

import (
	"context"
	"database/sql"
	"time"
)

type User struct {
	ID           string    `json:"id"`
	Username     string    `json:"username"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	CreatedAt    time.Time `json:"created_at"`
}

type Repository struct{ db *sql.DB }

func NewRepository(db *sql.DB) *Repository { return &Repository{db: db} }

func (r *Repository) Create(ctx context.Context, username, email, passwordHash string) (User, error) {
	var u User
	err := r.db.QueryRowContext(ctx,
		`INSERT INTO users (username, email, password_hash) VALUES ($1,$2,$3)
		 RETURNING id, username, email, created_at`,
		username, email, passwordHash,
	).Scan(&u.ID, &u.Username, &u.Email, &u.CreatedAt)
	return u, err
}

func (r *Repository) FindByEmail(ctx context.Context, email string) (User, error) {
	var u User
	err := r.db.QueryRowContext(ctx,
		`SELECT id, username, email, password_hash, created_at FROM users WHERE email=$1`, email,
	).Scan(&u.ID, &u.Username, &u.Email, &u.PasswordHash, &u.CreatedAt)
	return u, err
}

func (r *Repository) FindByID(ctx context.Context, id string) (User, error) {
	var u User
	err := r.db.QueryRowContext(ctx,
		`SELECT id, username, email, created_at FROM users WHERE id=$1`, id,
	).Scan(&u.ID, &u.Username, &u.Email, &u.CreatedAt)
	return u, err
}

func (r *Repository) Search(ctx context.Context, q string) ([]User, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, username, email, created_at FROM users WHERE username ILIKE $1 LIMIT 20`,
		"%"+q+"%",
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var users []User
	for rows.Next() {
		var u User
		if err := rows.Scan(&u.ID, &u.Username, &u.Email, &u.CreatedAt); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, rows.Err()
}
