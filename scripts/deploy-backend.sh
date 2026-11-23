#!/usr/bin/env bash
set -euo pipefail

TARGET="${1:-cloudrun}"
APP="de2"
REGION="asia-southeast1"
PROJECT_ID=""

shift || true
while [[ $# -gt 0 ]]; do
  case "$1" in
    --app)
      APP="${2:-de2}"
      shift 2
      ;;
    --region)
      REGION="${2:-asia-southeast1}"
      shift 2
      ;;
    --project)
      PROJECT_ID="${2:-}"
      shift 2
      ;;
    -h|--help)
      echo "Usage: $0 <cloudrun|fly|docker> [--app de1|de2|de3|de4|<folder>] [--region asia-southeast1] [--project <id>]"
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

case "$APP" in
  de1|de-1-so-tay-chi-doan)
    FOLDER="de-1-so-tay-chi-doan"
    SERVICE="so-tay-chi-doan-api"
    ;;
  de2|de-2-tai-mat-cong-dan)
    FOLDER="de-2-tai-mat-cong-dan"
    SERVICE="tai-mat-cong-dan-api"
    ;;
  de3|de-3-ocop-len-san)
    FOLDER="de-3-ocop-len-san"
    SERVICE="ocop-dong-nai-api"
    ;;
  de4|de-4-chong-lua-101)
    FOLDER="de-4-chong-lua-101"
    SERVICE="chong-lua-101-api"
    ;;
  *)
    echo "Unknown track: $APP" >&2
    exit 1
    ;;
esac

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="${REPO_ROOT}/${FOLDER}/backend"

command -v node >/dev/null 2>&1 || { echo "Error: node is required." >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "Error: npm is required." >&2; exit 1; }

if [[ ! -d "${BACKEND_DIR}/node_modules" ]]; then
  echo "[1/3] Installing backend dependencies for ${FOLDER}..."
  npm --prefix "$BACKEND_DIR" install
fi

echo "[2/3] Running backend lint & tests (${SERVICE})..."
npm --prefix "$BACKEND_DIR" run lint
npm --prefix "$BACKEND_DIR" run test

echo "[3/3] Deploying '${SERVICE}' via '${TARGET}'..."
case "$TARGET" in
  cloudrun)
    command -v gcloud >/dev/null 2>&1 || { echo "Error: gcloud CLI is required." >&2; exit 1; }
    ARGS=(run deploy "$SERVICE" --source "$BACKEND_DIR" --region "$REGION" --allow-unauthenticated)
    if [[ -n "$PROJECT_ID" ]]; then
      ARGS+=(--project "$PROJECT_ID")
    fi
    gcloud "${ARGS[@]}"
    ;;
  fly)
    command -v flyctl >/dev/null 2>&1 || { echo "Error: flyctl is required." >&2; exit 1; }
    (cd "$BACKEND_DIR" && flyctl deploy)
    ;;
  docker)
    command -v docker >/dev/null 2>&1 || { echo "Error: docker is required." >&2; exit 1; }
    docker build -t "${SERVICE}:latest" "$BACKEND_DIR"
    ;;
  *)
    echo "Unsupported target: $TARGET" >&2
    exit 1
    ;;
esac

echo "[DONE] Backend workflow for '${SERVICE}' -> '${TARGET}' completed."
