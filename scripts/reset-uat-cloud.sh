#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_REF_FILE="$ROOT_DIR/supabase/.temp/project-ref"
SQL_FILE="$ROOT_DIR/supabase/reset_uat.sql"

if [[ ! -f "$PROJECT_REF_FILE" ]]; then
  echo "Project Supabase belum di-link. Jalankan supabase link dulu."
  exit 1
fi

if [[ ! -f "$SQL_FILE" ]]; then
  echo "File reset SQL tidak ditemukan: $SQL_FILE"
  exit 1
fi

PROJECT_REF="$(tr -d '\n' < "$PROJECT_REF_FILE")"
DB_PASSWORD="${SUPABASE_DB_PASSWORD:-${1:-}}"

if [[ -z "$DB_PASSWORD" ]]; then
  echo "Isi password database lewat argumen pertama atau env SUPABASE_DB_PASSWORD."
  exit 1
fi

echo "Menghapus file product images dari bucket products..."
supabase storage rm -r ss:///products/products --yes >/dev/null 2>&1 || true

echo "Mereset data UAT di project $PROJECT_REF..."
docker run --rm -i \
  -e PGPASSWORD="$DB_PASSWORD" \
  postgres:17-alpine \
  psql "host=aws-1-ap-south-1.pooler.supabase.com port=5432 user=postgres.$PROJECT_REF dbname=postgres sslmode=require" \
  -v ON_ERROR_STOP=1 \
  -f - < "$SQL_FILE"

echo "Reset selesai."
