#!/usr/bin/env bash
# ────────────────────────────────────────────────
# MYEVIEW — Local Development Launcher
# Starts infrastructure + all Go services locally (no Docker)
#
# Prerequisites:
#   - PostgreSQL (psql installed, server running)
#   - NATS Server (nats-server binary)
#   - Redis Server (redis-server binary)
#
# Usage:  ./scripts/dev-local.sh [start|stop|status]
# ────────────────────────────────────────────────
set -euo pipefail

# Ensure Go binaries are in PATH
export PATH="$PATH:$HOME/go/bin"

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PID_DIR="$ROOT_DIR/.dev-pids"
LOG_DIR="$ROOT_DIR/.dev-logs"

# Load env vars
if [ -f "$ROOT_DIR/.env" ]; then
  set -a
  source "$ROOT_DIR/.env"
  set +a
fi

mkdir -p "$PID_DIR" "$LOG_DIR"

# ── Colors ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()  { echo -e "${BLUE}[MYEVIEW]${NC} $1"; }
ok()   { echo -e "${GREEN}  ✓${NC} $1"; }
warn() { echo -e "${YELLOW}  ⚠${NC} $1"; }
fail() { echo -e "${RED}  ✗${NC} $1"; }

# ── Infrastructure ──

start_postgres() {
  if pg_isready -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -q 2>/dev/null; then
    ok "PostgreSQL already running"
  else
    log "Starting PostgreSQL..."
    if command -v pg_ctlcluster &>/dev/null; then
      sudo pg_ctlcluster 18 main start 2>/dev/null || sudo pg_ctlcluster 16 main start 2>/dev/null || true
    elif command -v pg_ctl &>/dev/null; then
      pg_ctl start -D /var/lib/postgresql/data -l "$LOG_DIR/postgres.log" &
    fi

    # Wait for ready
    for i in {1..10}; do
      pg_isready -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -q 2>/dev/null && break
      sleep 1
    done

    if pg_isready -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -q 2>/dev/null; then
      ok "PostgreSQL started"
    else
      fail "PostgreSQL failed to start — please start it manually"
      return 1
    fi
  fi

  # Create database if not exists
  export PGPASSWORD="${DB_PASSWORD:-myeview_password}"
  psql -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -U "${DB_USER:-myeview}" -d postgres \
    -tc "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME:-myeview}'" 2>/dev/null | grep -q 1 || \
    psql -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -U "${DB_USER:-myeview}" -d postgres \
    -c "CREATE DATABASE ${DB_NAME:-myeview}" 2>/dev/null && ok "Database '${DB_NAME:-myeview}' ready" || true
  unset PGPASSWORD
}

start_nats() {
  if pgrep -x nats-server &>/dev/null; then
    ok "NATS already running"
    return 0
  fi

  if ! command -v nats-server &>/dev/null; then
    warn "nats-server not found. Installing..."
    go install github.com/nats-io/nats-server/v2@latest 2>/dev/null || {
      fail "Failed to install NATS. Install manually: go install github.com/nats-io/nats-server/v2@latest"
      return 1
    }
  fi

  log "Starting NATS JetStream..."
  nats-server -js -p 4222 > "$LOG_DIR/nats.log" 2>&1 &
  echo $! > "$PID_DIR/nats.pid"
  sleep 1
  if pgrep -x nats-server &>/dev/null; then
    ok "NATS JetStream started (PID: $(cat $PID_DIR/nats.pid))"
  else
    fail "NATS failed to start"
  fi
}

start_redis() {
  if redis-cli ping &>/dev/null 2>&1; then
    ok "Redis already running"
    return 0
  fi

  log "Starting Redis..."
  redis-server --daemonize yes --logfile "$LOG_DIR/redis.log" --port "${REDIS_PORT:-6379}"
  sleep 1
  if redis-cli ping &>/dev/null 2>&1; then
    ok "Redis started"
  else
    fail "Redis failed to start"
  fi
}

