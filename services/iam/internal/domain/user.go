package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// User represents a platform user entity.
type User struct {
	ID               uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Email            string         `gorm:"uniqueIndex;not null;size:255" json:"email"`
	PasswordHash     string         `gorm:"not null" json:"-"`
	Name             string         `gorm:"not null;size:255" json:"name"`
	Role             Role           `gorm:"type:varchar(20);not null;default:'viewer'" json:"role"`
	OrganizationID   uuid.UUID      `gorm:"type:uuid;not null;index" json:"organization_id"`
	OrganizationName string         `gorm:"-" json:"organization_name,omitempty"`
	AvatarURL        *string        `gorm:"size:512" json:"avatar_url,omitempty"`
	IsActive         bool           `gorm:"not null;default:true" json:"is_active"`
	LastLoginAt      *time.Time     `json:"last_login_at,omitempty"`
	CreatedAt        time.Time      `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt        time.Time      `gorm:"autoUpdateTime" json:"updated_at"`
	DeletedAt        gorm.DeletedAt `gorm:"index" json:"-"`

	// Relations (loaded when needed)
	Organization *Organization `gorm:"foreignKey:OrganizationID" json:"-"`
}

// Organization represents a tenant/company.
type Organization struct {
	ID        uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name      string         `gorm:"not null;size:255;uniqueIndex" json:"name"`
	Slug      string         `gorm:"not null;size:255;uniqueIndex" json:"slug"`
	CreatedAt time.Time      `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time      `gorm:"autoUpdateTime" json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// ── Repository Interfaces ──
// Interface-driven design for testability and clean architecture.

// UserRepository defines the contract for user persistence operations.
type UserRepository interface {
	Create(ctx context.Context, user *User) error
	FindByID(ctx context.Context, id uuid.UUID) (*User, error)
	FindByEmail(ctx context.Context, email string) (*User, error)
	Update(ctx context.Context, user *User) error
}

// OrganizationRepository defines the contract for org persistence operations.
type OrganizationRepository interface {
	Create(ctx context.Context, org *Organization) error
	FindByID(ctx context.Context, id uuid.UUID) (*Organization, error)
	FindBySlug(ctx context.Context, slug string) (*Organization, error)
}

// ── Service Interfaces ──

// AuthService defines the contract for authentication business logic.
type AuthService interface {
	Register(ctx context.Context, email, password, name, orgName string) (*User, string, string, error)
	Login(ctx context.Context, email, password string) (*User, string, string, error)
	RefreshToken(ctx context.Context, refreshToken string) (string, error)
	GetProfile(ctx context.Context, userID uuid.UUID) (*User, error)
}
