package room

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestGetMessages_BadPath(t *testing.T) {
	h := &Handler{repo: nil} // repo never called for bad paths

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
