package config

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DBUrl     string
	JWTSecret string
	Port      string
}

func Load() (Config, error) {
	_ = godotenv.Load() // ok if .env is absent in production
	c := Config{
		DBUrl:     os.Getenv("DB_URL"),
		JWTSecret: os.Getenv("JWT_SECRET"),
		Port:      os.Getenv("PORT"),
	}
	if c.DBUrl == "" || c.JWTSecret == "" {
		return c, fmt.Errorf("DB_URL and JWT_SECRET are required")
	}
	if c.Port == "" {
		c.Port = "8080"
	}
	return c, nil
}
