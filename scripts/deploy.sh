#!/usr/bin/env bash
set -euo pipefail

TARGET="${1:-vercel}"
APP="all"
PROD=false
PROJECT_NAME=""
SKIP_INSTALL=false

shift || true
while [[ $# -gt 0 ]]; do
  case "$1" in
    --app)
      APP="${2:-all}"
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
      echo "Usage: $0 <vercel|cloudflare|netlify|gh-pages|preview> [--app all|de1|de2|de3|de4|<folder>] [--prod] [--project <name>] [--skip-install]"
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

resolve_app_folder() {
  case "$1" in
    de1) echo "de-1-so-tay-chi-doan" ;;
    de2) echo "de-2-tai-mat-cong-dan" ;;
    de3) echo "de-3-ocop-len-san" ;;
    de4) echo "de-4-chong-lua-101" ;;
    *) echo "$1" ;;
  esac
}

get_repo_slug() {
  local remote_url
  remote_url="$(git remote get-url origin 2>/dev/null || true)"
  if [[ -n "$remote_url" ]]; then
    remote_url="${remote_url%.git}"
    echo "${remote_url##*/}"
    return
  fi
  echo "hackathon"
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

command -v node >/dev/null 2>&1 || { echo "Error: node is required." >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "Error: npm is required." >&2; exit 1; }

if command -v git >/dev/null 2>&1; then
  TRACKED_ENV="$(git ls-files '.env*' || true)"
  if [[ -n "$TRACKED_ENV" ]]; then
    echo "WARNING: Tracked .env files found in git: $TRACKED_ENV" >&2
  fi
fi

RESOLVED_APP="$(resolve_app_folder "$APP")"
if [[ "$RESOLVED_APP" == "all" ]]; then
  FOLDERS=("de-1-so-tay-chi-doan" "de-2-tai-mat-cong-dan" "de-3-ocop-len-san" "de-4-chong-lua-101")
else
  FOLDERS=("$RESOLVED_APP")
fi

if [[ "$SKIP_INSTALL" == "false" ]]; then
  for folder in "${FOLDERS[@]}"; do
    if [[ ! -d "$folder/node_modules" ]]; then
      echo "[1/3] Installing dependencies in $folder..."
      npm --prefix "$folder" install
    fi
  done
fi

if [[ -z "$PROJECT_NAME" ]]; then
  if [[ "$RESOLVED_APP" == "all" ]]; then
    PROJECT_NAME="dong-nai-hackathon-hub"
  else
    PROJECT_NAME="$RESOLVED_APP"
  fi
fi

echo "[2/3] Building '$RESOLVED_APP' for target '$TARGET'..."
DEPLOY_DIR=""
if [[ "$RESOLVED_APP" == "all" ]]; then
  if [[ "$TARGET" == "gh-pages" ]]; then
    REPO_NAME="$(get_repo_slug)"
    VITE_BASE_PATH="/${REPO_NAME}/" node scripts/build-all-pages.mjs
  else
    VITE_BASE_PATH="/" node scripts/build-all-pages.mjs
  fi
  DEPLOY_DIR="dist-pages"
else
  if [[ "$TARGET" == "gh-pages" ]]; then
    REPO_NAME="$(get_repo_slug)"
    (cd "$RESOLVED_APP" && VITE_BASE_PATH="/${REPO_NAME}/" node scripts/build-pages.mjs)
  else
    VITE_BASE_PATH="/" npm --prefix "$RESOLVED_APP" run build
  fi
  DEPLOY_DIR="${RESOLVED_APP}/dist"
fi

echo "[3/3] Deploying '$DEPLOY_DIR' to '$TARGET'..."
case "$TARGET" in
  vercel)
    if [[ "$PROD" == "true" ]]; then
      npx --yes vercel@latest deploy "$DEPLOY_DIR" --prod
    else
      npx --yes vercel@latest deploy "$DEPLOY_DIR"
    fi
    ;;
  cloudflare)
    if [[ "$PROD" == "true" ]]; then
      npx --yes wrangler@latest pages deploy "$DEPLOY_DIR" --project-name="$PROJECT_NAME" --branch=main
    else
      npx --yes wrangler@latest pages deploy "$DEPLOY_DIR" --project-name="$PROJECT_NAME" --branch=preview
    fi
    ;;
  netlify)
    if [[ "$PROD" == "true" ]]; then
      npx --yes netlify-cli@latest deploy --dir="$DEPLOY_DIR" --prod
    else
      npx --yes netlify-cli@latest deploy --dir="$DEPLOY_DIR"
    fi
    ;;
  gh-pages)
    npx --yes gh-pages@latest -d "$DEPLOY_DIR"
    ;;
  preview)
    if [[ "$RESOLVED_APP" == "all" ]]; then
      npx --yes serve@latest "$DEPLOY_DIR"
    else
      npm --prefix "$RESOLVED_APP" run preview
    fi
    ;;
  *)
    echo "Unsupported target: $TARGET" >&2
    exit 1
    ;;
esac

echo "[DONE] Deployment workflow for '$RESOLVED_APP' -> '$TARGET' completed."
