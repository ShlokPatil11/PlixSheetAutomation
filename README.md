# Brand Perf Edit

A local prototype for the Brand, Content, Video, and Performance workflow, populated from the `AI Tracker Main` and `Work Plan` tabs in `Brand Perf Edit.xlsx`.

## Safety status

- No credentials are included. Workbook data is read from a local snapshot generated from the checked-in XLSX file.
- No spreadsheet write, Drive, Meta, notification, upload, or publishing API is called.
- Task queues contain workbook records from only `AI Tracker Main` and `Work Plan`; supporting demo users, messages, and notifications remain in `data/mock-data.json`.
- User changes are stored only in browser `localStorage`.
- Nothing is deployed.

The local workbook remains unchanged. `data/workbook-data.json` contains the imported snapshot used by the browser. The Sheet data workspace displays only the two integrated tabs and does not make a live Google Sheets request.

## Run the prototype

This build deliberately has no package installation step. From the project folder:

```powershell
python -m http.server 4173
```

Open `http://localhost:4173` in a browser. Opening `index.html` directly will not load the JSON data because browsers restrict local module requests.

To reset simulated tasks and chat, open the user menu and choose **Reset demo**.

## What is implemented

- Persistent sidebar, global search, team navigation, notifications, and simulated role menu.
- Operations dashboard with workload, review, publishing, and attention summaries.
- Searchable/filterable list and Kanban task views.
- Separate Video brief and AI brief queue tabs in every task workspace.
- Brand-owned product briefs use a Hook name and a required brief type. Video brief maps to `Work Plan` with video tags; AI brief maps to `AI Tracker Main` with AI-specific tags.
- Category selection auto-assigns the Content Team script owner and Brand approvers for Hair, Skin, Nutra, and Joyun; B2G2 is available as a category.
- Content Team script submission supports a Google Docs link plus additional comments, with a Brand Team approval gate before the Video team receives the task.
- Until manual lead assignment is enabled, unassigned work automatically uses `Other` as the Video Editor so the pipeline can continue.
- Every post-intake handoff includes a forward approval action and a comment-required Request changes action.
- Video team queues with overdue work, assignment state, progress, and version submission.
- Brand review with approve/change-request transitions and version history.
- Perf team queues ordered as Ready for live, Live, Rework, and Failed; Brand approval sends the full task to Ready for live, where Perf can complete it with one Go Live action.
- Task detail drawer with brief, deliverables, versions, activity, and comments.
- Input-based workflow estimates and timestamped handoff events.
- Team/campaign chat persisted in the browser for prototype demonstrations.
- Workbook-backed task queues containing 353 records from `AI Tracker Main` and `Work Plan`.
- A local source-data browser for those two tabs with escaped display values.
- Central workflow and permission contract in `config/workflow.json`.

## Prototype limitations

- Authentication is simulated through the role menu.
- Transition checks run in the browser. A production backend must repeat them server-side.
- Browser storage is not multi-user persistence and is not suitable for production chat.
- Imported records can contain the workbook's operational names, instructions, and links.
- “Today” and overdue behavior uses provisional rules documented in `docs/workflow-spec.md`.
- This remains a static, buildless frontend. The recommended production implementation remains Next.js and TypeScript.

## Tests

Run the offline contract suite:

```powershell
python -m unittest discover -s tests -v
```

The tests validate workflow reachability, terminal states, role-action coverage, fixture identity, workbook import scope, task integrity, offline-only UI behavior, and the audited workbook checksum.

## Documentation

- `docs/workbook-audit.md`
- `docs/workflow-spec.md`
- `docs/architecture.md`
- `docs/data-model.md`
- `docs/testing-plan.md`

## Integration gate

Before any test-sheet API access:

1. Verify the authenticated account and isolated spreadsheet ID.
2. Audit Apps Script, triggers, add-ons, notification rules, external formulas, and sharing.
3. Compare live tabs, headers, formulas, validation, comments, and representative row counts with the audited export.
4. Add read-only credentials outside source control and review observed reads.
5. Obtain separate approval before enabling narrowly scoped writes.
