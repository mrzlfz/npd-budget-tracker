#!/bin/bash

################################################################################
# Convex Restore Script
# 
# This script restores a Convex database from a backup file.
# 
# ⚠️  WARNING: This will modify your database. Always test in staging first!
#
# Usage: ./scripts/restore-convex.sh <backup-file> [--replace]
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
LOG_FILE="./logs/restore.log"

# Create log directory
mkdir -p "./logs"

# Logging functions
log() {
  echo "[$(date +%Y-%m-%d\ %H:%M:%S)] $1" | tee -a "$LOG_FILE"
}

log_success() {
  echo -e "${GREEN}[$(date +%Y-%m-%d\ %H:%M:%S)] ✓ $1${NC}" | tee -a "$LOG_FILE"
}

log_error() {
  echo -e "${RED}[$(date +%Y-%m-%d\ %H:%M:%S)] ✗ $1${NC}" | tee -a "$LOG_FILE"
}

log_warning() {
  echo -e "${YELLOW}[$(date +%Y-%m-%d\ %H:%M:%S)] ⚠ $1${NC}" | tee -a "$LOG_FILE"
}

log_info() {
  echo -e "${BLUE}[$(date +%Y-%m-%d\ %H:%M:%S)] ℹ $1${NC}" | tee -a "$LOG_FILE"
}

# Check arguments
if [ -z "$1" ]; then
  log_error "Usage: $0 <backup-file> [--replace]"
  log_info "Example: $0 ./backups/convex/daily/backup_2025-11-01_02-00-00.json.gz"
  exit 1
fi

BACKUP_FILE="$1"
REPLACE_MODE=""

if [ "$2" == "--replace" ]; then
  REPLACE_MODE="--mode replace"
  log_warning "Replace mode enabled - existing data will be deleted!"
fi

# Start restore
log "========================================="
log "Starting Convex restore process"
log "========================================="

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
  log_error "Backup file not found: $BACKUP_FILE"
  exit 1
fi

log_info "Backup file: $BACKUP_FILE"
log_info "Current deployment: ${CONVEX_DEPLOYMENT:-default}"

# Check if file is compressed
if [[ "$BACKUP_FILE" == *.gz ]]; then
  log "Decompressing backup file..."
  TEMP_FILE="${BACKUP_FILE%.gz}"
  if gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"; then
    log_success "Backup decompressed"
    BACKUP_FILE="$TEMP_FILE"
    CLEANUP_TEMP=true
  else
    log_error "Failed to decompress backup"
    exit 1
  fi
fi

# Verify JSON structure
log "Verifying backup file structure..."
if ! jq empty "$BACKUP_FILE" 2>/dev/null; then
  log_error "Invalid JSON in backup file"
  [ "$CLEANUP_TEMP" == true ] && rm -f "$BACKUP_FILE"
  exit 1
fi

log_success "Backup file is valid JSON"

# Show backup info
TABLE_COUNT=$(jq 'length' "$BACKUP_FILE")
log_info "Tables in backup: $TABLE_COUNT"

# Safety confirmation
echo ""
echo -e "${YELLOW}=========================================${NC}"
echo -e "${YELLOW}⚠️  WARNING: You are about to restore data${NC}"
echo -e "${YELLOW}=========================================${NC}"
echo -e "Backup file: ${BLUE}$BACKUP_FILE${NC}"
echo -e "Deployment: ${BLUE}${CONVEX_DEPLOYMENT:-default}${NC}"
echo -e "Mode: ${BLUE}${REPLACE_MODE:-merge (safe)}${NC}"
echo -e "Tables: ${BLUE}$TABLE_COUNT${NC}"
echo ""
echo -e "${RED}This operation will modify your database!${NC}"
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  log_warning "Restore cancelled by user"
  [ "$CLEANUP_TEMP" == true ] && rm -f "$BACKUP_FILE"
  exit 0
fi

# Create a safety backup before restore
log "Creating safety backup of current data..."
SAFETY_BACKUP="./backups/convex/safety/pre-restore_$(date +%Y-%m-%d_%H-%M-%S).json"
mkdir -p "./backups/convex/safety"

if npx convex export --path "$SAFETY_BACKUP" 2>&1 | tee -a "$LOG_FILE"; then
  log_success "Safety backup created: $SAFETY_BACKUP"
else
  log_error "Failed to create safety backup. Aborting restore."
  [ "$CLEANUP_TEMP" == true ] && rm -f "$BACKUP_FILE"
  exit 1
fi

# Perform restore
log "Restoring data from backup..."
if npx convex import $REPLACE_MODE --path "$BACKUP_FILE" 2>&1 | tee -a "$LOG_FILE"; then
  log_success "Data restored successfully"
else
  log_error "Failed to restore data"
  log_warning "You can restore from safety backup: $SAFETY_BACKUP"
  [ "$CLEANUP_TEMP" == true ] && rm -f "$BACKUP_FILE"
  exit 1
fi

# Cleanup temporary file
if [ "$CLEANUP_TEMP" == true ]; then
  rm -f "$BACKUP_FILE"
  log "Cleaned up temporary files"
fi

# Verify restoration
log "Verifying restored data..."
if npx convex data 2>&1 | tee -a "$LOG_FILE"; then
  log_success "Data verification completed"
else
  log_warning "Could not verify data"
fi

# Summary
log "========================================="
log_success "Restore completed successfully!"
log_info "Safety backup: $SAFETY_BACKUP"
log "========================================="

echo ""
echo -e "${GREEN}✓ Restoration complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Verify data integrity in your application"
echo "2. Run any necessary data migrations"
echo "3. Test critical functionality"
echo "4. Monitor for any issues"
echo ""
echo -e "${BLUE}Safety backup location:${NC}"
echo "$SAFETY_BACKUP"
echo ""

# Exit successfully
exit 0

