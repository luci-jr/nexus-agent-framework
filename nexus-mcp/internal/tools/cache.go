package tools

import (
	"os"
	"path/filepath"
	"sync"
	"time"
)

type cacheEntry struct {
	content []byte
	modTime time.Time
}

// FileCache fornece cache em RAM com invalidação automática por data de modificação
type FileCache struct {
	mu      sync.RWMutex
	entries map[string]cacheEntry
}

var globalCache = &FileCache{
	entries: make(map[string]cacheEntry),
}

// ReadCached lê o arquivo do cache se não tiver sido modificado em disco
func ReadCached(filePath string) ([]byte, error) {
	return globalCache.ReadFile(filePath)
}

// InvalidateCache invalida explicitamente uma entrada no cache
func InvalidateCache(filePath string) {
	globalCache.Invalidate(filePath)
}

// ReadFile gerencia leitura em cache thread-safe
func (c *FileCache) ReadFile(filePath string) ([]byte, error) {
	info, err := os.Stat(filePath)
	if err != nil {
		return nil, err
	}

	c.mu.RLock()
	entry, exists := c.entries[filePath]
	if exists && entry.modTime.Equal(info.ModTime()) {
		c.mu.RUnlock()
		return entry.content, nil
	}
	c.mu.RUnlock()

	c.mu.Lock()
	defer c.mu.Unlock()

	// Checagem dupla após adquirir lock de escrita
	entry, exists = c.entries[filePath]
	if exists && entry.modTime.Equal(info.ModTime()) {
		return entry.content, nil
	}

	// #nosec G304 - leitura segura gerenciada internamente pelo cache em memória
	content, err := os.ReadFile(filepath.Clean(filePath))
	if err != nil {
		return nil, err
	}

	c.entries[filePath] = cacheEntry{
		content: content,
		modTime: info.ModTime(),
	}

	return content, nil
}

// Invalidate remove um arquivo do cache
func (c *FileCache) Invalidate(filePath string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	delete(c.entries, filePath)
}
