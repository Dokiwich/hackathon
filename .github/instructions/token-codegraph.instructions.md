---
applyTo: "**/*"
---
# CodeGraph, Context-Mode & Token Optimization Instructions

1. **CodeGraph First:** When a `.codegraph/` index exists in the target track folder, run `codegraph_explore` with `projectPath` pointing strictly to that track (`de-1-so-tay-chi-doan` .. `de-4-chong-lua-101`) and `maxFiles=6`. Reuse the returned source without re-reading the same lines.
2. **Fallback Exploration:** If `.codegraph/` is not initialized, locate exact lines with search first and read only the needed block (`< 150` lines).
3. **Context-Mode Compression:** Route noisy command output (full builds, audits, test logs) or large reference docs through `ctx_execute` / `ctx_index` + `ctx_search` when available.
4. **Skip Heavy Non-Source Files:** Avoid reading `package-lock.json`, `dist/`, `dist-pages/`, `release/`, `*.pdf`, and static HTML pitch decks unless the task specifically edits them.
5. **Batch Tool Calls:** Group independent file reads, edits, and checks into parallel calls to minimize round-trips.
