#!/bin/bash

################################################################################
# Convex Backup Verification Script
# 
# This script verifies the integrity and completeness of Convex backups.
#
# Usage: ./scripts/verify-backup.sh [backup-file]
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="./backups/convex/daily"
LOG_FILE="./logs/verify-backup.log"

# Create log directory
mkdir -p "./logs"

# Logging functions
log() {
  echo "[$(date +%Y-%m-%d\ %H:%M:%S)] $1" | tee -a "$LOG_FILE"
}

log_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

log_error() {
  echo -e "${RED}✗ $1${NC}"
}

log_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

log_info() {
  echo -e "${BLUE}ℹ $1${NC}"
}

# Determine backup file
if [ -n "$1" ]; then
  BACKUP_FILE="$1"
else
  # Find most recent backup
  BACKUP_FILE=$(find "$BACKUP_DIR" -name "backup_*.json.gz" -type f -printf '%T@ %p\n' 2>/dev/null | sort -rn | head -1 | cut -d' ' -f2-)
  
  if [ -z "$BACKUP_FILE" ]; then
    log_error "No backup files found in $BACKUP_DIR"
    exit 1
  fi
fi

# Start verification
echo ""
echo "========================================="
echo "Convex Backup Verification"
echo "========================================="
echo ""

log_info "Verifying backup: $BACKUP_FILE"
echo ""

# Test 1: File exists
echo -n "Test 1: Backup file exists... "
if [ -f "$BACKUP_FILE" ]; then
  log_success "PASS"
else
  log_error "FAIL - File not found"
  exit 1
fi

# Test 2: File size
echo -n "Test 2: File size check... "
FILE_SIZE=$(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE" 2>/dev/null)
READABLE_SIZE=$(numfmt --to=iec-i --suffix=B $FILE_SIZE 2>/dev/null || echo "$FILE_SIZE bytes")

if [ "$FILE_SIZE" -gt 1048576 ]; then  # > 1MB
  log_success "PASS ($READABLE_SIZE)"
elif [ "$FILE_SIZE" -gt 100 ]; then  # > 100 bytes
  log_warning "WARNING ($READABLE_SIZE - seems small)"
else
  log_error "FAIL ($READABLE_SIZE - too small)"
  exit 1
fi

# Test 3: File is readable
echo -n "Test 3: File is readable... "
if [ -r "$BACKUP_FILE" ]; then
  log_success "PASS"
else
  log_error "FAIL - Cannot read file"
  exit 1
fi

# Test 4: Decompress if needed
TEMP_FILE=""
if [[ "$BACKUP_FILE" == *.gz ]]; then
  echo -n "Test 4: Decompression... "
  TEMP_FILE="/tmp/backup_verify_$(date +%s).json"
  if gunzip -c "$BACKUP_FILE" > "$TEMP_FILE" 2>/dev/null; then
    log_success "PASS"
    BACKUP_FILE="$TEMP_FILE"
  else
    log_error "FAIL - Cannot decompress"
    exit 1
  fi
else
  echo -n "Test 4: File format... "
  log_success "PASS (uncompressed)"
fi

# Test 5: Valid JSON
echo -n "Test 5: Valid JSON structure... "
if jq empty "$BACKUP_FILE" 2>/dev/null; then
  log_success "PASS"
else
  log_error "FAIL - Invalid JSON"
  [ -n "$TEMP_FILE" ] && rm -f "$TEMP_FILE"
  exit 1
fi

# Test 6: Table count
echo -n "Test 6: Table count... "
TABLE_COUNT=$(jq 'length' "$BACKUP_FILE" 2>/dev/null)
if [ "$TABLE_COUNT" -gt 0 ]; then
  log_success "PASS ($TABLE_COUNT tables)"
else
  log_error "FAIL - No tables found"
  [ -n "$TEMP_FILE" ] && rm -f "$TEMP_FILE"
  exit 1
fi

# Test 7: Expected tables
echo -n "Test 7: Critical tables present... "
EXPECTED_TABLES=("organizations" "users" "npd" "sp2d")
MISSING_TABLES=()

for table in "${EXPECTED_TABLES[@]}"; do
  if ! jq -e "has(\"$table\")" "$BACKUP_FILE" > /dev/null 2>&1; then
    MISSING_TABLES+=("$table")
  fi
done

if [ ${#MISSING_TABLES[@]} -eq 0 ]; then
  log_success "PASS"
else
  log_warning "WARNING - Missing tables: ${MISSING_TABLES[*]}"
fi

# Test 8: Data in tables
echo -n "Test 8: Tables contain data... "
EMPTY_TABLES=()

for table in "${EXPECTED_TABLES[@]}"; do
  COUNT=$(jq -r ".[\"$table\"] | length" "$BACKUP_FILE" 2>/dev/null || echo "0")
  if [ "$COUNT" -eq 0 ]; then
    EMPTY_TABLES+=("$table")
  fi
done

if [ ${#EMPTY_TABLES[@]} -eq 0 ]; then
  log_success "PASS"
else
  log_warning "WARNING - Empty tables: ${EMPTY_TABLES[*]}"
fi

# Test 9: Metadata file
echo -n "Test 9: Metadata file exists... "
METADATA_FILE="${BACKUP_FILE%.json}_metadata.json"
METADATA_FILE="${METADATA_FILE%.gz}_metadata.json"

if [ -f "$METADATA_FILE" ]; then
  log_success "PASS"
  
  # Show metadata
  echo ""
  echo "Backup Metadata:"
  echo "----------------"
  jq -r 'to_entries | .[] | "  \(.key): \(.value)"' "$METADATA_FILE" 2>/dev/null || echo "  (Could not parse metadata)"
else
  log_warning "WARNING - No metadata file"
fi

# Test 10: Backup age
echo -n "Test 10: Backup freshness... "
if [[ "$BACKUP_FILE" =~ backup_([0-9]{4}-[0-9]{2}-[0-9]{2}) ]]; then
  BACKUP_DATE="${BASH_REMATCH[1]}"
  BACKUP_EPOCH=$(date -d "$BACKUP_DATE" +%s 2>/dev/null || date -j -f "%Y-%m-%d" "$BACKUP_DATE" +%s 2>/dev/null)
  CURRENT_EPOCH=$(date +%s)
  AGE_DAYS=$(( ($CURRENT_EPOCH - $BACKUP_EPOCH) / 86400 ))
  
  if [ "$AGE_DAYS" -le 1 ]; then
    log_success "PASS ($AGE_DAYS days old)"
  elif [ "$AGE_DAYS" -le 7 ]; then
    log_warning "WARNING ($AGE_DAYS days old)"
  else
    log_error "FAIL ($AGE_DAYS days old - too old)"
  fi
else
  log_warning "WARNING - Cannot determine backup age"
fi

# Cleanup
[ -n "$TEMP_FILE" ] && rm -f "$TEMP_FILE"

# Summary
echo ""
echo "========================================="
echo "Verification Summary"
echo "========================================="
echo ""
echo "Backup File: $BACKUP_FILE"
echo "File Size: $READABLE_SIZE"
echo "Tables: $TABLE_COUNT"
echo ""

# Detailed table info
echo "Table Details:"
echo "--------------"
for table in $(jq -r 'keys[]' "$BACKUP_FILE" 2>/dev/null); do
  COUNT=$(jq -r ".[\"$table\"] | length" "$BACKUP_FILE" 2>/dev/null)
  printf "  %-20s %10s records\n" "$table:" "$COUNT"
done

echo ""
log_success "All verification tests completed!"
echo ""

exit 0

