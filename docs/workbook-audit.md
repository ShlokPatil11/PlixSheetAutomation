# Workbook audit

## Scope and safety

This audit covers the local export `Brand Perf Edit.xlsx`, inspected read-only on 2026-10-14. Its SHA-256 digest is `A8791DF785F83D90D6B8F27F47F36494F7B61619C34C840067879B9FCBDE80FB`.

The user designated Google spreadsheet `17LzvdnEhp2Vf3Q8sjKVDL2bmXYB3ZimBNIp8PVIaMgw` as the copied, isolated test candidate and enabled link-based viewing. A read-only export was obtained on 2026-10-14 and compared with the local audit file. All 13 sheet names, headers, formula counts, and validation counts match. Twelve tabs match cell-for-cell. In `AI Tracker Main`, Google recalculated the dependency array formula: 34 cached/spill cells differ, including replacement of the local export's cached `#REF!` with calculated dependency text. No spreadsheet write, API credential, embedded link visit, notification, or external automation was attempted.

The live export SHA-256 digest at verification time was `A0D9A350150C4934719EA80E823AD59949B67797C0C63C320F4C220FE92AB7AF`. Its package hash differs from the local file because Google removed threaded-comment packages and reduced several formatted-but-empty ranges during export.

The export contains operational names, comments, and links. None are copied into application fixtures.

## Package-level findings

- 13 visible worksheets; no hidden worksheets.
- No VBA project, external-workbook link, Power Query connection, pivot table, or structured Excel table.
- Hundreds of hyperlinks point to Google Drive/Docs, Instagram, Facebook, YouTube, and a content service. These are references, not verified integrations.
- Five sheets contain threaded comments. The XLSX compatibility representation warns that edits in an incompatible Excel version may remove them.
- Five generated filter-view names target `Work Plan` ranges.
- No conditional-formatting rules were found. Visible color treatment is direct formatting.
- A read-only XLSX export cannot prove that the source Google Sheet has no Apps Script, installable triggers, add-ons, protected ranges, notification rules, or external automations. Isolation remains user-attested for those features.

## Worksheet inventory

| Worksheet | Observed structure and likely purpose | Calculated vs. manual |
| --- | --- | --- |
| `EXECUTIVE DASHBOARD` | Daily/category counts for completed videos, script approval, and video approval; separate summary by Hair, Skin, Nutra, and Joyun. | 26 `COUNTIFS`/sum formulas; baseline and source rows appear manual. |
| `BrandPerf` | Campaign/performance request intake: Date, Campaign, ROAS, Spends, Priority, Category, Requirement Given, Comments, Perf. Several unnamed columns also contain data. | No formulas or validation detected. Mostly free text. |
| `Work Plan` | Main edit tracker: Date, Shoot Date, Category, Type of Edit, Content Dependency, Product Name, Reference Link, Script, Brand Comment, Priority, Script/Edit Status, Editor, Script Comment, duplicated Product Name, Name, Hook Name, Drive Link, Status. | Column N mirrors product column F. Operational fields are manual. |
| `AI Tracker Main` | AI-oriented tracker: Date, Category, Type of Edit, Content Dependency, Product, Reference, Hooks, Comments, Script Link, Brand Team Comment, Priority, Script Status, Editor, Status, duplicated Product, Hook Name, Drive Link, Live. | Column D calculates dependency from edit type. Column O generally mirrors product. Other fields are manual. |
| `Joyun Work Plan Final` | Small Joyun tracker with entry/shoot dates, item name, edit type, references, comments, priority, script status, editor, product, Drive link, live marker, and status. | Manual. Relationship to the other Joyun sheet is unresolved. |
| `Shoot Requirement` | Current shoot brief arranged by category and male/female columns, with special requirements. | Manual, presentation-oriented matrix. |
| `Joyun Work Plan` | Older or parallel Joyun workflow with dates, type/edit type, product, hook, reference, script, comments, priority, editor, Drive link, status, and live marker. | Manual. |
| `Pack Details` | Placeholder containing only “Brand team to add.” | Manual placeholder. |
| `Script Bank` | Script intake/library: Date, POC, Product, Concept, AI Avatar, Script, Script Status, Edit Team POC, Video Status, plus a reference-bank section. | Manual. |
| `Static` | Static asset inventory by category/product/type and Drive link. | Manual. |
| `Content Bank` | Reference-content bank: Product, Link, comment, status, avatar, and script link. | Manual. |
| `Avatars and Personalities` | Creator/avatar directory with type, Drive link, category, and social handle. | Manual. |
| `Shoot Requirement (History)` | Historical shoot requirements arranged in date-labelled columns. | Manual and non-tabular. |

