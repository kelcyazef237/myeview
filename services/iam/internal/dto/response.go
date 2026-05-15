package dto

import (
	"github.com/myeview/myeview/services/iam/internal/domain"
)

// AuthResponse is returned after successful login or registration.
type AuthResponse struct {
	AccessToken  string       `json:"access_token"`
	RefreshToken string       `json:"refresh_token"`
	User         UserResponse `json:"user"`
}

// UserResponse is a safe representation of a user (no password hash).
type UserResponse struct {
	ID               string `json:"id"`
	Email            string `json:"email"`
	Name             string `json:"name"`
	Role             string `json:"role"`
	OrganizationID   string `json:"organization_id"`
	OrganizationName string `json:"organization_name"`
	AvatarURL        string `json:"avatar_url,omitempty"`
	CreatedAt        string `json:"created_at"`
}

// ErrorResponse is a standardized API error.
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message,omitempty"`
	Code    string `json:"code,omitempty"`
}

// HealthResponse is the health check response.
type HealthResponse struct {
	Status  string `json:"status"`
	Service string `json:"service"`
	Version string `json:"version"`
}

// ToUserResponse converts a domain User to a safe UserResponse DTO.
func ToUserResponse(u *domain.User) UserResponse {
	avatarURL := ""
	if u.AvatarURL != nil {
		avatarURL = *u.AvatarURL
	}

	return UserResponse{
		ID:               u.ID.String(),
		Email:            u.Email,
		Name:             u.Name,
		Role:             string(u.Role),
		OrganizationID:   u.OrganizationID.String(),
		OrganizationName: u.OrganizationName,
		AvatarURL:        avatarURL,
		CreatedAt:        u.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
}
