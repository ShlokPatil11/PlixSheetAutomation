# Workflow specification

## Status of this specification

This is a proposed internal state model built around the workbook’s observed vocabulary. Mappings marked provisional require business confirmation before spreadsheet writes are enabled.

## Core principles

- A task retains one immutable application ID for its lifetime.
- A deliverable may have multiple asset versions and multiple reviews.
- Status transitions append history; they do not erase earlier values.
- Pending and overdue tasks remain queryable until resolved.
- Server-side authorization and transition validation are authoritative.
- Spreadsheet labels are preserved through an explicit mapping layer.

## Proposed internal states

| Internal state | Workbook evidence | Notes |
| --- | --- | --- |
| `draft` | Blank/incomplete rows | Application-only until a brief is submitted. |
| `social_research` | Application-only | Social is finding references and preparing the script from Brand requirements. |
| `editing_queue` | `P0/P1/P2/R0`, assigned/unassigned editor | Provisional because priority and status are mixed today. |
| `editing_in_progress` | `WiP` / `WIP` / `Working` | Normalize spelling internally; preserve original label externally. |
| `approval_pending` | `Video Approval Pending`, sometimes `Approval Pending` | Script approval remains a separate gate/field. |
| `changes_requested` | `NEED MORE EDIT` or review comments | Workbook has no consistent value; do not write one without approval. |
| `approved` | `Script Approved` is script-only; no reliable video-approved value found | Requires clarification. |
| `ready_for_performance` | Inferred after approval | Application state; workbook mapping unresolved. |
| `publishing_in_progress` | No stable workbook value | Application state; workbook mapping unresolved. |
| `published` | `Live` / `live` | Keep publication reference and timestamp separately. |
| `on_hold` | `On hold`, `Hold`, free-text hold instructions | Normalize internally. |
| `blocked` | Missing link/content/script comments | Requires a structured reason. |
| `publishing_failed` | No structured workbook value | Application state with error details. |
| `cancelled` | Not observed | Do not map to workbook until confirmed. |
| `closed_legacy` | `Closed` | Meaning is unresolved; never automatically equate with published. |

## Permitted transitions

```text
draft -> social_research
social_research -> script_approval_pending | blocked | on_hold | cancelled
script_approval_pending -> editing_queue | script_changes_requested | on_hold | cancelled
script_changes_requested -> script_approval_pending | cancelled
editing_queue -> editing_in_progress | blocked | on_hold | cancelled
editing_in_progress -> approval_pending | blocked | on_hold | cancelled
approval_pending -> approved | changes_requested | on_hold | cancelled
changes_requested -> editing_in_progress
approved -> ready_for_performance
ready_for_performance -> publishing_in_progress | blocked | on_hold
publishing_in_progress -> published | publishing_failed
publishing_failed -> publishing_in_progress | on_hold | cancelled
on_hold -> previous_active_state | cancelled
blocked -> previous_active_state | on_hold | cancelled
```

Transitions must carry actor, timestamp, prior state, next state, reason when applicable, and an idempotency key. Review transitions must reference the reviewed asset version.

## Brand intake

- Brand creates the task with hook name, product, category, priority, content type, brief type, additional documents, reference links, and requirements.
- Video briefs map to `Work Plan`; AI briefs map to `AI Tracker Main`. The brief type and source sheet remain visible in every queue.
- Every team workspace separates tasks into switchable Video brief and AI brief queues before applying priority and status filters.
- The content-type dropdown changes with the brief type: AI briefs show AI-specific options, while Video briefs show standard video-production tags.
- Category routing assigns Content Team script owners and Brand approvers: Skin to Himani with Sanjeet and Ansh; Hair to Zoha with Sidhharth and Siddhartha; Nutra to Tanmay with Sindhura and Sonali; Joyun approval to Shama. Global and B2G2 remain visibly unassigned until owners are provided.
- Brand and Content Team do not assign the editor. Until Pritam and Yashasvi resume manual assignment, the application automatically uses `Other` as the fallback Video Editor after script approval.
- Sending the intake moves the task to Content Team script preparation.

## Content Team workspace

- Content Team prepares the script from the Brand brief.
- Content Team submits the Google Docs script link and optional comments to Brand Team approval without assigning an editor.
- A script change request returns the task to Content Team without exposing it to the Video team.

Fields without verified workbook equivalents remain application-only until mapping is approved.

## Video team workspace

- Show assigned today, overdue unresolved, unassigned, blocked, and approval-returned tasks only after script approval.
- Receive the approved script document, references, requirements, and additional documents together when Brand releases the task.
- Unassigned work uses `Other` as the Video Editor and can proceed without waiting for manual lead assignment.
- Reassignment creates an activity event.
- Video editors see the immutable brief snapshot relevant to their version plus current requirements.
- A submission creates a new asset version and moves the task to approval pending.
- A revision never overwrites the prior version.

## Brand workspace

- Own the initial brief, queue submitted scripts before video production starts, and separately review the latest video version; editor assignment remains with the Video Team leads.
- Script approval releases the complete brief to the Video Team queue and assigns `Other` when no editor is present. A script change request returns it to Content Team.
- Review action is either approve or request changes; both require attribution and timestamp.
- Video approval records the decision and immediately places the task in the Perf team's ready queue; users do not perform a second handoff action.
- Change requests require comments tied to the version.
- Except for the initial Brand-to-Content request, active handoff queues provide a forward approval action and a comment-required Request changes action that returns work to the responsible prior team.
- Resubmission creates a new version and returns to approval pending.
- Previous versions and review decisions remain visible.

## Perf team workspace

- Only Brand-approved videos enter the go-live queue.
- Queue order is Ready for live, Live, Rework, and Failed.
- Ready-for-live tasks retain the full brief, script link, requirements, references, documents, editor, owners, and activity history. Perf completes the task with the `Go Live` action.
- Track platform, publishing assignee, state, publishing reference/URL, published time, and failure details.
- The prototype never publishes externally.
- A future Meta integration is a separately approved project.

## Estimates and elapsed time

- Estimates are derived from content type, priority, references, and document availability.
- Brand, Content, Video, and Performance receive separate estimated durations.
- Every handoff closes the current team stage and starts the next with an exact timestamp.
- The task detail view shows each team's estimate without displaying elapsed time.

## Collaboration

- Team channels, optional campaign channels, and task threads are distinct scopes.
- Messages carry author, timestamp, mentions, task/version link, and edit/delete metadata.
- Review feedback is stored as a review comment even when mirrored into a task thread.
- Read receipts/unread positions are per user.
- Browser-local persistence is acceptable only for the mock prototype; production collaboration requires durable server storage.

## Roles

| Capability | Content | Edit | Brand | Performance | Admin |
| --- | ---: | ---: | ---: | ---: | ---: |
| View relevant tasks | Yes | Yes | Yes | Yes | All |
| Create/edit briefs | No | Requirements only | Yes | Read | All |
| Find content/submit scripts | Yes | No | Review | Read | All |
| Assign editor | No | Leads only | No | No | Yes |
| Submit edit/version | No | Yes | No | No | Yes |
| Approve/request changes | Stage-specific | Stage-specific | Yes | Stage-specific | Yes |
| Track publishing | Read | Read | Read | Yes | Yes |
| Manage users/mappings | No | No | No | No | Yes |

All permissions must be checked in server actions and the data-access layer, not only in navigation.
