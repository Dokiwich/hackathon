#!/usr/bin/env bash
set -euo pipefail

APP="de2"
PROJECT_NAME=""
PREVIEW=false
TEMPORARY=false
SKIP_INSTALL=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --app)
      APP="${2:-de2}"
      shift 2
      ;;
    --project)
      PROJECT_NAME="${2:-}"
      shift 2
      ;;
    --preview)
      PREVIEW=true
      shift
      ;;
    --skip-install)
      SKIP_INSTALL=true
      shift
      ;;
    --temporary)
      TEMPORARY=true
      shift
      ;;
    -h|--help)
      echo "Usage: $0 [--app de1|de2|de3|de4|<folder>] [--project <name>] [--preview] [--temporary] [--skip-install]"
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
APP_ROOT="${REPO_ROOT}/${FOLDER}"
cd "$REPO_ROOT"

command -v node >/dev/null 2>&1 || { echo "Error: node is required." >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "Error: npm is required." >&2; exit 1; }

if [[ "$SKIP_INSTALL" == "false" && ! -d "${APP_ROOT}/node_modules" ]]; then
  echo "[1/4] Installing npm dependencies in ${FOLDER}..."
  npm --prefix "$FOLDER" install
fi

echo "[2/4] Checking Cloudflare authentication..."
if [[ "$TEMPORARY" == true ]]; then
  echo "Temporary mode enabled (--temporary): skipping account login check."
elif [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  WHOAMI_OUT="$(npx --yes wrangler@latest whoami 2>&1 || true)"
  if echo "$WHOAMI_OUT" | grep -qi "not authenticated"; then
    npx --yes wrangler@latest login
  fi
fi

EFFECTIVE_PROJECT="${PROJECT_NAME:-$FOLDER}"

echo "[3/4] Building production bundle (${FOLDER}, VITE_BASE_PATH=/)..."
VITE_BASE_PATH="/" npm --prefix "$FOLDER" run build

DIST_DIR="${APP_ROOT}/dist"
for req in index.html _headers; do
  if [[ ! -f "${DIST_DIR}/${req}" ]]; then
    echo "Missing required Cloudflare asset: ${DIST_DIR}/${req}" >&2
    exit 1
  fi
done

if [[ -f "${DIST_DIR}/_redirects" ]]; then
  rm -f "${DIST_DIR}/_redirects"
  echo "Removed generated dist/_redirects (Cloudflare Pages & Workers Static Assets handle SPA fallback natively; '/* /index.html 200' causes API error 100324)."
fi

BRANCH="main"
if [[ "$PREVIEW" == "true" ]]; then
  BRANCH="preview"
fi

if [[ "$TEMPORARY" == true ]]; then
  if [[ ! -f "${APP_ROOT}/wrangler.jsonc" && ! -f "${APP_ROOT}/wrangler.json" && ! -f "${APP_ROOT}/wrangler.toml" ]]; then
    echo "Missing wrangler.jsonc, wrangler.json, or wrangler.toml in ${APP_ROOT} for --temporary deploy." >&2
    exit 1
  fi
  echo "[4/4] Publishing '${FOLDER}/dist' as temporary Cloudflare Workers Static Assets..."
  (cd "$APP_ROOT" && npx --yes wrangler@latest deploy --temporary)
  echo "[DONE] Temporary Cloudflare Workers Static Assets deployed (use the *.workers.dev URL and Claim URL printed above)."
else
  echo "[4/4] Publishing '${FOLDER}/dist' to Cloudflare Pages project '${EFFECTIVE_PROJECT}' (branch: ${BRANCH})..."
  npx --yes wrangler@latest pages project create "$EFFECTIVE_PROJECT" --production-branch=main >/dev/null 2>&1 || true
  npx --yes wrangler@latest pages deploy "$DIST_DIR" --project-name="$EFFECTIVE_PROJECT" --branch="$BRANCH"
  echo "[DONE] Cloudflare Pages live URL: https://${EFFECTIVE_PROJECT}.pages.dev"
fi
