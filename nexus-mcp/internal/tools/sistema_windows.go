//go:build windows

package tools

import (
	"fmt"
	"os"
	"strings"
	"syscall"
	"unsafe"
)

var (
	kernel32            = syscall.NewLazyDLL("kernel32.dll")
	procGetDiskFreeSpace = kernel32.NewProc("GetDiskFreeSpaceExW")
)

func obterEspacoDisco(caminho string, rotulo string) string {
	target := caminho
	if target == "/" || target == "" {
		target = "C:\\"
	} else if strings.HasPrefix(target, "/run/media") {
		// Mapeamento de conveniência para partições secundárias no Windows
		if _, err := os.Stat("D:\\"); err == nil {
			target = "D:\\"
		} else {
			return ""
		}
	}

	ptr, err := syscall.UTF16PtrFromString(target)
	if err != nil {
		return ""
	}

	var freeBytesAvailable, totalNumberOfBytes, totalNumberOfFreeBytes uint64
	// #nosec G103 - chamada Win32 GetDiskFreeSpaceExW com ponteiros de saida auditados
	r1, _, _ := procGetDiskFreeSpace.Call(
		uintptr(unsafe.Pointer(ptr)),                    // #nosec G103
		uintptr(unsafe.Pointer(&freeBytesAvailable)),    // #nosec G103
		uintptr(unsafe.Pointer(&totalNumberOfBytes)),    // #nosec G103
		uintptr(unsafe.Pointer(&totalNumberOfFreeBytes)), // #nosec G103
	)
	if r1 == 0 || totalNumberOfBytes == 0 {
		return ""
	}

	usedBytes := totalNumberOfBytes - totalNumberOfFreeBytes
	totalGB := float64(totalNumberOfBytes) / (1024 * 1024 * 1024)
	usedGB := float64(usedBytes) / (1024 * 1024 * 1024)
	freeGB := float64(totalNumberOfFreeBytes) / (1024 * 1024 * 1024)
	pct := (float64(usedBytes) / float64(totalNumberOfBytes)) * 100

	return fmt.Sprintf("%s: %.1f GB usados de %.1f GB (%.1f%% em uso, %.1f GB disponíveis)", rotulo, usedGB, totalGB, pct, freeGB)
}
