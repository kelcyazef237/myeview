package dto

// RegisterRequest holds validated data for user registration.
type RegisterRequest struct {
	Email            string `json:"email" binding:"required,email,max=255"`
	Password         string `json:"password" binding:"required,min=8,max=128"`
	Name             string `json:"name" binding:"required,min=2,max=255"`
	OrganizationName string `json:"organization_name" binding:"required,min=2,max=255"`
}

// LoginRequest holds validated data for user login.
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// RefreshRequest holds validated data for token refresh.
type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}
