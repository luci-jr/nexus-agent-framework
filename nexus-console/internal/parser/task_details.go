package parser

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

var cardMutex sync.Mutex

type TaskLink struct {
	ID        string `json:"id"`
	Title     string `json:"title"`
	URL       string `json:"url"`
	CreatedAt string `json:"created_at"`
}

type TaskAttachment struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Path      string `json:"path"`
	Size      string `json:"size"`
	Type      string `json:"type"`
	CreatedAt string `json:"created_at"`
}

type TaskComment struct {
	ID        string `json:"id"`
	Author    string `json:"author"`
	Avatar    string `json:"avatar"`
	Text      string `json:"text"`
	CreatedAt string `json:"created_at"`
}

type TaskDetails struct {
	ID          string           `json:"id"`
	Title       string           `json:"title"`
	Section     string           `json:"section"`
	Description string           `json:"description"`
	Responsible string           `json:"responsible"`
	Tags        []string         `json:"tags"`
	DueDate     string           `json:"due_date"`
	Links       []TaskLink       `json:"links"`
	Attachments []TaskAttachment `json:"attachments"`
	Comments    []TaskComment    `json:"comments"`
	UpdatedAt   string           `json:"updated_at"`
}

func getCardsDir(nexusDir string) string {
	dir := filepath.Join(nexusDir, "tasks", "cards")
	_ = os.MkdirAll(dir, 0755)
	return dir
}

func GetTaskAttachmentsDir(nexusDir string, taskID string) string {
	dir := filepath.Join(nexusDir, "tasks", "attachments", taskID)
	_ = os.MkdirAll(dir, 0755)
	return dir
}

func cardFilePath(nexusDir, taskID string) string {
	cleanID := strings.TrimSpace(taskID)
	return filepath.Join(getCardsDir(nexusDir), cleanID+".json")
}

func getTaskDetailsUnlocked(nexusDir, taskID string) (*TaskDetails, error) {
	taskID = strings.TrimSpace(taskID)
	if taskID == "" {
		return nil, fmt.Errorf("ID da tarefa é obrigatório")
	}

	p := cardFilePath(nexusDir, taskID)
	if data, err := os.ReadFile(p); err == nil {
		var details TaskDetails
		if err := json.Unmarshal(data, &details); err == nil {
			if details.Links == nil {
				details.Links = []TaskLink{}
			}
			if details.Attachments == nil {
				details.Attachments = []TaskAttachment{}
			}
			if details.Comments == nil {
				details.Comments = []TaskComment{}
			}
			if details.Tags == nil {
				details.Tags = []string{}
			}
			return &details, nil
		}
	}

	// Inicializa a partir do todo.md se ainda não tiver arquivo de card
	tasks, err := ParseTasks(nexusDir)
	var foundTask *TaskItem
	var sectionFound string

	if err == nil {
		allSections := map[string][]TaskItem{
			"backlog":     tasks.Backlog,
			"todo":        tasks.ToDo,
			"in_progress": tasks.InProgress,
			"homologacao": tasks.Homologacao,
			"done":        tasks.Done,
			"archived":    tasks.Archived,
		}
		for sec, items := range allSections {
			for _, item := range items {
				if item.ID == taskID {
					foundTask = &item
					sectionFound = sec
					break
				}
			}
			if foundTask != nil {
				break
			}
		}
	}

	title := taskID
	desc := ""
	resp := "Lucy (Tech Lead)"
	if foundTask != nil {
		title = foundTask.Title
		desc = foundTask.Context
		if foundTask.Responsible != "" {
			resp = foundTask.Responsible
		}
	}

	details := &TaskDetails{
		ID:          taskID,
		Title:       title,
		Section:     sectionFound,
		Description: desc,
		Responsible: resp,
		Tags:        []string{"Engenharia"},
		DueDate:     "",
		Links:       []TaskLink{},
		Attachments: []TaskAttachment{},
		Comments:    []TaskComment{},
		UpdatedAt:   time.Now().Format("2006-01-02 15:04:05"),
	}

	_ = saveTaskDetailsInternal(nexusDir, details)
	return details, nil
}

// GetTaskDetails carrega ou inicializa os detalhes completos do card
func GetTaskDetails(nexusDir, taskID string) (*TaskDetails, error) {
	cardMutex.Lock()
	defer cardMutex.Unlock()
	return getTaskDetailsUnlocked(nexusDir, taskID)
}

