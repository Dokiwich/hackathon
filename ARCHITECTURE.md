# ARCHITECTURE.md

## 1. Multi-Track Workspace Layout (4 Independent Apps)

The repository separates 4 hackathon tracks into standalone folders plus shared AI governance, packaging, and deployment automation at the root:

```text
d:\hackathon\
├── de-1-so-tay-chi-doan/       # Đề 1 Starter Skeleton (ready to build)
├── de-2-tai-mat-cong-dan/      # Đề 2 Full MVP (Leaflet, 95 wards, GPS/watermark, SLA)
├── de-3-ocop-len-san/          # Đề 3 Starter Skeleton (ready to build)
├── de-4-chong-lua-101/         # Đề 4 Starter Skeleton (ready to build)
├── docs/
│   ├── BLUEPRINTS_4_PROJECTS.md
│   ├── DEPLOY.md
│   └── agents/security.md
├── scripts/
│   ├── build-all-pages.mjs     # Builds all 4 tracks into dist-pages/ portal hub
│   ├── pack.mjs                # Packages release/<track>-dist.zip & -source.zip
│   ├── deploy.ps1              # Windows PowerShell auto-deploy (hub or single track)
│   └── deploy.sh               # Bash auto-deploy (hub or single track)
├── .github/                    # Copilot instructions, PR/Issue templates, CI/CD
├── .cursor/rules/              # Scoped Cursor rules
└── AGENTS.md                   # Universal agent guide
```

## 2. Standard Anatomy Inside Each Track Folder

Every folder shares the same production-ready frontend baseline:

```text
<track>/
├── AGENTS.md                   # Track-specific prompt context, rules & commands
├── .env.example                # Safe public env var template
├── package.json                # Isolated dependencies + lint/test/build/build:gh
├── eslint.config.js            # ESLint 9 + react + react-hooks flat config
├── vite.config.js              # base: process.env.VITE_BASE_PATH || '/'
├── vercel.json                 # Track-specific SPA rewrites + CSP + Permissions-Policy
├── index.html                  # SEO meta, OpenGraph, %BASE_URL% favicon & manifest
├── public/
│   ├── _redirects / _headers   # Cloudflare Pages & Netlify SPA fallback + CSP headers
│   ├── favicon.svg             # Track icon
│   ├── manifest.webmanifest    # PWA manifest
│   └── robots.txt              # Search crawler policy
├── scripts/build-pages.mjs     # Standalone subpath build + 404.html fallback
└── src/
    ├── main.jsx                # ErrorBoundary + BrowserRouter basename={BASE_URL}
    ├── App.jsx                 # Track router entrypoint (skeleton on de-1/3/4, full app on de-2)
    ├── components/             # UI views + ErrorBoundary.jsx
    ├── data/                   # Domain datasets
    ├── services/               # storageService.js (+ API client adapters)
    ├── utils/                  # Pure helpers & unit tests
    └── ...
└── backend/                    # Modular Layered Fastify 5 API Starter
    ├── Dockerfile / docker-compose.yml
    ├── eslint.config.js        # Enforces controller/repo/cross-module isolation
    └── src/
        ├── config/env.js       # Fail-fast Zod env schema
        ├── common/             # AppError, response envelope, validateSchema
        ├── middleware/         # requestId, errorHandler, authGuard
        ├── db/                 # DB client adapter + migrations/.gitkeep
        └── modules/
            ├── index.js        # Central module registry
            ├── health/         # Reference 3-tier module (/api/v1/health, /ready)
            └── <domain>/       # Empty domain module placeholders (.gitkeep)
```
