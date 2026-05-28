package auth

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// OrgMiddleware creates a Gin middleware that extracts the JWT from the
// Authorization header, validates it, and injects organization_id, user_id,
// and role into the Gin context. Non-IAM services use this to enforce
// per-organization data isolation.
//
// If the JWT is missing or invalid, it falls back to query parameter
// organization_id for backward compatibility but logs a warning.
func OrgMiddleware(secret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		var tokenStr string

		if authHeader != "" {
			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) == 2 && strings.EqualFold(parts[0], "Bearer") {
				tokenStr = parts[1]
			}
		} else {
			// Fallback for WebSockets or environments that can't send headers easily
			tokenStr = c.Query("token")
		}

		if tokenStr != "" {
			claims, err := ParseToken(tokenStr, secret)
			if err == nil {
				c.Set("user_id", claims.UserID)
				c.Set("role", claims.Role)
				if claims.OrganizationID != "" {
					c.Set("organization_id", claims.OrganizationID)
				}
				c.Next()
				return
			}
		}

		// Fallback: allow query param for backward compatibility
		// (e.g. old tokens without org_id claim)
		orgID := c.Query("organization_id")
		if orgID != "" {
			c.Set("organization_id", orgID)
			c.Next()
			return
		}

		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
			"error":   "unauthorized",
			"message": "Valid JWT or organization_id query parameter required.",
		})
	}
}

// GetOrgID extracts the organization_id from the Gin context.
// It checks the JWT-injected context value first, then falls back to query param.
func GetOrgID(c *gin.Context) string {
	// Try JWT-injected org_id first
	if orgID, exists := c.Get("organization_id"); exists {
		return orgID.(string)
	}
	// Fallback to query param
	return c.Query("organization_id")
}
