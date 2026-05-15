# ── Stage 1: Build ──
FROM golang:1.26-alpine AS builder

RUN apk add --no-cache git ca-certificates

WORKDIR /app

COPY go.work go.work.sum ./
COPY libs/ ./libs/
COPY services/scoring/ ./services/scoring/

WORKDIR /app/services/scoring
    ENV GOWORK=off
RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /scoring-server ./cmd/server/

# ── Stage 2: Runtime ──
FROM alpine:3.19

RUN apk add --no-cache ca-certificates tzdata
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /scoring-server /usr/local/bin/scoring-server

USER appuser

ENTRYPOINT ["scoring-server"]
