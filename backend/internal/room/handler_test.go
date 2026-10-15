package room

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/bagoesrex/go-chat/backend/internal/ctxkey"
)

func TestGetMessages_BadPath(t *testing.T) {
	h := &Handler{repo: nil, notifier: nil} // repo never called for bad paths

	cases := []struct {
		path string
		want int
	}{
		{"/api/rooms//messages", http.StatusBadRequest},    // empty room ID
		{"/api/rooms/abc-123/other", http.StatusBadRequest}, // not /messages
	}
	for _, tc := range cases {
		req := httptest.NewRequest("GET", tc.path, nil)
		rr := httptest.NewRecorder()
		h.GetMessages(rr, req)
		if rr.Code != tc.want {
			t.Errorf("path %s: got %d, want %d", tc.path, rr.Code, tc.want)
		}
	}
}

func TestJoinRoom_MissingID(t *testing.T) {
	h := &Handler{repo: nil, notifier: nil}
	req := httptest.NewRequest("POST", "/api/rooms//join", nil)
	ctx := context.WithValue(req.Context(), ctxkey.UserIDKey, "user-123")
	rr := httptest.NewRecorder()
	h.JoinRoom(rr, req.WithContext(ctx))
	if rr.Code != http.StatusBadRequest {
		t.Errorf("got %d, want %d", rr.Code, http.StatusBadRequest)
	}
}
