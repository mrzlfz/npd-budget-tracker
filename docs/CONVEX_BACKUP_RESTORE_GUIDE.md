# Convex Backup & Restoration Guide

**Date:** November 1, 2025  
**Status:** 📋 TESTING PROCEDURES DOCUMENTED  
**Version:** 1.0

---

## Overview

This guide provides comprehensive procedures for backing up and restoring Convex data for the NPD Tracker application. Regular backups are essential for disaster recovery, data migration, and compliance requirements.

---

## Table of Contents

1. [Backup Methods](#backup-methods)
2. [Automated Backup Setup](#automated-backup-setup)
3. [Manual Backup Procedures](#manual-backup-procedures)
4. [Restoration Procedures](#restoration-procedures)
5. [Testing Backup/Restore](#testing-backuprestore)
6. [Backup Schedule](#backup-schedule)
7. [Retention Policy](#retention-policy)
8. [Disaster Recovery Plan](#disaster-recovery-plan)
9. [Troubleshooting](#troubleshooting)

---

## Backup Methods

Convex provides several methods for backing up data:

### 1. **Convex Snapshots (Recommended)**
- **Type:** Built-in Convex feature
- **Frequency:** Automatic (every 24 hours)
- **Retention:** 30 days
- **Cost:** Included in all plans
- **Pros:** Automatic, point-in-time recovery, fast
- **Cons:** Limited to 30 days, requires Convex dashboard access

### 2. **Export to JSON**
- **Type:** Manual export via Convex CLI
- **Frequency:** On-demand or scheduled
- **Retention:** Unlimited (stored externally)
- **Cost:** Free (storage costs apply)
- **Pros:** Full control, long-term storage, portable
- **Cons:** Manual process, requires scripting for automation

### 3. **Incremental Backups**
- **Type:** Custom solution using Convex queries
- **Frequency:** Configurable (hourly, daily)
- **Retention:** Unlimited
- **Cost:** Storage costs only
- **Pros:** Granular control, efficient
- **Cons:** Requires custom implementation

---

## Automated Backup Setup

### Method 1: Convex Built-in Snapshots

Convex automatically creates snapshots every 24 hours. No configuration needed!

**To access snapshots:**
1. Go to [Convex Dashboard](https://dashboard.convex.dev/)
2. Select your project
3. Navigate to **Settings** > **Snapshots**
4. View available snapshots (last 30 days)

### Method 2: Scheduled JSON Exports

Create a backup script that runs on a schedule:

#### Step 1: Create Backup Script

Create `scripts/backup-convex.sh`:

```bash
#!/bin/bash

# Convex Backup Script
# Usage: ./scripts/backup-convex.sh

set -e

# Configuration
BACKUP_DIR="./backups/convex"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.json"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "Starting Convex backup at $DATE..."

# Export all tables
npx convex export --path "$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_FILE"

echo "Backup completed: ${BACKUP_FILE}.gz"

# Optional: Upload to cloud storage (AWS S3, Google Cloud Storage, etc.)
# aws s3 cp "${BACKUP_FILE}.gz" "s3://your-bucket/convex-backups/"

# Clean up old backups (keep last 30 days)
find "$BACKUP_DIR" -name "backup_*.json.gz" -mtime +30 -delete

echo "Backup process completed successfully!"
```

#### Step 2: Make Script Executable

```bash
chmod +x scripts/backup-convex.sh
```

#### Step 3: Schedule with Cron (Linux/Mac)

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/npd-tracker && ./scripts/backup-convex.sh >> /var/log/convex-backup.log 2>&1
```

#### Step 4: Schedule with Task Scheduler (Windows)

1. Open Task Scheduler
2. Create Basic Task
3. Name: "Convex Daily Backup"
4. Trigger: Daily at 2:00 AM
5. Action: Start a program
6. Program: `bash`
7. Arguments: `/path/to/scripts/backup-convex.sh`

---

## Manual Backup Procedures

### Full Database Export

#### Using Convex CLI:

```bash
# Navigate to project directory
cd /mnt/c/Users/Rizal/Documents/trae_projects/npd-tracker

# Export all data to JSON
npx convex export --path ./backups/manual-backup-$(date +%Y%m%d).json

# Verify backup file
ls -lh ./backups/
```

#### Export Specific Tables:

```bash
# Export only NPD data
npx convex export --table npd --path ./backups/npd-backup.json

# Export multiple tables
npx convex export --table npd,sp2d,organizations --path ./backups/critical-data.json
```

### Backup with Metadata

Create a backup with metadata for better tracking:

```bash
#!/bin/bash

DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_DIR="./backups/convex"
BACKUP_NAME="backup_$DATE"

mkdir -p "$BACKUP_DIR/$BACKUP_NAME"

# Export data
npx convex export --path "$BACKUP_DIR/$BACKUP_NAME/data.json"

# Create metadata file
cat > "$BACKUP_DIR/$BACKUP_NAME/metadata.json" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "environment": "${CONVEX_DEPLOYMENT}",
  "version": "$(git rev-parse HEAD)",
  "tables_count": $(cat "$BACKUP_DIR/$BACKUP_NAME/data.json" | jq 'length'),
  "backup_type": "full",
  "created_by": "$(whoami)"
}
EOF

# Compress
tar -czf "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" -C "$BACKUP_DIR" "$BACKUP_NAME"
rm -rf "$BACKUP_DIR/$BACKUP_NAME"

echo "Backup created: $BACKUP_DIR/${BACKUP_NAME}.tar.gz"
```

---

## Restoration Procedures

### ⚠️ IMPORTANT: Pre-Restoration Checklist

Before restoring data:

- [ ] **Backup current data** (in case restoration fails)
- [ ] **Verify backup file integrity** (check file size, can open/read)
- [ ] **Stop application** (prevent data conflicts)
- [ ] **Notify users** (system will be unavailable)
- [ ] **Test in staging first** (never restore directly to production)

### Method 1: Restore from Convex Snapshot

1. Go to [Convex Dashboard](https://dashboard.convex.dev/)
2. Select your project
3. Navigate to **Settings** > **Snapshots**
4. Find the snapshot you want to restore
5. Click **Restore**
6. Confirm restoration
7. Wait for completion (usually 5-15 minutes)
8. Verify data integrity

### Method 2: Restore from JSON Export

#### Full Restoration:

```bash
# Navigate to project directory
cd /mnt/c/Users/Rizal/Documents/trae_projects/npd-tracker

# Stop the application (if running)
# Ctrl+C or stop the production server

# Import data from backup
npx convex import --path ./backups/backup_2025-11-01.json

# Verify restoration
npx convex data
```

#### Selective Table Restoration:

```bash
# Restore only specific tables
npx convex import --table npd --path ./backups/npd-backup.json

# Clear table before restore (destructive!)
npx convex import --table npd --replace --path ./backups/npd-backup.json
```

#### Restore with Conflict Resolution:

```bash
# Merge mode (keeps existing data, adds new)
npx convex import --mode merge --path ./backups/backup.json

# Replace mode (clears existing data)
npx convex import --mode replace --path ./backups/backup.json
```

---

## Testing Backup/Restore

### Test Plan

#### Test 1: Verify Backup Creation

```bash
# Create a test backup
npx convex export --path ./backups/test-backup.json

# Verify file exists and is not empty
ls -lh ./backups/test-backup.json

# Check JSON structure
head -n 20 ./backups/test-backup.json

# Verify all tables are included
cat ./backups/test-backup.json | jq 'keys'
```

**Expected Result:** Backup file created with all tables

#### Test 2: Test Restoration to Staging

```bash
# Switch to staging environment
export CONVEX_DEPLOYMENT=dev:staging-deployment-name

# Create a backup of staging (safety)
npx convex export --path ./backups/staging-before-test.json

# Restore from production backup
npx convex import --path ./backups/production-backup.json

# Verify data
npx convex data
```

**Expected Result:** Data successfully restored to staging

#### Test 3: Verify Data Integrity

Create a verification script `scripts/verify-backup.ts`:

```typescript
import { query } from './_generated/server';

export const verifyDataIntegrity = query(async ({ db }) => {
  const results = {
    timestamp: new Date().toISOString(),
    checks: [] as any[],
  };

  // Check NPD count
  const npdCount = await db.query('npd').collect();
  results.checks.push({
    table: 'npd',
    count: npdCount.length,
    status: npdCount.length > 0 ? 'OK' : 'WARNING',
  });

  // Check organizations count
  const orgsCount = await db.query('organizations').collect();
  results.checks.push({
    table: 'organizations',
    count: orgsCount.length,
    status: orgsCount.length > 0 ? 'OK' : 'WARNING',
  });

  // Check users count
  const usersCount = await db.query('users').collect();
  results.checks.push({
    table: 'users',
    count: usersCount.length,
    status: usersCount.length > 0 ? 'OK' : 'WARNING',
  });

  // Check SP2D count
  const sp2dCount = await db.query('sp2d').collect();
  results.checks.push({
    table: 'sp2d',
    count: sp2dCount.length,
    status: 'OK',
  });

  // Check for orphaned records
  const npdWithoutOrg = await db
    .query('npd')
    .filter((q) => q.eq(q.field('organizationId'), undefined))
    .collect();
  
  results.checks.push({
    check: 'orphaned_npd',
    count: npdWithoutOrg.length,
    status: npdWithoutOrg.length === 0 ? 'OK' : 'ERROR',
  });

  return results;
});
```

Run verification:

```bash
# Run verification query
npx convex run verifyDataIntegrity
```

#### Test 4: Performance Test

```bash
# Measure backup time
time npx convex export --path ./backups/perf-test.json

# Measure restore time
time npx convex import --path ./backups/perf-test.json
```

**Expected Result:** 
- Backup: < 5 minutes for typical database
- Restore: < 10 minutes for typical database

---

## Backup Schedule

### Recommended Schedule

| Backup Type | Frequency | Retention | Storage |
|-------------|-----------|-----------|---------|
| **Convex Snapshots** | Daily (automatic) | 30 days | Convex |
| **Full JSON Export** | Daily (2 AM) | 90 days | Local/Cloud |
| **Weekly Archive** | Weekly (Sunday) | 1 year | Cloud Storage |
| **Pre-Deployment** | Before each deploy | 30 days | Local |
| **Monthly Archive** | 1st of month | 7 years | Cold Storage |

### Implementation:

```bash
# Daily backup (2 AM)
0 2 * * * /path/to/scripts/backup-convex.sh

# Weekly archive (Sunday 3 AM)
0 3 * * 0 /path/to/scripts/backup-convex-weekly.sh

# Monthly archive (1st of month, 4 AM)
0 4 1 * * /path/to/scripts/backup-convex-monthly.sh
```

---

## Retention Policy

### Data Retention Requirements

**Operational Backups:**
- Daily backups: 90 days
- Weekly backups: 1 year
- Monthly backups: 7 years (compliance)

**Compliance Considerations:**
- Financial data: 7 years (Indonesian tax law)
- Audit logs: 7 years
- User data: Until account deletion + 30 days

### Cleanup Script

```bash
#!/bin/bash

BACKUP_DIR="./backups/convex"

# Remove daily backups older than 90 days
find "$BACKUP_DIR/daily" -name "*.json.gz" -mtime +90 -delete

# Remove weekly backups older than 365 days
find "$BACKUP_DIR/weekly" -name "*.json.gz" -mtime +365 -delete

# Archive monthly backups to cold storage
find "$BACKUP_DIR/monthly" -name "*.json.gz" -mtime +365 -exec \
  aws s3 mv {} s3://your-bucket/archives/ --storage-class GLACIER \;
```

---

## Disaster Recovery Plan

### Scenario 1: Accidental Data Deletion

**Recovery Time Objective (RTO):** 1 hour  
**Recovery Point Objective (RPO):** 24 hours

**Steps:**
1. Identify affected data and time of deletion
2. Stop application to prevent further changes
3. Restore from most recent snapshot before deletion
4. Verify restored data
5. Resume application
6. Notify users of any data loss

### Scenario 2: Database Corruption

**RTO:** 2 hours  
**RPO:** 24 hours

**Steps:**
1. Assess corruption extent
2. Create backup of corrupted state (for analysis)
3. Restore from last known good snapshot
4. Verify data integrity
5. Investigate root cause
6. Implement preventive measures

### Scenario 3: Complete Data Loss

**RTO:** 4 hours  
**RPO:** 24 hours

**Steps:**
1. Create new Convex deployment
2. Update environment variables
3. Restore from most recent backup
4. Verify all tables and relationships
5. Run integrity checks
6. Deploy application
7. Monitor for issues

### Scenario 4: Ransomware Attack

**RTO:** 8 hours  
**RPO:** 24 hours

**Steps:**
1. Isolate affected systems
2. Do NOT pay ransom
3. Create new Convex deployment with new credentials
4. Restore from clean backup (verified uncompromised)
5. Audit all access logs
6. Reset all API keys and secrets
7. Implement additional security measures
8. Deploy application

---

## Troubleshooting

### Issue: Backup File Too Large

**Problem:** Backup file exceeds storage limits

**Solutions:**
1. Export tables separately
2. Compress backups (gzip)
3. Use incremental backups
4. Archive old data

```bash
# Export tables separately
npx convex export --table npd --path ./backups/npd.json
npx convex export --table sp2d --path ./backups/sp2d.json

# Compress
gzip ./backups/*.json
```

### Issue: Restore Fails with "Duplicate Key" Error

**Problem:** Data already exists with same IDs

**Solutions:**
1. Use `--mode merge` instead of default
2. Clear table before restore
3. Restore to new deployment

```bash
# Merge mode (safer)
npx convex import --mode merge --path ./backups/backup.json

# Replace mode (destructive)
npx convex import --mode replace --path ./backups/backup.json
```

### Issue: Backup Takes Too Long

**Problem:** Backup process exceeds maintenance window

**Solutions:**
1. Use Convex snapshots instead
2. Implement incremental backups
3. Export during low-traffic hours
4. Optimize database (remove old data)

### Issue: Cannot Access Convex Dashboard

**Problem:** Unable to restore from snapshots

**Solutions:**
1. Use JSON backups instead
2. Contact Convex support
3. Use backup Convex deployment
4. Restore from local exports

---

## Backup Verification Checklist

Before relying on backups, verify:

- [ ] Backup file exists and is not corrupted
- [ ] Backup contains all expected tables
- [ ] Backup file size is reasonable (not empty, not too small)
- [ ] Can successfully read backup file
- [ ] Test restoration works in staging
- [ ] Data integrity checks pass
- [ ] Relationships between tables intact
- [ ] Backup metadata is correct
- [ ] Backup is stored in multiple locations
- [ ] Access to backups is secure and controlled

---

## Monitoring & Alerts

### Set Up Backup Monitoring

Create a monitoring script `scripts/monitor-backups.sh`:

```bash
#!/bin/bash

BACKUP_DIR="./backups/convex"
ALERT_EMAIL="admin@yourdomain.com"

# Check if backup exists from last 24 hours
LATEST_BACKUP=$(find "$BACKUP_DIR" -name "backup_*.json.gz" -mtime -1 | head -n 1)

if [ -z "$LATEST_BACKUP" ]; then
  echo "ERROR: No backup found in last 24 hours!" | mail -s "Backup Alert: Missing Backup" "$ALERT_EMAIL"
  exit 1
fi

# Check backup file size (should be > 1MB)
BACKUP_SIZE=$(stat -f%z "$LATEST_BACKUP" 2>/dev/null || stat -c%s "$LATEST_BACKUP" 2>/dev/null)

if [ "$BACKUP_SIZE" -lt 1048576 ]; then
  echo "ERROR: Backup file too small ($BACKUP_SIZE bytes)" | mail -s "Backup Alert: Suspicious Backup Size" "$ALERT_EMAIL"
  exit 1
fi

echo "Backup monitoring: OK"
```

Schedule monitoring:

```bash
# Check backups every 6 hours
0 */6 * * * /path/to/scripts/monitor-backups.sh
```

---

## Best Practices

### 1. **3-2-1 Backup Rule**
- **3** copies of data
- **2** different storage types
- **1** off-site backup

### 2. **Test Restores Regularly**
- Monthly restore test to staging
- Quarterly full disaster recovery drill
- Document restore times

### 3. **Automate Everything**
- Automated daily backups
- Automated verification
- Automated alerts

### 4. **Secure Backups**
- Encrypt backups at rest
- Secure backup storage access
- Audit backup access logs

### 5. **Document Procedures**
- Keep this guide updated
- Document any issues encountered
- Train team on restore procedures

---

## Next Steps

1. ✅ Review this guide
2. ⏳ Set up automated daily backups
3. ⏳ Test backup creation
4. ⏳ Test restoration to staging
5. ⏳ Configure backup monitoring
6. ⏳ Schedule regular restore tests
7. ⏳ Train team on procedures

---

## Resources

- **Convex Documentation:** [docs.convex.dev](https://docs.convex.dev)
- **Convex CLI Reference:** [docs.convex.dev/cli](https://docs.convex.dev/cli)
- **Convex Dashboard:** [dashboard.convex.dev](https://dashboard.convex.dev)

---

**Last Updated:** November 1, 2025  
**Maintainer:** Development Team  
**Status:** Ready for implementation

