#!/bin/bash

# PostgreSQL Automated Backup Script
# Usage: ./backup-db.sh [environment]
# Runs daily via cron: 0 2 * * * /path/to/backup-db.sh production

set -e

ENVIRONMENT=${1:-development}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/codecouncil-ai"
RETENTION_DAYS=30

# Source environment
if [ "$ENVIRONMENT" = "production" ]; then
    export $(grep -v '^#' .env.production | xargs)
else
    export $(grep -v '^#' .env | xargs)
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Extract database details from DATABASE_URL
# Format: postgresql://user:password@host:port/dbname
DB_URL="$DATABASE_URL"
DB_USER=$(echo "$DB_URL" | sed -E 's|.*://([^:]+):.*|\1|')
DB_PASSWORD=$(echo "$DB_URL" | sed -E 's|.*://[^:]+:([^@]+)@.*|\1|')
DB_HOST=$(echo "$DB_URL" | sed -E 's|.*@([^:/]+).*|\1|')
DB_PORT=$(echo "$DB_URL" | sed -E 's|.*:([0-9]+)/.*|\1|')
DB_NAME=$(echo "$DB_URL" | sed -E 's|.*/([^?]+).*|\1|')

BACKUP_FILE="$BACKUP_DIR/codecouncil-ai_${ENVIRONMENT}_${TIMESTAMP}.sql"
BACKUP_COMPRESSED="$BACKUP_FILE.gz"

echo "🔄 Starting backup for $ENVIRONMENT environment..."
echo "📦 Backup file: $BACKUP_COMPRESSED"

# Perform backup
PGPASSWORD="$DB_PASSWORD" pg_dump \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --username="$DB_USER" \
  --database="$DB_NAME" \
  --verbose \
  --no-password \
  > "$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_FILE"

# Calculate size
SIZE=$(du -h "$BACKUP_COMPRESSED" | cut -f1)
echo "✅ Backup completed: $SIZE"

# Optional: Upload to S3 (requires AWS CLI)
if command -v aws &> /dev/null && [ -n "$AWS_S3_BACKUP_BUCKET" ]; then
  echo "☁️  Uploading to S3..."
  aws s3 cp "$BACKUP_COMPRESSED" "s3://$AWS_S3_BACKUP_BUCKET/backups/" \
    --storage-class GLACIER \
    --sse AES256
  echo "✅ S3 upload completed"
fi

# Clean up old backups (retain last 30 days)
echo "🧹 Cleaning up old backups (older than $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "codecouncil-ai_${ENVIRONMENT}_*.sql.gz" -mtime +$RETENTION_DAYS -delete

BACKUP_COUNT=$(find "$BACKUP_DIR" -name "codecouncil-ai_${ENVIRONMENT}_*.sql.gz" | wc -l)
echo "📊 Total backups retained: $BACKUP_COUNT"
echo "✨ Backup script completed successfully"