func saveTaskDetailsInternal(nexusDir string, details *TaskDetails) error {
	p := cardFilePath(nexusDir, details.ID)
	details.UpdatedAt = time.Now().Format("2006-01-02 15:04:05")
	data, err := json.MarshalIndent(details, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(p, data, 0644)
}

// SaveTaskDetails atualiza metadados principais do card
func SaveTaskDetails(nexusDir string, details *TaskDetails) error {
	cardMutex.Lock()
	defer cardMutex.Unlock()

	current, _ := getTaskDetailsUnlocked(nexusDir, details.ID)
	if current != nil {
		if details.Title != "" {
			current.Title = details.Title
		}
		current.Description = details.Description
		if details.Responsible != "" {
			current.Responsible = details.Responsible
		}
		if details.Tags != nil {
			current.Tags = details.Tags
		}
		current.DueDate = details.DueDate
		return saveTaskDetailsInternal(nexusDir, current)
	}

	return saveTaskDetailsInternal(nexusDir, details)
}

// AddComment adiciona um comentário à linha do tempo da tarefa
func AddComment(nexusDir, taskID, author, avatar, text string) (*TaskComment, error) {
	cardMutex.Lock()
	defer cardMutex.Unlock()

	text = strings.TrimSpace(text)
	if text == "" {
		return nil, fmt.Errorf("texto do comentário não pode ser vazio")
	}

	if author == "" {
		author = "Lucivaldo Junior"
	}
	if avatar == "" {
		avatar = "👨‍💻"
	}

	details, err := getTaskDetailsUnlocked(nexusDir, taskID)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	comment := TaskComment{
		ID:        fmt.Sprintf("comment-%d", now.UnixNano()),
		Author:    author,
		Avatar:    avatar,
		Text:      text,
		CreatedAt: now.Format("02/01/2006, 15:04"),
	}

	details.Comments = append([]TaskComment{comment}, details.Comments...)
	if err := saveTaskDetailsInternal(nexusDir, details); err != nil {
		return nil, err
	}
	return &comment, nil
}

// DeleteComment remove um comentário da tarefa
func DeleteComment(nexusDir, taskID, commentID string) error {
	cardMutex.Lock()
	defer cardMutex.Unlock()

	details, err := getTaskDetailsUnlocked(nexusDir, taskID)
	if err != nil {
		return err
	}

	updated := []TaskComment{}
	for _, c := range details.Comments {
		if c.ID != commentID {
			updated = append(updated, c)
		}
	}
	details.Comments = updated
	return saveTaskDetailsInternal(nexusDir, details)
}

// AddLink adiciona um link aos anexos do card
func AddLink(nexusDir, taskID, title, url string) (*TaskLink, error) {
	cardMutex.Lock()
	defer cardMutex.Unlock()

	url = strings.TrimSpace(url)
	if url == "" {
		return nil, fmt.Errorf("URL do link é obrigatória")
	}
	title = strings.TrimSpace(title)
	if title == "" {
		title = url
	}

	details, err := getTaskDetailsUnlocked(nexusDir, taskID)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	link := TaskLink{
		ID:        fmt.Sprintf("link-%d", now.UnixNano()),
		Title:     title,
		URL:       url,
		CreatedAt: now.Format("02/01/2006, 15:04"),
	}

	details.Links = append(details.Links, link)
	if err := saveTaskDetailsInternal(nexusDir, details); err != nil {
		return nil, err
	}
	return &link, nil
}

// DeleteLink remove um link do card
func DeleteLink(nexusDir, taskID, linkID string) error {
	cardMutex.Lock()
	defer cardMutex.Unlock()

	details, err := getTaskDetailsUnlocked(nexusDir, taskID)
	if err != nil {
		return err
	}

	updated := []TaskLink{}
	for _, l := range details.Links {
		if l.ID != linkID {
			updated = append(updated, l)
		}
	}
	details.Links = updated
	return saveTaskDetailsInternal(nexusDir, details)
}

// AddAttachment registra um anexo salvo em disco
func AddAttachment(nexusDir, taskID, filename, relPath, sizeStr, fileType string) (*TaskAttachment, error) {
	cardMutex.Lock()
	defer cardMutex.Unlock()

	details, err := getTaskDetailsUnlocked(nexusDir, taskID)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	att := TaskAttachment{
		ID:        fmt.Sprintf("att-%d", now.UnixNano()),
		Name:      filename,
		Path:      relPath,
		Size:      sizeStr,
		Type:      fileType,
		CreatedAt: now.Format("02/01/2006, 15:04"),
	}

	details.Attachments = append(details.Attachments, att)
	if err := saveTaskDetailsInternal(nexusDir, details); err != nil {
		return nil, err
	}
	return &att, nil
}

// DeleteAttachment remove um anexo do card e deleta o arquivo em disco
func DeleteAttachment(nexusDir, taskID, attID string) error {
	cardMutex.Lock()
	defer cardMutex.Unlock()

	details, err := getTaskDetailsUnlocked(nexusDir, taskID)
	if err != nil {
		return err
	}

	updated := []TaskAttachment{}
	for _, a := range details.Attachments {
		if a.ID == attID {
			fullPath := filepath.Join(nexusDir, a.Path)
			_ = os.Remove(fullPath)
		} else {
			updated = append(updated, a)
		}
	}
	details.Attachments = updated
	return saveTaskDetailsInternal(nexusDir, details)
}
