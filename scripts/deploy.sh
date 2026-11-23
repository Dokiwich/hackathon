#!/usr/bin/env bash
set -euo pipefail

TARGET="${1:-cloudflare}"
APP="de2"
PROD=false
PROJECT_NAME=""
SKIP_INSTALL=false

shift || true
while [[ $# -gt 0 ]]; do
  case "$1" in
    --app)
      APP="${2:-de2}"
      shift 2
      ;;
    --prod)
      PROD=true
      shift
      ;;
    --project)
      PROJECT_NAME="${2:-}"
      shift 2
      ;;
    --skip-install)
      SKIP_INSTALL=true
      shift
      ;;
    -h|--help)
      echo "Usage: $0 <cloudflare|vercel|netlify|preview> [--app de1|de2|de3|de4|<folder>] [--prod] [--project <name>] [--skip-install]"
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

case "$APP" in
  de1|de-1-so-tay-chi-doan) FOLDER="de-1-so-tay-chi-doan" ;;
  de2|de-2-tai-mat-cong-dan) FOLDER="de-2-tai-mat-cong-dan" ;;
  de3|de-3-ocop-len-san) FOLDER="de-3-ocop-len-san" ;;
  de4|de-4-chong-lua-101) FOLDER="de-4-chong-lua-101" ;;
  *) echo "Unknown track: $APP" >&2; exit 1 ;;
esac

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

if [[ "$TARGET" == "cloudflare" ]]; then
  CF_ARGS=(--app "$FOLDER")
  if [[ -n "$PROJECT_NAME" ]]; then
    CF_ARGS+=(--project "$PROJECT_NAME")
  fi
  if [[ "$PROD" == "false" ]]; then
    CF_ARGS+=(--preview)
  fi
  if [[ "$SKIP_INSTALL" == "true" ]]; then
    CF_ARGS+=(--skip-install)
  fi
  exec "${SCRIPT_DIR}/deploy-cloudflare.sh" "${CF_ARGS[@]}"
fi

command -v node >/dev/null 2>&1 || { echo "Error: node is required." >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "Error: npm is required." >&2; exit 1; }

if [[ "$SKIP_INSTALL" == "false" && ! -d "${FOLDER}/node_modules" ]]; then
  echo "[1/3] Installing dependencies in ${FOLDER}..."
  npm --prefix "$FOLDER" install
fi

echo "[2/3] Building '${FOLDER}' for target '${TARGET}'..."
VITE_BASE_PATH="/" npm --prefix "$FOLDER" run build
DEPLOY_DIR="${FOLDER}/dist"

echo "[3/3] Deploying '${DEPLOY_DIR}' to '${TARGET}'..."
case "$TARGET" in
  vercel)
    if [[ "$PROD" == "true" ]]; then
      npx --yes vercel@latest deploy "$DEPLOY_DIR" --prod
    else
      npx --yes vercel@latest deploy "$DEPLOY_DIR"
    fi
    ;;
  netlify)
    if [[ "$PROD" == "true" ]]; then
      npx --yes netlify-cli@latest deploy --dir="$DEPLOY_DIR" --prod
    else
      npx --yes netlify-cli@latest deploy --dir="$DEPLOY_DIR"
    fi
    ;;
  preview)
    npm --prefix "$FOLDER" run preview
    ;;
  *)
    echo "Unsupported target: $TARGET" >&2
    exit 1
    ;;
esac

echo "[DONE] Deployment workflow for '${FOLDER}' -> '${TARGET}' completed."
