#!/usr/bin/env bash
# ============================================================
# Project Helix — Docker Deployment Verification Script
# ============================================================
# Usage:  bash scripts/docker_verify.sh
# Purpose: Verify all Docker services are healthy before demo
# ============================================================

set -euo pipefail

# --- Colours -----------------------------------------------------------
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

pass() { echo -e "  ${GREEN}✅ PASS${RESET}  $1"; }
fail() { echo -e "  ${RED}❌ FAIL${RESET}  $1"; FAILURES=$((FAILURES + 1)); }
warn() { echo -e "  ${YELLOW}⚠️  WARN${RESET}  $1"; }
info() { echo -e "  ${CYAN}ℹ️  INFO${RESET}  $1"; }

FAILURES=0

echo ""
echo -e "${BOLD}============================================================${RESET}"
echo -e "${BOLD}  Project Helix — Docker Service Verification              ${RESET}"
echo -e "${BOLD}============================================================${RESET}"
echo ""

# -----------------------------------------------------------------------
# 1. Docker availability
# -----------------------------------------------------------------------
echo -e "${BOLD}[1] Docker Environment${RESET}"
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version 2>&1)
    pass "Docker available: $DOCKER_VERSION"
else
    fail "Docker not found — install Docker Desktop and retry"
    exit 1
fi

if docker compose version &> /dev/null; then
    COMPOSE_VERSION=$(docker compose version 2>&1)
    pass "Docker Compose available: $COMPOSE_VERSION"
else
    fail "Docker Compose not found — requires Compose v2"
    exit 1
fi

echo ""

# -----------------------------------------------------------------------
# 2. Container status via docker compose ps
# -----------------------------------------------------------------------
echo -e "${BOLD}[2] Container Health Status${RESET}"

SERVICES=("helix_db" "helix_redis" "helix_minio" "helix_backend" "helix_frontend" "helix_nginx")
for svc in "${SERVICES[@]}"; do
    STATUS=$(docker inspect --format='{{.State.Health.Status}}' "$svc" 2>/dev/null || echo "not_found")
    RUNNING=$(docker inspect --format='{{.State.Running}}' "$svc" 2>/dev/null || echo "false")
    
    if [ "$STATUS" = "not_found" ] || [ "$RUNNING" != "true" ]; then
        fail "Container $svc is not running"
    elif [ "$STATUS" = "healthy" ] || [ "$STATUS" = "" ]; then
        pass "Container $svc is healthy (status: ${STATUS:-running})"
    elif [ "$STATUS" = "starting" ]; then
        warn "Container $svc healthcheck still starting — wait 30s and retry"
    else
        fail "Container $svc health status: $STATUS"
    fi
done

echo ""

# -----------------------------------------------------------------------
# 3. Network-level health checks
# -----------------------------------------------------------------------
echo -e "${BOLD}[3] Network Health Checks${RESET}"

# Nginx / Application gateway
if curl -sf "http://localhost/health" > /dev/null 2>&1; then
    pass "Nginx gateway reachable (http://localhost/health)"
else
    fail "Nginx gateway unreachable — check 'docker compose logs nginx'"
fi

# FastAPI health
HEALTH_RESPONSE=$(curl -sf "http://localhost/api/health" 2>/dev/null || echo "")
if echo "$HEALTH_RESPONSE" | grep -q '"healthy"'; then
    pass "FastAPI backend healthy (http://localhost/api/health)"
    info "Response: $HEALTH_RESPONSE"
else
    fail "FastAPI backend unreachable or unhealthy — check 'docker compose logs backend'"
fi

# MinIO S3 API
if curl -sf "http://localhost:9000/minio/health/live" > /dev/null 2>&1; then
    pass "MinIO S3 API healthy (http://localhost:9000)"
else
    fail "MinIO S3 API unreachable — check 'docker compose logs minio'"
fi

# API Docs (Swagger)
if curl -sf "http://localhost/api/docs" > /dev/null 2>&1; then
    pass "FastAPI Swagger docs available (http://localhost/api/docs)"
else
    warn "Swagger docs not reachable at http://localhost/api/docs"
fi

echo ""

# -----------------------------------------------------------------------
# 4. Authentication smoke test
# -----------------------------------------------------------------------
echo -e "${BOLD}[4] Authentication Smoke Test${RESET}"

AUTH_RESPONSE=$(curl -sf -X POST "http://localhost/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"demo@helix.ai","password":"helixdemo2024"}' 2>/dev/null || echo "")

if echo "$AUTH_RESPONSE" | grep -q '"access_token"'; then
    pass "Demo user login successful (demo@helix.ai)"
else
    warn "Demo user login failed — run 'docker compose exec backend python scripts/seed.py' to seed the database"
    info "Raw response: $AUTH_RESPONSE"
fi

echo ""

# -----------------------------------------------------------------------
# 5. MinIO Console
# -----------------------------------------------------------------------
echo -e "${BOLD}[5] MinIO Object Storage Console${RESET}"
if curl -sf "http://localhost:9001" > /dev/null 2>&1; then
    pass "MinIO Console available (http://localhost:9001)"
    info "Login: minioadmin / change_me_in_production (from .env)"
else
    warn "MinIO Console not reachable at http://localhost:9001"
fi

echo ""

# -----------------------------------------------------------------------
# 6. Summary
# -----------------------------------------------------------------------
echo -e "${BOLD}============================================================${RESET}"
if [ "$FAILURES" -eq 0 ]; then
    echo -e "${GREEN}${BOLD}  ✅ ALL CHECKS PASSED — Helix is ready for demo!${RESET}"
    echo -e "  Open ${CYAN}http://localhost${RESET} in your browser."
    echo -e "  Login: ${YELLOW}demo@helix.ai${RESET} / ${YELLOW}helixdemo2024${RESET}"
else
    echo -e "${RED}${BOLD}  ❌ $FAILURES check(s) FAILED — review errors above.${RESET}"
    echo ""
    echo "  Quick diagnostics:"
    echo "    docker compose ps         # Check container status"
    echo "    docker compose logs -f    # Stream all logs"
    echo "    docker compose restart    # Restart all services"
fi
echo -e "${BOLD}============================================================${RESET}"
echo ""
