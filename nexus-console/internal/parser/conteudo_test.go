package parser

import (
	"os"
	"path/filepath"
	"testing"
)

func TestListConteudos(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "nexus-conteudo-test-*")
	if err != nil {
		t.Fatalf("Erro ao criar temp dir: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	// Cria estrutura simulada
	videoDir := filepath.Join(tmpDir, "conteudo", "videos", "2026-11-04_teste_video")
	carrosselDir := filepath.Join(tmpDir, "conteudo", "carrosseis", "2026-11-04_teste_carrossel")
	thumbDir := filepath.Join(tmpDir, "conteudo", "thumbnails", "2026-11-04_teste_thumb")

	_ = os.MkdirAll(videoDir, 0755)
	_ = os.MkdirAll(carrosselDir, 0755)
	_ = os.MkdirAll(thumbDir, 0755)

	_ = os.WriteFile(filepath.Join(videoDir, "video_final.mp4"), []byte("mp4"), 0644)
	_ = os.WriteFile(filepath.Join(carrosselDir, "carrossel_linkedin.pdf"), []byte("pdf"), 0644)
	_ = os.WriteFile(filepath.Join(carrosselDir, "slide_01.png"), []byte("png"), 0644)
	_ = os.WriteFile(filepath.Join(thumbDir, "thumb_a_impacto.png"), []byte("png"), 0644)

	res := ListConteudos(tmpDir)
	if res.Total != 3 {
		t.Errorf("Esperava 3 itens no total, obteve %d", res.Total)
	}
	if len(res.Videos) != 1 {
		t.Errorf("Esperava 1 vídeo, obteve %d", len(res.Videos))
	}
	if len(res.Carrosseis) != 1 {
		t.Errorf("Esperava 1 carrossel, obteve %d", len(res.Carrosseis))
	}
	if len(res.Thumbnails) != 1 {
		t.Errorf("Esperava 1 thumbnail, obteve %d", len(res.Thumbnails))
	}
	if res.Videos[0].Principal != "/conteudo/videos/2026-11-04_teste_video/video_final.mp4" {
		t.Errorf("URL principal do vídeo incorreta: %s", res.Videos[0].Principal)
	}

	// Testa exclusão segura
	trashPath, err := DeleteConteudoItem(tmpDir, "video", "2026-11-04_teste_video")
	if err != nil {
		t.Fatalf("Erro ao deletar vídeo: %v", err)
	}
	if trashPath == "" {
		t.Errorf("trashPath não deveria ser vazio")
	}

	// Verifica se a pasta original foi removida
	if _, err := os.Stat(videoDir); !os.IsNotExist(err) {
		t.Errorf("Pasta original do vídeo ainda existe após exclusão")
	}

	// Testa tentativa de path traversal
	_, err = DeleteConteudoItem(tmpDir, "video", "../../../etc")
	if err == nil {
		t.Errorf("Deveria bloquear tentativa de path traversal")
	}

	// Testa salvar e listar Sites & Projetos Web
	siteItem, err := SaveSiteItem(tmpDir, SitePayload{
		Titulo:      "HERA PDV - Landing Page",
		URL:         "https://herapdv.com.br",
		Nicho:       "Landing Page",
		Descricao:   "Página de alta conversão do sistema fiscal PDV",
		Status:      "online",
		PrintBase64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
	})
	if err != nil {
		t.Fatalf("Erro ao salvar site: %v", err)
	}
	if siteItem.Titulo != "HERA PDV - Landing Page" {
		t.Errorf("Título incorreto: %s", siteItem.Titulo)
	}

	resComSites := ListConteudos(tmpDir)
	if len(resComSites.Sites) != 1 {
		t.Errorf("Esperava 1 site na listagem, obteve %d", len(resComSites.Sites))
	}
	if resComSites.Sites[0].Nicho != "Landing Page" {
		t.Errorf("Nicho do site incorreto: %s", resComSites.Sites[0].Nicho)
	}

	// Testa exclusão de site
	_, err = DeleteConteudoItem(tmpDir, "site", siteItem.Slug)
	if err != nil {
		t.Fatalf("Erro ao deletar site: %v", err)
	}
}