## Validation lists

Validation is embedded directly in worksheet rules rather than centralized lookup tables.

- Categories: variants of Hair, Skin, Nutra, Global, Talent, and joyun.
- Priority: `P0`, `P1`, `P2`, `R0`; historical data also contains `PO`.
- Script/edit status: combinations of `WiP`, `Closed`, `Video Approval Pending`, `Script Approved`, `Script Approval Pending`, and `On hold`.
- Editors: a repeated hard-coded list of individual names.
- Edit type: several non-identical lists covering music, regional, AI/avatar, named talent, shorter cut, pack extension/reduction, hook change, experimental, office shoot, and other variants.
- Content dependency: `Yes`/`NA` in `Work Plan`; calculated descriptive requirements in `AI Tracker Main`.

Validation ranges are fragmented. Some single cells have different lists, and stored values sometimes violate the active list.

## Observed values and data types

- Dates are a mixture of Excel serial numbers and strings such as `28/9/26`, `28/09/2026`, and `13-10-2026`.
- An invalid `31 Sept 26` and likely 2027 year typos exist.
- Categories and live states vary by capitalization.
- Priority columns contain lifecycle values such as `Closed`, `Approval Pending`, `WiP`, and `Script Approved`.
- Free-text instructions occur in status-like columns.
- One calculated cell in `AI Tracker Main` currently resolves to `#REF!`.
- Links may be hyperlink relationships, plain URL text, or display labels such as `LINK`.

## Task identity and relationships

No stable task identifier or explicit foreign key was found. A row is currently recognized informally through a combination of date, category, product, edit type, hook/creator, and reference. Row number is not safe identity because filtering, insertion, and sorting can change it.

The dashboard relates to trackers only through aggregate category/status formulas. There is no reliable record-level link among `BrandPerf`, `Work Plan`, `AI Tracker Main`, and the Joyun sheets. Similar rows cannot safely be classified as duplicates or versions without business confirmation.

## Daily work and pending work

Pending work remains in tracker rows until a user changes its status; there is no evidence of automatic daily deletion. “Today” appears to be inferred from entry date plus editor and status. No unambiguous due-date or assignment-date field exists. Dashboard completion counts use closed totals adjusted by manual baselines rather than explicit completion timestamps.

## Approval, revision, and publishing evidence

Approval is represented by script/edit status, brand comments, Drive links, and cell discussion. The workbook has no normalized review record, version identifier, reviewer field, decision timestamp, or explicit transition history.

Publishing is represented by `Live/live`, links, and free text. There is no structured publishing assignment, platform, attempt, failure reason, or recovery record.

## Compatibility risks

1. Google Apps Script, triggers, protected ranges, filter views, and Sheets-specific metadata may not survive XLSX export.
2. Threaded comments may be lost or flattened on round-trip through Excel tooling.
3. Shared/array formula behavior may differ between Excel and Google Sheets.
4. Mixed date storage prevents safe chronological filtering without normalization.
5. Rewriting whole sheets would risk formulas, validation, comments, hyperlinks, formatting, and concurrent edits.
6. A row-number-based integration would be vulnerable to sorting and insertion.
7. The test spreadsheet cannot receive writes until its contents, ownership, permissions, and automation state are independently reviewed.

## Unresolved semantics

- Canonical tracker for each category and whether the two Joyun sheets are historical/current.
- Exact meaning of `Closed` versus `Live`.
- Definition of “today’s work” and overdue work.
- Whether similar records across sheets are duplicates, versions, or separate deliverables.
- Whether revisions overwrite a row or create a row/version elsewhere.
- Whether `BrandPerf` is intake, reporting, or both.
- Whether threaded comments must be migrated into application history.
