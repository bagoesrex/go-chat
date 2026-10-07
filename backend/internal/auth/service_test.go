package auth

import "testing"

func TestHashAndCheck(t *testing.T) {
	hash, err := HashPassword("secret123")
	if err != nil {
		t.Fatal(err)
	}
	if CheckPassword(hash, "secret123") != nil {
		t.Fatal("correct password rejected")
	}
	if CheckPassword(hash, "wrong") == nil {
		t.Fatal("wrong password accepted")
	}
}

func TestGenerateVerifyToken(t *testing.T) {
	tok, err := GenerateToken("user-123", "mysecret")
	if err != nil {
		t.Fatal(err)
	}
	sub, err := VerifyToken(tok, "mysecret")
	if err != nil || sub != "user-123" {
		t.Fatalf("got sub=%q err=%v", sub, err)
	}
	if _, err := VerifyToken(tok, "wrong"); err == nil {
		t.Fatal("wrong secret should fail")
	}
}
