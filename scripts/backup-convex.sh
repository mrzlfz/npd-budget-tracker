#!/bin/bash

################################################################################
# Convex Backup Script
# 
# This script creates a backup of the Convex database and stores it locally
# with optional cloud storage upload.
#
# Usage: ./scripts/backup-convex.sh
################################################################################

set -e

# Configuration
BACKUP_DIR="./backups/convex/daily"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_NAME="backup_$DATE"
BACKUP_FILE="$BACKUP_DIR/$BACKUP_NAME.json"
LOG_FILE="./logs/backup.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create directories if they don't exist
mkdir -p "$BACKUP_DIR"
mkdir -p "./logs"

# Logging function
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

# Start backup
log "========================================="
log "Starting Convex backup process"
log "========================================="

# Check if Convex CLI is available
if ! command -v npx &> /dev/null; then
  log_error "npx command not found. Please install Node.js and npm."
  exit 1
fi

# Export all tables
log "Exporting Convex data..."
if npx convex export --path "$BACKUP_FILE" 2>&1 | tee -a "$LOG_FILE"; then
  log_success "Data exported successfully"
else
  log_error "Failed to export data"
  exit 1
fi

# Verify backup file exists and is not empty
if [ ! -f "$BACKUP_FILE" ]; then
  log_error "Backup file not created"
  exit 1
fi

BACKUP_SIZE=$(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE" 2>/dev/null)
if [ "$BACKUP_SIZE" -lt 100 ]; then
  log_error "Backup file is too small ($BACKUP_SIZE bytes). Possible backup failure."
  exit 1
fi

log_success "Backup file created: $BACKUP_FILE ($(numfmt --to=iec-i --suffix=B $BACKUP_SIZE 2>/dev/null || echo $BACKUP_SIZE bytes))"

# Create metadata file
log "Creating metadata file..."
cat > "$BACKUP_DIR/${BACKUP_NAME}_metadata.json" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "environment": "${CONVEX_DEPLOYMENT:-unknown}",
  "backup_size": $BACKUP_SIZE,
  "backup_type": "full",
  "created_by": "$(whoami)",
  "hostname": "$(hostname)",
  "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')"
}
EOF

log_success "Metadata file created"

# Compress backup
log "Compressing backup..."
if gzip -f "$BACKUP_FILE"; then
  COMPRESSED_SIZE=$(stat -f%z "${BACKUP_FILE}.gz" 2>/dev/null || stat -c%s "${BACKUP_FILE}.gz" 2>/dev/null)
  COMPRESSION_RATIO=$(awk "BEGIN {printf \"%.1f\", ($BACKUP_SIZE/$COMPRESSED_SIZE)}")
  log_success "Backup compressed (${COMPRESSION_RATIO}x compression ratio)"
else
  log_warning "Failed to compress backup, keeping uncompressed version"
fi

# Optional: Upload to cloud storage
# Uncomment and configure based on your cloud provider

# AWS S3
# if [ -n "$AWS_BACKUP_BUCKET" ]; then
#   log "Uploading to AWS S3..."
#   if aws s3 cp "${BACKUP_FILE}.gz" "s3://$AWS_BACKUP_BUCKET/convex-backups/" 2>&1 | tee -a "$LOG_FILE"; then
#     log_success "Backup uploaded to S3"
#   else
#     log_warning "Failed to upload to S3"
#   fi
# fi

# Google Cloud Storage
# if [ -n "$GCS_BACKUP_BUCKET" ]; then
#   log "Uploading to Google Cloud Storage..."
#   if gsutil cp "${BACKUP_FILE}.gz" "gs://$GCS_BACKUP_BUCKET/convex-backups/" 2>&1 | tee -a "$LOG_FILE"; then
#     log_success "Backup uploaded to GCS"
#   else
#     log_warning "Failed to upload to GCS"
#   fi
# fi

# Clean up old backups (keep last 90 days)
log "Cleaning up old backups..."
DELETED_COUNT=$(find "$BACKUP_DIR" -name "backup_*.json.gz" -mtime +90 -delete -print | wc -l)
if [ "$DELETED_COUNT" -gt 0 ]; then
  log_success "Deleted $DELETED_COUNT old backup(s)"
else
  log "No old backups to delete"
fi

# Summary
log "========================================="
log_success "Backup completed successfully!"
log "Backup location: ${BACKUP_FILE}.gz"
log "========================================="

# Exit successfully
exit 0

