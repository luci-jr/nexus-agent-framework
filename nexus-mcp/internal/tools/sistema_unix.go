//go:build !windows

package tools

import (
	"fmt"
	"syscall"
)

func obterEspacoDisco(caminho string, rotulo string) string {
	var stat syscall.Statfs_t
	if err := syscall.Statfs(caminho, &stat); err != nil {
		return ""
	}

	if stat.Bsize <= 0 {
		return ""
	}

	// #nosec G115
	bsize := uint64(stat.Bsize)
	totalBytes := stat.Blocks * bsize
	freeBytes := stat.Bavail * bsize
	usedBytes := totalBytes - freeBytes

	totalGB := float64(totalBytes) / (1024 * 1024 * 1024)
	usedGB := float64(usedBytes) / (1024 * 1024 * 1024)
	freeGB := float64(freeBytes) / (1024 * 1024 * 1024)
	pct := (float64(usedBytes) / float64(totalBytes)) * 100

	return fmt.Sprintf("%s: %.1f GB usados de %.1f GB (%.1f%% em uso, %.1f GB disponíveis)", rotulo, usedGB, totalGB, pct, freeGB)
}
