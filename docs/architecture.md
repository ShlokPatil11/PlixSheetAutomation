# Architecture

## Delivery stages

### Current prototype

- Static, local-only frontend.
- Workbook records from `AI Tracker Main` and `Work Plan` are bundled in `data/workbook-data.json`.
- Browser-local interaction state for demonstration only.
- No authentication, file uploads, notifications, spreadsheet writes, publishing, or deployment.
- The Sheet data workspace reads the local snapshot only. It exposes the two integrated tabs and makes no live spreadsheet request.

### Recommended application

- Next.js with TypeScript.
- Accessible component primitives and Tailwind CSS.
- Server actions/API routes call domain services rather than Sheets directly.
- PostgreSQL for identity, roles, collaboration, history, versions, review records, idempotency, and synchronization metadata.
- A Google Sheets adapter is introduced only after read-only review of the isolated spreadsheet.

## Boundaries

```text
UI
  -> server/API authorization
    -> workflow service
      -> application repository (database)
      -> spreadsheet adapter (explicit reads/writes)
      -> audit log
```

UI components never call the Google Sheets API directly.

## Proposed ownership

| Data | Initial owner | Notes |
| --- | --- | --- |
| Legacy task fields and current workbook labels | Isolated test Sheet, read-only first | Writes require separate approval. |
| Application task ID and sheet-row mapping | Database | Mapping includes spreadsheet, sheet, row fingerprint, and revision. |
| Users, teams, roles | Database/identity provider | Never inferred only from editor text. |
| Chat, mentions, unread markers | Database | Avoids competing chat history in cells. |
| Asset versions and reviews | Database | Links may point to approved file storage. |
| Transition and synchronization history | Database | Append-only audit trail. |
| Publishing attempts/errors | Database | External publishing remains disabled. |

The exact owner of lifecycle status remains undecided. Before enabling writes, choose either the application or spreadsheet as authoritative and define conflict behavior.

## Spreadsheet adapter requirements

- Configuration and credentials outside source control.
- Allowlist the isolated spreadsheet ID and expected sheet names.
- Read-only mode by default.
- Re-fetch before update and compare a version/fingerprint.
- Update only mapped cells in one record, never overwrite a worksheet.
- Idempotency keys for create/submit actions.
- Retry only safe reads and idempotent writes.
- Record actor, intent, request result, and before/after values without logging sensitive content unnecessarily.
- Reject ambiguous row matches.
- Circuit-break writes when headers, formulas, or validation fingerprints differ from the audited schema.

## Authentication and authorization

- Prototype users are simulated and clearly labelled.
- Production should use organization SSO or an approved identity provider.
- Every mutation checks membership, role, task scope, current version, and allowed transition.
- Administration is distinct from team access.

## Conflict handling

- Application records use optimistic concurrency (`version` integer or ETag).
- Spreadsheet mappings store a hash of the last observed mapped cells.
- A changed source row produces a conflict for manual reconciliation, not last-write-wins.
- Duplicate submissions reuse the first successful result for the same idempotency key.

## Test spreadsheet gate

Candidate ID: `17LzvdnEhp2Vf3Q8sjKVDL2bmXYB3ZimBNIp8PVIaMgw`.

Before integration:

1. Confirm the owner/account and that it is not the production ID. The user identifies this as the isolated copy; public read access is verified.
2. Compare tab names, headers, formulas, validation, comments, and representative row counts with the audited export. Tab/header/formula/validation comparison is complete; threaded comments are omitted by the live export.
3. Review Apps Script projects, simple/installable triggers, add-ons, notification rules, form connections, IMPORTRANGE/external formulas, and service accounts.
4. Establish a write allowlist and backup/export.
5. Approve read-only credentials first.
6. Review read behavior and logs before separately approving test writes.

## Environment limitations

The prototype uses a buildless frontend. A production Next.js scaffold should use a pinned Node LTS release and lockfile.
