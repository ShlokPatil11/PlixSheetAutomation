# PlixOps Unified — Team-Abstracted Operations Platform

A complete, full-stack Next.js web application that unifies **Brand**, **Content**, **Video**, and **Performance** marketing workflows under **Team-Abstracted Role-Based Access Control (RBAC)** with automated **Stage Execution & Turnaround Time (TAT)** tracking.

---

## 🌟 What This Application Solves

1. **Total Team Abstraction**:
   * Each team operates in a focused queue with irrelevant upstream/downstream clutter removed.
   * **Brand Team**: Brief intake, Hook configuration, Script approval gate, Video review gate, and campaign oversight.
   * **Content Team**: Script queue, Category auto-routing (Skin $\rightarrow$ Himani, Hair $\rightarrow$ Zoha, Nutra $\rightarrow$ Tanmay), Google Docs script submissions.
   * **Video Team**: Brand-approved scripts enter a shared dispatch queue. Editing managers Yogesh, Vihang, Pratik, and Pritam assign each task to a team member before production begins.
   * **Performance Team**: `Ready for Live` queue of Brand-approved videos, UTM tagging, and Go-Live publishing execution.
   * **Operations Admin**: End-to-end pipeline visibility, SLA tracking, and audit history.

2. **Stage Turnaround Tracking (No Artificial Target Dates)**:
   * Instead of arbitrary target dates, the system records immutable timestamps for every handoff.
   * Automatically calculates turnaround time (hours and days) spent by each team and cumulative pipeline lead time (e.g., *Brand 14 Oct $\rightarrow$ Content 14 Oct $\rightarrow$ Video 15 Oct $\rightarrow$ Perf 20 Oct = 6.3 days total*).

3. **Dual Persistence Architecture**:
   * **Zero-Setup Local Mode**: Runs out of the box with atomic file storage (`.data/unified-state.json`), Server-Sent Events (`/api/events`), and seed data from `Brand Perf Edit.xlsx` (353 records).
   * **Supabase Mode**: Setting `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` switches the runtime to shared Supabase persistence. Optimistic revision checks protect concurrent manager assignments and Supabase Realtime feeds the existing event stream.

---

## 🚀 Quick Start (Local Run)

From inside the `plix-unified-ops` folder:

```bash
cd plix-unified-ops
npm install
npm run dev
```

Open [http://localhost:4500](http://localhost:4500) in your browser.

---

## 📂 Project Structure

```text
plix-unified-ops/
├── app/
│   ├── api/
│   │   ├── tasks/route.js            # Team-scoped task listing & Brand brief creation
│   │   ├── tasks/[id]/script/route.js # Content script submission gate
│   │   ├── tasks/[id]/video/route.js  # Video cut submission gate
│   │   ├── tasks/[id]/live/route.js   # Performance Go-Live gate
│   │   ├── approvals/[id]/route.js   # Brand script & video review decisions
│   │   └── events/route.js           # Realtime Server-Sent Events stream
│   ├── globals.css                   # Responsive dark-theme styling
│   ├── layout.js                     # Root layout
│   └── page.js                       # Unified workspace dashboard & team switcher
├── components/
│   ├── Header.jsx                    # Top brand bar, team switcher & brief trigger
│   ├── TaskBoard.jsx                 # Dynamic Kanban columns customized per team
│   ├── TaskList.jsx                  # Table view with stage turnaround column
│   ├── TaskCard.jsx                  # Task cards with hook names & elapsed duration
│   ├── TaskDrawer.jsx                # Detail slide-out with deliverables & decisions
│   ├── StageTimingTimeline.jsx       # Visual turnaround time breakdown
│   ├── NewBriefModal.jsx             # Brand intake form with category auto-routing
│   ├── SubmitScriptModal.jsx         # Content Google Docs handoff modal
│   ├── SubmitVideoModal.jsx          # Video Google Drive handoff modal
│   └── GoLiveModal.jsx               # Performance Go-Live execution modal
├── lib/
│   ├── store/
│   │   └── unified-store.js          # Atomic file store & realtime event emitter
│   └── workflow/
│       ├── constants.js              # Teams, allowed states, category routing
│       ├── contracts.js              # Zod validation schemas for all handoffs
│       └── engine.js                 # State machine & turnaround calculation
├── data/
│   ├── workbook-data.json            # 353 tasks seeded from Brand Perf Edit.xlsx
│   ├── mock-data.json                # User profiles & fixture tasks
│   └── workflow.json                 # Core permission & transition matrix
└── supabase/
    └── migrations/
        └── 20261023160000_plix_unified_ops_schema.sql # PostgreSQL schema & RLS
```

---

## 🔒 Contracted Milestone Handoffs

```text
1. Brand creates brief (Hook Name, Product, Category, Requirements)
   └── Delivered to: Content Team ("Script queue")

2. Content prepares script and submits Google Docs link
   └── Delivered to: Brand Gate ("Brand script approval")

3. Brand approves script
   └── Delivered unassigned to: Editing Manager Dispatch Desk

4. Yogesh, Vihang, Pratik, or Pritam assigns an editor
   └── Delivered to: Assigned editor's personal production queue

5. Video editor cuts video and submits Google Drive link (9:16 / 16:9)
   └── Delivered to: Brand Gate ("Brand video review")

6. Brand approves video
   └── Delivered to: Performance Team ("Ready for live")

7. Performance team configures UTMs and records Live URL
   └── Delivered to: Live in Market ("published") + Full Pipeline Completion
```

### Supabase editing-manager setup

1. Apply all migrations in `supabase/migrations` in timestamp order.
2. Copy `.env.local.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and the server-only `SUPABASE_SERVICE_ROLE_KEY`.
3. Restart the application. The first request seeds `plix_app_state`; subsequent reads and writes use Supabase.
4. Open `/api/health/supabase` and confirm that `connected` is `true`.

After creating the four manager accounts in Supabase Auth, set their `workspace_members.team` to `video` and `team_role` to `manager`. All other editors should use `team_role = 'member'`. The manager API also enforces assignment permissions from the active application session.

