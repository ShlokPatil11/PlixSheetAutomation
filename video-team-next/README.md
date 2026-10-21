# Brand Perf Edit — Video Team

Standalone Next.js App Router workspace for the Video Team portion of Brand Perf Edit.

## Scope

- Approved-script video queue
- Video and AI brief filters
- Board and table views
- Editor assignment
- Start-production transition
- Google Drive video handoff to Brand review
- Change/clarification requests back to Brand
- Task details, references, deliverables, versions, and activity
- Browser-local persistence for prototype interactions

The app reads the existing `../data/mock-data.json` and `../data/workbook-data.json` files on the server. It does not modify the workbook or call external services.

If the app is moved outside this repository, copy `.env.example` to `.env.local` and set `BRAND_PERF_DATA_ROOT` to the repository containing the `data` directory.

## Requirements

- Node.js 20.9 or newer
- npm, pnpm, yarn, or Bun

## Run

```powershell
cd video-team-next
npm install
npm run dev
```

Open `http://localhost:3000`.

## Team integration boundary

The shared contracts live in:

- `lib/types.ts` — task, editor, state, and workspace types
- `lib/data.ts` — adapter from the current workbook snapshot
- `components/video-workspace.tsx` — Video Team-only client behavior

When the shared backend is ready, replace `getVideoWorkspaceData()` with the agreed server/API data source. The UI contract can remain unchanged.
