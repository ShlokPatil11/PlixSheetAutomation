# Testing plan

## Safety invariants

- Test fixtures contain no copied production names, emails, links, scripts, or campaign text.
- Automated tests never receive production or candidate spreadsheet credentials.
- Network access is disabled for unit and component tests.
- Spreadsheet adapter tests use an in-memory fake or recorded sanitized schema.
- No notification, upload, publishing, or external automation client is enabled.

## Unit tests

- Valid and invalid workflow transitions.
- Role permission matrix for each action.
- Stable task identity through transitions and date changes.
- Priority and legacy-status normalization without destroying original values.
- Today, overdue, unresolved, and unscheduled selection.
- Idempotent brief submission and version submission.
- Version numbering and immutable prior versions.
- Approval/change-request linkage to the reviewed version.
- Publishing failure and retry history.
- Missing requirements and missing assets.
- Optimistic-concurrency conflict detection.

## Integration tests

- Create a task once and reject duplicate submission.
- Assign and reassign an editor with activity history.
- Submit version, request changes, resubmit, and approve.
- Preserve all versions and review decisions.
- Move approved work to performance without auto-publishing.
- Persist chat messages, mentions, and unread positions.
- Reject unauthorized approval, assignment, and publishing actions.
- Surface stale-write conflicts.

## Spreadsheet contract tests

Run only against sanitized fixtures until read-only access is approved.

- Validate exact sheet/header fingerprints.
- Parse mixed date formats while preserving source text.
- Preserve formulas, validation, comments, links, and formatting outside mapped cells.
- Reject missing or duplicated row identity.
- Perform targeted updates only.
- Verify retry/idempotency behavior.
- Detect source changes before writes.
- Prove configured spreadsheet ID differs from the recorded production ID.
- Confirm the client has no live notification or publishing capability.

## End-to-end scenarios

1. Content creates a complete brief and submits it once.
2. An editor sees today’s and older pending work, then takes assignment.
3. Missing assets block submission with a recorded reason.
4. Version 1 is submitted, changes are requested, and version 2 is submitted.
5. Brand approves version 2 while version 1 and its review remain visible.
6. Performance records a publishing failure, retries, and records a final reference.
7. A user without the Brand role cannot approve.
8. Two users update the same task; the stale update receives a conflict.
9. Messages remain after reload in the persistent implementation.
10. No test contacts Google Sheets, Meta, email, chat, or notification services unless an isolated test is separately authorized.

## Prototype verification

- Static markup and fixture-schema checks.
- Keyboard focus visibility and landmark checks.
- Responsive layouts at narrow, tablet, and desktop widths.
- Manual demonstration of all four workspaces and the revision loop.
- Browser-local persistence is labelled as prototype-only and is not considered proof of production chat persistence.

## Exit gates

- Phase 1: mock UI is navigable with no external requests.
- Phase 2–4: all workspace and workflow tests pass against fixtures.
- Phase 5 read-only: candidate spreadsheet identity and automation review completed.
- Phase 5 writes: explicit approval, backup, allowlist, contract tests, and conflict controls completed.
- Production: separate security, privacy, migration, operational, and deployment review.

