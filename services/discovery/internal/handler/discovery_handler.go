package handler

import (
	"context"
	"encoding/json"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/myeview/myeview/libs/auth"
	"github.com/myeview/myeview/libs/events"
	"github.com/myeview/myeview/services/discovery/internal/repository"
	"github.com/myeview/myeview/services/discovery/internal/service"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all for now
	},
}

type DiscoveryHandler struct {
	svc  *service.DiscoveryService
	ebus events.EventBus
	repo repository.AssetRepository
}

func NewDiscoveryHandler(svc *service.DiscoveryService, ebus events.EventBus, repo repository.AssetRepository) *DiscoveryHandler {
	return &DiscoveryHandler{
		svc:  svc,
		ebus: ebus,
		repo: repo,
	}
}

type StartRequest struct {
	Target  string            `json:"target" binding:"required"`
	Mode    string            `json:"mode" binding:"required,oneof=base advanced"`
	OrgID   string            `json:"organization_id"`
	APIKeys map[string]string `json:"api_keys"`
}

func (h *DiscoveryHandler) Start(c *gin.Context) {
	var req StartRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var orgID uuid.UUID
	var err error

	if req.OrgID != "" {
		orgID, err = uuid.Parse(req.OrgID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid organization_id in request body"})
			return
		}
	} else {
		// Extract from JWT / middleware Context
		contextOrgID := auth.GetOrgID(c)
		if contextOrgID != "" {
			orgID, err = uuid.Parse(contextOrgID)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "invalid organization_id in auth context"})
				return
			}
		} else {
			// Mock OrgID for testing if not provided at all
			orgID = uuid.New()
		}
	}

	h.svc.StartDiscovery(orgID, req.Target, req.Mode, req.APIKeys)

	c.JSON(http.StatusOK, gin.H{
		"message":         "Discovery (" + req.Mode + ") started for " + req.Target,
		"organization_id": orgID.String(),
		"mode":            req.Mode,
	})
}

// GetAssets returns all discovered assets for an organization
func (h *DiscoveryHandler) GetAssets(c *gin.Context) {
	orgID := auth.GetOrgID(c)
	if orgID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "organization_id required"})
		return
	}

	assets, err := h.repo.FindByOrg(c.Request.Context(), orgID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, assets)
}

// Stream upgrades the connection to WebSocket and streams discovery events
func (h *DiscoveryHandler) Stream(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Failed to upgrade websocket: %v", err)
		return
	}
	defer conn.Close()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	userOrgID := auth.GetOrgID(c)

	// Subscribe to discovered events
	err = h.ebus.Subscribe(ctx, "asset.discovered.>", "", func(data []byte) error {
		var event events.AssetDiscoveredEvent
		if err := json.Unmarshal(data, &event); err != nil {
			return err
		}
		
		// Enforce account isolation
		if userOrgID != "" && event.OrganizationID != userOrgID {
			return nil // Skip events not belonging to this user's org
		}
		
		msg := map[string]interface{}{
			"type": "asset_discovered",
			"data": event,
		}
		
		if err := conn.WriteJSON(msg); err != nil {
			log.Printf("Websocket write error: %v", err)
			cancel() // Signal to stop subscription
		}
		return nil
	})

	if err != nil {
		log.Printf("Failed to subscribe to discovered events: %v", err)
		return
	}

	// Subscribe to verified events
	err = h.ebus.Subscribe(ctx, "asset.verified.>", "", func(data []byte) error {
		var event events.AssetVerifiedEvent
		if err := json.Unmarshal(data, &event); err != nil {
			return err
		}
		
		if userOrgID != "" && event.OrganizationID != userOrgID {
			return nil
		}
		
		msg := map[string]interface{}{
			"type": "asset_verified",
			"data": event,
		}
		
		if err := conn.WriteJSON(msg); err != nil {
			log.Printf("Websocket write error: %v", err)
			cancel()
		}
		return nil
	})

	if err != nil {
		log.Printf("Failed to subscribe to verified events: %v", err)
		return
	}

	// Subscribe to enriched events
	err = h.ebus.Subscribe(ctx, "asset.enriched.>", "", func(data []byte) error {
		var event events.AssetEnrichedEvent
		if err := json.Unmarshal(data, &event); err != nil {
			return err
		}
		
		if userOrgID != "" && event.OrganizationID != userOrgID {
			return nil
		}
		
		msg := map[string]interface{}{
			"type": "asset_enriched",
			"data": event,
		}
		
		if err := conn.WriteJSON(msg); err != nil {
			log.Printf("Websocket write error: %v", err)
			cancel()
		}
		return nil
	})

	if err != nil {
		log.Printf("Failed to subscribe to enriched events: %v", err)
		return
	}

	// Subscribe to scored events
	err = h.ebus.Subscribe(ctx, "risk.scored.>", "", func(data []byte) error {
		var event events.RiskScoredEvent
		if err := json.Unmarshal(data, &event); err != nil {
			return err
		}
		
		if userOrgID != "" && event.OrganizationID != userOrgID {
			return nil
		}
		
		msg := map[string]interface{}{
			"type": "risk_scored",
			"data": event,
		}
		
		if err := conn.WriteJSON(msg); err != nil {
			log.Printf("Websocket write error: %v", err)
			cancel()
		}
		return nil
	})

	if err != nil {
		log.Printf("Failed to subscribe to scored events: %v", err)
		return
	}

	// Keep connection alive until client disconnects
	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			break
		}
	}
}
