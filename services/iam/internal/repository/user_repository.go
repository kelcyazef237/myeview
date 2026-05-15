package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/myeview/myeview/services/iam/internal/domain"
)

// userRepository implements domain.UserRepository using GORM.
type userRepository struct {
	db *gorm.DB
}

// NewUserRepository creates a new GORM-backed user repository.
func NewUserRepository(db *gorm.DB) domain.UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) Create(ctx context.Context, user *domain.User) error {
	result := r.db.WithContext(ctx).Create(user)
	if result.Error != nil {
		return fmt.Errorf("failed to create user: %w", result.Error)
	}
	return nil
}

func (r *userRepository) FindByID(ctx context.Context, id uuid.UUID) (*domain.User, error) {
	var user domain.User
	result := r.db.WithContext(ctx).
		Preload("Organization").
		First(&user, "id = ?", id)

	if errors.Is(result.Error, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if result.Error != nil {
		return nil, fmt.Errorf("failed to find user by ID: %w", result.Error)
	}

	// Populate convenience field
	if user.Organization != nil {
		user.OrganizationName = user.Organization.Name
	}
	return &user, nil
}

func (r *userRepository) FindByEmail(ctx context.Context, email string) (*domain.User, error) {
	var user domain.User
	result := r.db.WithContext(ctx).
		Preload("Organization").
		First(&user, "email = ?", email)

	if errors.Is(result.Error, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if result.Error != nil {
		return nil, fmt.Errorf("failed to find user by email: %w", result.Error)
	}

	if user.Organization != nil {
		user.OrganizationName = user.Organization.Name
	}
	return &user, nil
}

func (r *userRepository) Update(ctx context.Context, user *domain.User) error {
	result := r.db.WithContext(ctx).Save(user)
	if result.Error != nil {
		return fmt.Errorf("failed to update user: %w", result.Error)
	}
	return nil
}

// ── Organization Repository ──

// orgRepository implements domain.OrganizationRepository using GORM.
type orgRepository struct {
	db *gorm.DB
}

// NewOrganizationRepository creates a new GORM-backed organization repository.
func NewOrganizationRepository(db *gorm.DB) domain.OrganizationRepository {
	return &orgRepository{db: db}
}

func (r *orgRepository) Create(ctx context.Context, org *domain.Organization) error {
	result := r.db.WithContext(ctx).Create(org)
	if result.Error != nil {
		return fmt.Errorf("failed to create organization: %w", result.Error)
	}
	return nil
}

func (r *orgRepository) FindByID(ctx context.Context, id uuid.UUID) (*domain.Organization, error) {
	var org domain.Organization
	result := r.db.WithContext(ctx).First(&org, "id = ?", id)

	if errors.Is(result.Error, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if result.Error != nil {
		return nil, fmt.Errorf("failed to find organization by ID: %w", result.Error)
	}
	return &org, nil
}

func (r *orgRepository) FindBySlug(ctx context.Context, slug string) (*domain.Organization, error) {
	var org domain.Organization
	result := r.db.WithContext(ctx).First(&org, "slug = ?", slug)

	if errors.Is(result.Error, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if result.Error != nil {
		return nil, fmt.Errorf("failed to find organization by slug: %w", result.Error)
	}
	return &org, nil
}
