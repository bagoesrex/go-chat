package auth

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestMiddleware(t *testing.T) {
	secret := "test-secret"
	tok, _ := GenerateToken("uid-1", secret)
	handler := Middleware(secret)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		uid := r.Context().Value(UserIDKey).(string)
		w.Write([]byte(uid))
	}))

	// valid token
	req := httptest.NewRequest("GET", "/", nil)
	req.Header.Set("Authorization", "Bearer "+tok)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)
	if rr.Code != 200 || rr.Body.String() != "uid-1" {
		t.Fatalf("expected 200 uid-1, got %d %s", rr.Code, rr.Body.String())
	}

	// missing token → 401
	req2 := httptest.NewRequest("GET", "/", nil)
	rr2 := httptest.NewRecorder()
	handler.ServeHTTP(rr2, req2)
	if rr2.Code != 401 {
		t.Fatalf("expected 401, got %d", rr2.Code)
	}
}