# ── Go Services ──

start_service() {
  local name=$1
  local port=$2
  local dir="$ROOT_DIR/services/$name"

  if [ -f "$PID_DIR/$name.pid" ] && kill -0 "$(cat "$PID_DIR/$name.pid")" 2>/dev/null; then
    ok "$name already running (PID: $(cat $PID_DIR/$name.pid))"
    return 0
  fi

  log "Starting $name service on :$port..."
  cd "$dir"
  PORT=$port go run ./cmd/server/main.go > "$LOG_DIR/$name.log" 2>&1 &
  echo $! > "$PID_DIR/$name.pid"
  cd "$ROOT_DIR"
  ok "$name started (PID: $(cat $PID_DIR/$name.pid))"
}

# ── Commands ──

cmd_start() {
  echo ""
  echo -e "${BLUE}╔═══════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║   MYEVIEW — Local Development Mode    ║${NC}"
  echo -e "${BLUE}╚═══════════════════════════════════════╝${NC}"
  echo ""

  log "Starting infrastructure..."
  start_postgres
  start_nats
  start_redis

  echo ""
  log "Starting Go services..."
  start_service "iam"          8080
  start_service "discovery"    8081
  start_service "verification" 8082
  start_service "enrichment"   8083
  start_service "scoring"      8084
  start_service "graph"        8085
  start_service "compliance"   8086

  echo ""
  log "Starting frontend..."
  cd "$ROOT_DIR/apps/web"
  npm run dev > "$LOG_DIR/web.log" 2>&1 &
  echo $! > "$PID_DIR/web.pid"
  ok "Frontend started (PID: $(cat $PID_DIR/web.pid))"

  echo ""
  echo -e "${GREEN}════════════════════════════════════════${NC}"
  echo -e "${GREEN}  All services started!${NC}"
  echo -e "${GREEN}  Frontend:  http://localhost:3000${NC}"
  echo -e "${GREEN}  IAM:       http://localhost:8080/health${NC}"
  echo -e "${GREEN}  Discovery: http://localhost:8081/health${NC}"
  echo -e "${GREEN}  Graph:     http://localhost:8085/health${NC}"
  echo -e "${GREEN}  Logs:      $LOG_DIR/${NC}"
  echo -e "${GREEN}════════════════════════════════════════${NC}"
}

cmd_stop() {
  log "Stopping MYEVIEW services..."
  for pidfile in "$PID_DIR"/*.pid; do
    if [ -f "$pidfile" ]; then
      local name=$(basename "$pidfile" .pid)
      local pid=$(cat "$pidfile")
      if kill -0 "$pid" 2>/dev/null; then
        kill "$pid" 2>/dev/null && ok "Stopped $name (PID: $pid)"
      fi
      rm "$pidfile"
    fi
  done
  ok "All services stopped"
}

cmd_status() {
  log "Service status:"
  echo ""

  # Infrastructure
  pg_isready -h localhost -p 5432 -q 2>/dev/null && ok "PostgreSQL: running" || fail "PostgreSQL: stopped"
  pgrep -x nats-server &>/dev/null && ok "NATS: running" || fail "NATS: stopped"
  redis-cli ping &>/dev/null 2>&1 && ok "Redis: running" || fail "Redis: stopped"

  echo ""

  # Services
  for pidfile in "$PID_DIR"/*.pid; do
    if [ -f "$pidfile" ]; then
      local name=$(basename "$pidfile" .pid)
      local pid=$(cat "$pidfile")
      if kill -0 "$pid" 2>/dev/null; then
        ok "$name: running (PID: $pid)"
      else
        fail "$name: stopped (stale PID)"
      fi
    fi
  done
}

# ── Main ──
case "${1:-start}" in
  start)  cmd_start ;;
  stop)   cmd_stop ;;
  status) cmd_status ;;
  *)      echo "Usage: $0 {start|stop|status}" ;;
esac
