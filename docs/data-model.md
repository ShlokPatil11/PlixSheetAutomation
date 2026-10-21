# Data model

## Primary entities

### Task

- `id`: immutable application ID
- `legacySource`: optional spreadsheet mapping
- `title`, `brand`, `category`, `product`, `campaign`, `contentType`
- `priority`: `P0 | P1 | P2 | R0`
- `state`: internal workflow state
- `legacyStatus`: exact workbook value when imported
- `targetDate`, `shootDate`, `createdAt`, `updatedAt`
- `contentOwnerId`, `editorId`, `publisherId`
- `briefId`, `currentVersionId`
- `blockedReason`, `holdReason`
- `recordVersion`: optimistic-concurrency integer

### Brief

- `id`, `taskId`
- `script`, `instructions`, `deliverables`
- `contentDependency`
- `references[]`
- `completenessIssues[]`
- author and revision timestamps

### AssetVersion

- `id`, `taskId`, monotonically increasing `number`
- storage/reference URL and media metadata
- `submittedBy`, `submittedAt`, `submissionNote`
- immutable after submission

### ScriptDocument

- `id`, `taskId`, filename, media type, size, and storage reference
- `status`: `pending | approved | changes_requested`
- uploader and upload timestamp
- Brand reviewer, decision timestamp, and review comment
- prior script versions remain immutable after replacement

The local prototype stores additional and script documents in browser IndexedDB and keeps their metadata with the task. Production storage requires an approved private object store; documents must not be embedded in spreadsheet cells or source control.

### Review

- `id`, `taskId`, `assetVersionId`
- `decision`: `approved | changes_requested`
- `comments`, `reviewerId`, `createdAt`

### PublishingAttempt

- `id`, `taskId`, `platform`
- `assigneeId`, `status`
- `referenceUrl`, `publishedAt`
- `errorCode`, `errorMessage`, retry relationship

The initial implementation records publishing only; it never invokes a platform API.

### Message and channel

- `Channel`: team, campaign, or task scope
- `Message`: author, body, timestamp, reply reference, task/version reference
- `Mention`: message and mentioned user
- `ReadPosition`: user/channel last-read message

### ActivityEvent

- task, actor, action, timestamp
- previous and next state
- related entity/version
- structured metadata and idempotency key

### SpreadsheetMapping

- spreadsheet ID, sheet name
- application task ID
- source row or developer metadata identifier
- last observed field fingerprint
- last read/write revision and timestamp

## Relationships

```text
Task 1--1 Brief
Task 1--* AssetVersion 1--* Review
Task 1--* PublishingAttempt
Task 1--* ActivityEvent
Task 1--* Message (through task channel)
Task 1--0..* SpreadsheetMapping
User *--* Team (through membership and role)
```

## Workbook mapping status

| Application field | Candidate workbook source | Confidence |
| --- | --- | --- |
| Category | Work Plan C; AI B | High |
| Product | Work Plan F; AI E | Medium |
| Content/edit type | Work Plan D; AI C | High |
| Reference | Work Plan G; AI F | Medium |
| Script | Work Plan H; AI I | Medium; sometimes display-label links. |
| Brand feedback | Work Plan I; AI J | Medium |
| Priority | Work Plan J; AI K | Low because statuses are mixed in. |
| Workflow status | Work Plan K; AI L and other columns | Low until semantics are confirmed. |
| Editor | Work Plan L; AI M | High |
| Output link | Work Plan Q; AI Q | Medium |
| Published/live | Work Plan R; AI R | Low because free text is mixed in. |
| Due/target date | No unambiguous source | Unknown. |
| Stable ID | None | Missing. |
| Version/review history | Threaded comments and overwritten cells only | Missing as structured data. |

No mapping marked low or unknown may be written back without review.
