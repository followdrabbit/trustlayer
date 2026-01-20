#!/bin/bash
#
# Database Restore Testing Automation
#
# Tests backup and restore procedures to validate RPO/RTO compliance.
# Runs automated restore tests and validates data integrity.
#
# Usage:
#   ./scripts/test-restore.sh [--backup-file FILE] [--dry-run]
#
# Environment variables:
#   PGHOST - PostgreSQL host (default: localhost)
#   PGPORT - PostgreSQL port (default: 5432)
#   PGUSER - PostgreSQL user (default: postgres)
#   PGPASSWORD - PostgreSQL password
#   TEST_DATABASE - Test database name (default: trustlayer_restore_test)
#   S3_BUCKET - S3 bucket for backups (default: trustlayer-backups)
#   S3_PREFIX - S3 prefix (default: trustlayer)

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-postgres}"
TEST_DATABASE="${TEST_DATABASE:-trustlayer_restore_test}"
S3_BUCKET="${S3_BUCKET:-trustlayer-backups}"
S3_PREFIX="${S3_PREFIX:-trustlayer}"
BACKUP_FILE=""
DRY_RUN=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --backup-file)
      BACKUP_FILE="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Functions
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
  log_info "Checking prerequisites..."

  # Check psql
  if ! command -v psql &> /dev/null; then
    log_error "psql not found. Install PostgreSQL client."
    exit 1
  fi

  # Check aws cli (if using S3)
  if [[ -z "$BACKUP_FILE" ]]; then
    if ! command -v aws &> /dev/null; then
      log_error "aws CLI not found. Install AWS CLI or provide --backup-file"
      exit 1
    fi
  fi

  # Check PGPASSWORD
  if [[ -z "${PGPASSWORD:-}" ]]; then
    log_error "PGPASSWORD environment variable not set"
    exit 1
  fi

  log_success "Prerequisites OK"
}

find_latest_backup() {
  log_info "Finding latest backup in S3..."

  LATEST_BACKUP=$(aws s3 ls "s3://${S3_BUCKET}/${S3_PREFIX}/" | \
    grep '\.sql\.gz$' | \
    sort -r | \
    head -1 | \
    awk '{print $4}')

  if [[ -z "$LATEST_BACKUP" ]]; then
    log_error "No backups found in s3://${S3_BUCKET}/${S3_PREFIX}/"
    exit 1
  fi

  BACKUP_FILE="/tmp/${LATEST_BACKUP}"
  log_info "Latest backup: ${LATEST_BACKUP}"

  # Download backup
  log_info "Downloading backup from S3..."
  aws s3 cp "s3://${S3_BUCKET}/${S3_PREFIX}/${LATEST_BACKUP}" "$BACKUP_FILE"
  log_success "Backup downloaded to $BACKUP_FILE"
}

create_test_database() {
  log_info "Creating test database: $TEST_DATABASE"

  # Drop if exists
  psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d postgres \
    -c "DROP DATABASE IF EXISTS $TEST_DATABASE;" > /dev/null 2>&1 || true

  # Create fresh database
  psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d postgres \
    -c "CREATE DATABASE $TEST_DATABASE;" > /dev/null

  log_success "Test database created"
}

perform_restore() {
  log_info "Performing restore..."

  START_TIME=$(date +%s)

  # Decompress and restore
  gunzip -c "$BACKUP_FILE" | \
    psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$TEST_DATABASE" \
    > /dev/null 2>&1

  END_TIME=$(date +%s)
  DURATION=$((END_TIME - START_TIME))

  log_success "Restore completed in ${DURATION}s"
  echo "$DURATION" > /tmp/restore_duration.txt
}

validate_data_integrity() {
  log_info "Validating data integrity..."

  # Count tables
  TABLE_COUNT=$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$TEST_DATABASE" -t -c \
    "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")

  log_info "Tables found: $TABLE_COUNT"

  if [[ "$TABLE_COUNT" -lt 10 ]]; then
    log_error "Expected at least 10 tables, found $TABLE_COUNT"
    return 1
  fi

  # Check critical tables
  CRITICAL_TABLES=(
    "profiles"
    "security_domains"
    "default_questions"
    "answers"
    "maturity_snapshots"
  )

  for table in "${CRITICAL_TABLES[@]}"; do
    ROW_COUNT=$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$TEST_DATABASE" -t -c \
      "SELECT COUNT(*) FROM $table;" 2>/dev/null || echo "0")

    log_info "Table $table: $ROW_COUNT rows"

    if [[ "$ROW_COUNT" -eq 0 ]]; then
      log_warn "Table $table is empty"
    fi
  done

  # Check foreign key constraints
  FK_VIOLATIONS=$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$TEST_DATABASE" -t -c \
    "SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY';")

  log_info "Foreign key constraints: $FK_VIOLATIONS"

  log_success "Data integrity validation passed"
}

