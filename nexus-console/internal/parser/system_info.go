package parser

import (
	"bufio"
	"fmt"
	"os"
	"runtime"
	"strings"
)

// OSInfo armazena dados detalhados da plataforma e sabor do sistema operacional
type OSInfo struct {
	OS            string `json:"os"`             // "linux", "windows", "darwin"
	Distro        string `json:"distro"`         // "Ubuntu", "Debian", "Fedora", "Arch", "Alpine", etc.
	DistroVersion string `json:"distro_version"` // "24.04", "11", etc.
	Shell         string `json:"shell"`          // "bash", "zsh", "PowerShell", "cmd"
	TerminalTitle string `json:"terminal_title"` // "Terminal Web - Terminal Linux (Ubuntu)"
}

// parseLinuxRelease extrai nome amigável e versão de arquivos padrão /etc/os-release
func parseLinuxRelease(content string) (distro, version string) {
	scanner := bufio.NewScanner(strings.NewReader(content))
	var rawName, rawID, rawVersion string

	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		parts := strings.SplitN(line, "=", 2)
		if len(parts) != 2 {
			continue
		}
		key := strings.TrimSpace(parts[0])
		val := strings.Trim(strings.TrimSpace(parts[1]), `"'`)

		switch key {
		case "ID":
			rawID = strings.ToLower(val)
		case "NAME":
			rawName = val
		case "VERSION_ID":
			rawVersion = val
		}
	}

	// Mapeia sabores conhecidos
	switch {
	case strings.Contains(rawID, "ubuntu") || strings.Contains(strings.ToLower(rawName), "ubuntu"):
		distro = "Ubuntu"
	case strings.Contains(rawID, "debian") || strings.Contains(strings.ToLower(rawName), "debian"):
		distro = "Debian"
	case strings.Contains(rawID, "fedora") || strings.Contains(strings.ToLower(rawName), "fedora"):
		distro = "Fedora"
	case strings.Contains(rawID, "arch") || strings.Contains(strings.ToLower(rawName), "arch"):
		distro = "Arch"
	case strings.Contains(rawID, "alpine") || strings.Contains(strings.ToLower(rawName), "alpine"):
		distro = "Alpine"
	case strings.Contains(rawID, "centos") || strings.Contains(strings.ToLower(rawName), "centos"):
		distro = "CentOS"
	case strings.Contains(rawID, "rocky") || strings.Contains(strings.ToLower(rawName), "rocky"):
		distro = "Rocky"
	case strings.Contains(rawID, "alma") || strings.Contains(strings.ToLower(rawName), "alma"):
		distro = "AlmaLinux"
	case strings.Contains(rawID, "rhel") || strings.Contains(strings.ToLower(rawName), "red hat"):
		distro = "RHEL"
	case strings.Contains(rawID, "manjaro") || strings.Contains(strings.ToLower(rawName), "manjaro"):
		distro = "Manjaro"
	case strings.Contains(rawID, "opensuse") || strings.Contains(strings.ToLower(rawName), "suse"):
		distro = "openSUSE"
	case strings.Contains(rawID, "kali") || strings.Contains(strings.ToLower(rawName), "kali"):
		distro = "Kali"
	case strings.Contains(rawID, "pop") || strings.Contains(strings.ToLower(rawName), "pop"):
		distro = "Pop!_OS"
	case strings.Contains(rawID, "mint") || strings.Contains(strings.ToLower(rawName), "mint"):
		distro = "Linux Mint"
	default:
		if rawName != "" {
			distro = strings.Split(rawName, " ")[0]
		} else {
			distro = "Linux"
		}
	}

	version = rawVersion
	return distro, version
}

// GetSystemOSInfo detecta de forma determinística o sistema operacional, sabor e título formatado do terminal
func GetSystemOSInfo() OSInfo {
	goos := runtime.GOOS
	info := OSInfo{
		OS: goos,
	}

	switch goos {
	case "linux":
		distro := "Linux"
		version := ""
		releaseFiles := []string{"/etc/os-release", "/usr/lib/os-release"}
		for _, f := range releaseFiles {
			if data, err := os.ReadFile(f); err == nil {
				distro, version = parseLinuxRelease(string(data))
				break
			}
		}

		shell := os.Getenv("SHELL")
		if shell == "" {
			shell = "/bin/bash"
		}
		info.Shell = filepathBase(shell)
		info.Distro = distro
		info.DistroVersion = version
		if distro != "" && distro != "Linux" {
			info.TerminalTitle = fmt.Sprintf("Terminal Web - Terminal Linux (%s)", distro)
		} else {
			info.TerminalTitle = "Terminal Web - Terminal Linux"
		}

	case "windows":
		info.Distro = "Windows"
		shell := "PowerShell"
		// Verifica se o terminal padrão é PowerShell ou CMD
		psModule := os.Getenv("PSModulePath")
		comSpec := strings.ToLower(os.Getenv("ComSpec"))
		envShell := strings.ToLower(os.Getenv("SHELL"))

		if strings.Contains(envShell, "cmd") || (psModule == "" && strings.Contains(comSpec, "cmd.exe")) {
			shell = "CMD"
		}
		info.Shell = shell
		info.TerminalTitle = fmt.Sprintf("Terminal Web - %s (Windows)", shell)

	case "darwin":
		info.Distro = "macOS"
		shell := os.Getenv("SHELL")
		if shell == "" {
			shell = "/bin/zsh"
		}
		info.Shell = filepathBase(shell)
		info.TerminalTitle = "Terminal Web - Terminal macOS"

	default:
		info.Distro = goos
		info.TerminalTitle = fmt.Sprintf("Terminal Web - Terminal %s", strings.Title(goos))
	}

	return info
}

func filepathBase(path string) string {
	parts := strings.Split(strings.ReplaceAll(path, "\\", "/"), "/")
	if len(parts) > 0 {
		return parts[len(parts)-1]
	}
	return path
}
