#!/bin/bash

# PostgreSQL Restore Script
# Usage: ./restore-db.sh [backup-file] [environment]
# Example: ./restore-db.sh codecouncil-ai_production_20250115_020000.sql.gz production

set -e

BACKUP_FILE=$1
ENVIRONMENT=${2:-development}

if [ -z "$BACKUP_FILE" ]; then
    echo "❌ Usage: ./restore-db.sh [backup-file] [environment]"
    echo "Example: ./restore-db.sh codecouncil-ai_production_20250115_020000.sql.gz production"
    exit 1
fi

BACKUP_PATH="/var/backups/codecouncil-ai/$BACKUP_FILE"

if [ ! -f "$BACKUP_PATH" ] && [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_PATH or $BACKUP_FILE"
    exit 1
fi

# Use local file if not found in backup directory
if [ -f "$BACKUP_FILE" ]; then
    BACKUP_PATH="$BACKUP_FILE"
fi

# Source environment
if [ "$ENVIRONMENT" = "production" ]; then
    export $(grep -v '^#' .env.production | xargs)
    read -p "⚠️  WARNING: You are about to restore to PRODUCTION. Continue? (yes/no) " confirm
    if [ "$confirm" != "yes" ]; then
        echo "❌ Restore cancelled"
        exit 1
    fi
else
    export $(grep -v '^#' .env | xargs)
fi

# Extract database details from DATABASE_URL
DB_URL="$DATABASE_URL"
DB_USER=$(echo "$DB_URL" | sed -E 's|.*://([^:]+):.*|\1|')
DB_PASSWORD=$(echo "$DB_URL" | sed -E 's|.*://[^:]+:([^@]+)@.*|\1|')
DB_HOST=$(echo "$DB_URL" | sed -E 's|.*@([^:/]+).*|\1|')
DB_PORT=$(echo "$DB_URL" | sed -E 's|.*:([0-9]+)/.*|\1|')
DB_NAME=$(echo "$DB_URL" | sed -E 's|.*/([^?]+).*|\1|')

echo "🔄 Starting restore from: $BACKUP_PATH"
echo "📊 Environment: $ENVIRONMENT"
echo "🗄️  Database: $DB_NAME at $DB_HOST:$DB_PORT"

# Check if backup is compressed
if [[ "$BACKUP_PATH" == *.gz ]]; then
    echo "📦 Decompressing backup..."
    gunzip -c "$BACKUP_PATH" | PGPASSWORD="$DB_PASSWORD" psql \
      --host="$DB_HOST" \
      --port="$DB_PORT" \
      --username="$DB_USER" \
      --database="$DB_NAME" \
      --no-password
else
    PGPASSWORD="$DB_PASSWORD" psql \
      --host="$DB_HOST" \
      --port="$DB_PORT" \
      --username="$DB_USER" \
      --database="$DB_NAME" \
      --no-password \
      < "$BACKUP_PATH"
fi

echo "✅ Restore completed successfully"
echo "🔄 Running Prisma migrations to sync schema..."
npx prisma migrate deploy

echo "✨ Database restore and migration completed"