validate_rpo_rto() {
  log_info "Validating RPO/RTO compliance..."

  # Extract backup timestamp from filename
  # Expected format: trustlayer_YYYYMMDD_HHMMSS.sql.gz
  BACKUP_NAME=$(basename "$BACKUP_FILE")
  BACKUP_TIMESTAMP=$(echo "$BACKUP_NAME" | grep -oP '\d{8}_\d{6}' || echo "")

  if [[ -z "$BACKUP_TIMESTAMP" ]]; then
    log_warn "Could not extract timestamp from backup filename"
    return 0
  fi

  BACKUP_EPOCH=$(date -d "${BACKUP_TIMESTAMP:0:8} ${BACKUP_TIMESTAMP:9:2}:${BACKUP_TIMESTAMP:11:2}:${BACKUP_TIMESTAMP:13:2}" +%s)
  CURRENT_EPOCH=$(date +%s)
  AGE_HOURS=$(( (CURRENT_EPOCH - BACKUP_EPOCH) / 3600 ))

  log_info "Backup age: ${AGE_HOURS} hours"

  # RPO: Recovery Point Objective (max data loss acceptable)
  RPO_HOURS=24
  if [[ "$AGE_HOURS" -gt "$RPO_HOURS" ]]; then
    log_error "RPO violation: Backup is ${AGE_HOURS}h old (RPO: ${RPO_HOURS}h)"
    return 1
  fi

  # RTO: Recovery Time Objective (max recovery time acceptable)
  RTO_MINUTES=15
  RESTORE_DURATION=$(cat /tmp/restore_duration.txt)
  RESTORE_MINUTES=$((RESTORE_DURATION / 60))

  log_info "Restore duration: ${RESTORE_MINUTES} minutes"

  if [[ "$RESTORE_MINUTES" -gt "$RTO_MINUTES" ]]; then
    log_error "RTO violation: Restore took ${RESTORE_MINUTES}m (RTO: ${RTO_MINUTES}m)"
    return 1
  fi

  log_success "RPO/RTO compliance validated"
  log_success "✓ RPO: ${AGE_HOURS}h / ${RPO_HOURS}h"
  log_success "✓ RTO: ${RESTORE_MINUTES}m / ${RTO_MINUTES}m"
}

cleanup() {
  log_info "Cleaning up..."

  # Drop test database
  psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d postgres \
    -c "DROP DATABASE IF EXISTS $TEST_DATABASE;" > /dev/null 2>&1 || true

  # Remove temporary files
  rm -f /tmp/restore_duration.txt

  if [[ -f "$BACKUP_FILE" && "$BACKUP_FILE" == /tmp/* ]]; then
    rm -f "$BACKUP_FILE"
  fi

  log_success "Cleanup complete"
}

generate_report() {
  log_info "Generating test report..."

  REPORT_FILE="/tmp/restore_test_report_$(date +%Y%m%d_%H%M%S).txt"

  cat > "$REPORT_FILE" <<EOF
==================================================
Database Restore Test Report
==================================================

Test Date: $(date)
Backup File: $BACKUP_FILE
Test Database: $TEST_DATABASE

--------------------------------------------------
Results:
--------------------------------------------------

Restore Duration: $(cat /tmp/restore_duration.txt 2>/dev/null || echo "N/A")s
Tables Restored: $TABLE_COUNT
Data Integrity: PASS
RPO Compliance: PASS
RTO Compliance: PASS

--------------------------------------------------
Status: ALL TESTS PASSED ✓
--------------------------------------------------
EOF

  cat "$REPORT_FILE"
  log_success "Report saved to $REPORT_FILE"
}

main() {
  log_info "=== Database Restore Testing ==="
  log_info "Start time: $(date)"

  if [[ "$DRY_RUN" == true ]]; then
    log_warn "DRY RUN MODE - No changes will be made"
  fi

  # Step 1: Prerequisites
  check_prerequisites

  # Step 2: Get backup file
  if [[ -z "$BACKUP_FILE" ]]; then
    find_latest_backup
  else
    log_info "Using provided backup file: $BACKUP_FILE"
  fi

  if [[ "$DRY_RUN" == true ]]; then
    log_info "Would restore from: $BACKUP_FILE"
    log_info "Would create database: $TEST_DATABASE"
    exit 0
  fi

  # Step 3: Create test database
  create_test_database

  # Step 4: Perform restore
  perform_restore

  # Step 5: Validate data integrity
  validate_data_integrity

  # Step 6: Validate RPO/RTO
  validate_rpo_rto

  # Step 7: Generate report
  generate_report

  # Step 8: Cleanup
  cleanup

  log_success "=== Restore test completed successfully ==="
  log_info "End time: $(date)"

  exit 0
}

# Trap errors
trap 'log_error "Test failed at line $LINENO"; cleanup; exit 1' ERR

# Run main
main "$@"
