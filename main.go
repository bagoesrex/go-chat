package main

import (
	"log"

	"github.com/bagoesrex/go-chat/internal/config"
	"github.com/bagoesrex/go-chat/internal/db"
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
	log.Println("DB connected, migrations OK")
}
