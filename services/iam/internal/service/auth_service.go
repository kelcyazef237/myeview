package service

import (
	"context"
	"errors"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"
	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"

	"github.com/myeview/myeview/libs/auth"
	"github.com/myeview/myeview/libs/logger"
	"github.com/myeview/myeview/services/iam/internal/config"
	"github.com/myeview/myeview/services/iam/internal/domain"
)

var (
	ErrUserExists      = errors.New("user with this email already exists")
	ErrInvalidCreds    = errors.New("invalid email or password")
	ErrUserNotFound    = errors.New("user not found")
	ErrUserInactive    = errors.New("user account is inactive")
	ErrInvalidToken    = errors.New("invalid or expired token")

	slugRegex = regexp.MustCompile(`[^a-z0-9]+`)
)

// authService implements domain.AuthService.
type authService struct {
	userRepo domain.UserRepository
	orgRepo  domain.OrganizationRepository
	cfg      *config.Config
}

// NewAuthService creates a new authentication service.
func NewAuthService(
	userRepo domain.UserRepository,
	orgRepo domain.OrganizationRepository,
	cfg *config.Config,
) domain.AuthService {
	return &authService{
		userRepo: userRepo,
		orgRepo:  orgRepo,
		cfg:      cfg,
	}
}

func (s *authService) Register(
	ctx context.Context,
	email, password, name, orgName string,
) (*domain.User, string, string, error) {
	// Check if user already exists
	existing, err := s.userRepo.FindByEmail(ctx, email)
	if err != nil {
		return nil, "", "", fmt.Errorf("checking existing user: %w", err)
	}
	if existing != nil {
		return nil, "", "", ErrUserExists
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, "", "", fmt.Errorf("hashing password: %w", err)
	}

	// Create or find organization
	slug := slugRegex.ReplaceAllString(strings.ToLower(orgName), "-")
	slug = strings.Trim(slug, "-")

	org, err := s.orgRepo.FindBySlug(ctx, slug)
	if err != nil {
		return nil, "", "", fmt.Errorf("finding organization: %w", err)
	}

	if org == nil {
		org = &domain.Organization{
			Name: orgName,
			Slug: slug,
		}
		if err := s.orgRepo.Create(ctx, org); err != nil {
			return nil, "", "", fmt.Errorf("creating organization: %w", err)
		}
		logger.Info("Organization created", zap.String("org_name", orgName), zap.String("org_id", org.ID.String()))
	}

	// Create user (first user in org gets admin role)
	user := &domain.User{
		Email:          email,
		PasswordHash:   string(hashedPassword),
		Name:           name,
		Role:           domain.RoleAdmin, // First user is admin
		OrganizationID: org.ID,
		IsActive:       true,
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, "", "", fmt.Errorf("creating user: %w", err)
	}

	user.OrganizationName = org.Name

	// Generate tokens
	accessToken, err := s.generateAccessToken(user)
	if err != nil {
		return nil, "", "", fmt.Errorf("generating access token: %w", err)
	}

	refreshToken, err := s.generateRefreshToken(user)
	if err != nil {
		return nil, "", "", fmt.Errorf("generating refresh token: %w", err)
	}

	logger.Info("User registered", zap.String("user_id", user.ID.String()), zap.String("email", email))

	return user, accessToken, refreshToken, nil
}

func (s *authService) Login(
	ctx context.Context,
	email, password string,
) (*domain.User, string, string, error) {
	user, err := s.userRepo.FindByEmail(ctx, email)
	if err != nil {
		return nil, "", "", fmt.Errorf("finding user: %w", err)
	}
	if user == nil {
		return nil, "", "", ErrInvalidCreds
	}

	if !user.IsActive {
		return nil, "", "", ErrUserInactive
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, "", "", ErrInvalidCreds
	}

	// Update last login
	now := time.Now()
	user.LastLoginAt = &now
	if err := s.userRepo.Update(ctx, user); err != nil {
		logger.Error("Failed to update last login", err)
	}

	// Generate tokens
	accessToken, err := s.generateAccessToken(user)
	if err != nil {
		return nil, "", "", fmt.Errorf("generating access token: %w", err)
	}

	refreshToken, err := s.generateRefreshToken(user)
	if err != nil {
		return nil, "", "", fmt.Errorf("generating refresh token: %w", err)
	}

	logger.Info("User logged in", zap.String("user_id", user.ID.String()))

	return user, accessToken, refreshToken, nil
}

func (s *authService) RefreshToken(ctx context.Context, refreshToken string) (string, error) {
	claims, err := auth.ParseToken(refreshToken, s.cfg.JWT.Secret)
	if err != nil {
		return "", ErrInvalidToken
	}

	userID, err := uuid.Parse(claims.UserID)
	if err != nil {
		return "", ErrInvalidToken
	}

	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return "", fmt.Errorf("finding user: %w", err)
	}
	if user == nil || !user.IsActive {
		return "", ErrInvalidToken
	}

	accessToken, err := s.generateAccessToken(user)
	if err != nil {
		return "", fmt.Errorf("generating access token: %w", err)
	}

	return accessToken, nil
}

func (s *authService) GetProfile(ctx context.Context, userID uuid.UUID) (*domain.User, error) {
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("finding user: %w", err)
	}
	if user == nil {
		return nil, ErrUserNotFound
	}
	return user, nil
}

// ── Token Helpers ──

func (s *authService) generateAccessToken(user *domain.User) (string, error) {
	return auth.GenerateToken(
		user.ID.String(),
		string(user.Role),
		s.cfg.JWT.Secret,
		s.cfg.JWT.AccessTokenExpiry,
	)
}

func (s *authService) generateRefreshToken(user *domain.User) (string, error) {
	return auth.GenerateToken(
		user.ID.String(),
		string(user.Role),
		s.cfg.JWT.Secret,
		s.cfg.JWT.RefreshTokenExpiry,
	)
}
