package main

import (
	"embed"
	"flag"
	"fmt"
	"io/fs"
	"net"
	"net/http"
	"os/exec"
	"runtime"
	"strings"
	"time"
)

//go:embed dist/*
var embeddedDist embed.FS

func main() {
	port := flag.Int("port", 60123, "port for localhost server")
	flag.Parse()

	addr := fmt.Sprintf("127.0.0.1:%d", *port)

	distFS, err := fs.Sub(embeddedDist, "dist")
	if err != nil {
		panic(err)
	}

	// Handler, der Dateien ausliefert
	fileServer := http.FileServer(http.FS(distFS))

	// SPA Fallback nutzt distFS (fs.FS) für Stat()
	handler := spaFallback(fileServer, distFS)

	srv := &http.Server{
		Addr:              addr,
		Handler:           noCacheIndex(handler),
		ReadHeaderTimeout: 5 * time.Second,
	}

	ln, err := net.Listen("tcp", addr)
	if err != nil {
		panic(err)
	}

	url := "http://" + addr
	fmt.Println("Listening:", url)
	openBrowser(url)

	if err := srv.Serve(ln); err != nil && err != http.ErrServerClosed {
		panic(err)
	}
}

func spaFallback(next http.Handler, dist fs.FS) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		p := strings.TrimPrefix(r.URL.Path, "/")
		if p == "" {
			p = "index.html"
		}

		// existiert Datei? -> normal ausliefern
		if _, err := fs.Stat(dist, p); err == nil {
			next.ServeHTTP(w, r)
			return
		}

		// sonst -> index.html (für React Router / deep links)
		r2 := r.Clone(r.Context())
		r2.URL.Path = "/index.html"
		next.ServeHTTP(w, r2)
	})
}

func noCacheIndex(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" || r.URL.Path == "/index.html" {
			w.Header().Set("Cache-Control", "no-store")
		}
		next.ServeHTTP(w, r)
	})
}

func openBrowser(url string) {
	switch runtime.GOOS {
	case "windows":
		_ = exec.Command("cmd", "/c", "start", "", url).Start()
	case "darwin":
		_ = exec.Command("open", url).Start()
	default:
		_ = exec.Command("xdg-open", url).Start()
	}
}
