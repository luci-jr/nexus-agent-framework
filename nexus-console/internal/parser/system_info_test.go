package parser

import (
	"testing"
)

func TestParseLinuxRelease(t *testing.T) {
	tests := []struct {
		name        string
		content     string
		wantDistro  string
		wantVersion string
	}{
		{
			name: "Ubuntu 24.04",
			content: `NAME="Ubuntu"
VERSION="24.04.1 LTS (Noble Numbat)"
ID=ubuntu
VERSION_ID="24.04"`,
			wantDistro:  "Ubuntu",
			wantVersion: "24.04",
		},
		{
			name: "Debian 12",
			content: `PRETTY_NAME="Debian GNU/Linux 12 (bookworm)"
NAME="Debian GNU/Linux"
VERSION_ID="12"
VERSION="12 (bookworm)"
ID=debian`,
			wantDistro:  "Debian",
			wantVersion: "12",
		},
		{
			name: "Fedora 40",
			content: `NAME="Fedora Linux"
VERSION="40 (Workstation Edition)"
ID=fedora
VERSION_ID="40"`,
			wantDistro:  "Fedora",
			wantVersion: "40",
		},
		{
			name: "Arch Linux",
			content: `NAME="Arch Linux"
ID=arch
PRETTY_NAME="Arch Linux"`,
			wantDistro: "Arch",
		},
		{
			name: "Alpine Linux",
			content: `NAME="Alpine Linux"
ID=alpine
VERSION_ID=3.20.0`,
			wantDistro:  "Alpine",
			wantVersion: "3.20.0",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			distro, version := parseLinuxRelease(tt.content)
			if distro != tt.wantDistro {
				t.Errorf("parseLinuxRelease() distro = %v, want %v", distro, tt.wantDistro)
			}
			if tt.wantVersion != "" && version != tt.wantVersion {
				t.Errorf("parseLinuxRelease() version = %v, want %v", version, tt.wantVersion)
			}
		})
	}
}

func TestGetSystemOSInfoCurrent(t *testing.T) {
	info := GetSystemOSInfo()
	if info.TerminalTitle == "" {
		t.Errorf("TerminalTitle não pode ser vazio")
	}
	t.Logf("Detected OS: %+v", info)
}
