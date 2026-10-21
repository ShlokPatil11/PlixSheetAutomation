import hashlib
import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def load_json(relative_path):
    return json.loads((ROOT / relative_path).read_text(encoding="utf-8"))


class WorkflowContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.workflow = load_json("config/workflow.json")
        cls.fixture = load_json("data/mock-data.json")

    def test_all_transition_targets_are_defined(self):
        states = set(self.workflow["states"])
        self.assertEqual(states, set(self.workflow["transitions"]))
        for source, targets in self.workflow["transitions"].items():
            self.assertTrue(set(targets) <= states, source)

    def test_terminal_states_have_no_outgoing_transitions(self):
        for state in self.workflow["terminalStates"]:
            self.assertEqual([], self.workflow["transitions"][state])

    def test_revision_loop_is_reachable(self):
        transitions = self.workflow["transitions"]
        self.assertIn("changes_requested", transitions["approval_pending"])
        self.assertIn("editing_in_progress", transitions["changes_requested"])
        self.assertIn("approval_pending", transitions["editing_in_progress"])

    def test_happy_path_is_reachable(self):
        path = [
            "draft", "social_research", "script_approval_pending", "editing_queue", "editing_in_progress", "approval_pending",
            "approved", "ready_for_performance", "publishing_in_progress", "published"
        ]
        for source, target in zip(path, path[1:]):
            self.assertIn(target, self.workflow["transitions"][source])

    def test_each_team_has_scoped_actions(self):
        actions = self.workflow["roleActions"]
        self.assertIn("create_brief", actions["brand"])
        self.assertIn("find_content", actions["content"])
        self.assertIn("submit_script", actions["content"])
        self.assertIn("submit_version", actions["edit"])
        self.assertIn("approve", actions["brand"])
        self.assertIn("record_publish_result", actions["performance"])
        all_team_actions = set().union(*(set(actions[role]) for role in ("content", "edit", "brand", "performance")))
        self.assertTrue(all_team_actions <= set(actions["administrator"]))


class FixtureTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.workflow = load_json("config/workflow.json")
        cls.fixture = load_json("data/mock-data.json")

    def test_fixture_is_explicitly_sanitized_and_offline(self):
        self.assertTrue(self.fixture["meta"]["fixture"])
        self.assertTrue(self.fixture["meta"]["sanitized"])
        self.assertFalse(self.fixture["meta"]["externalConnections"])

    def test_tasks_have_unique_stable_ids_and_valid_states(self):
        tasks = self.fixture["tasks"]
        ids = [task["id"] for task in tasks]
        self.assertEqual(len(ids), len(set(ids)))
        self.assertTrue(all(re.fullmatch(r"BPE-\d+", task_id) for task_id in ids))
        self.assertTrue(all(task["state"] in self.workflow["states"] for task in tasks))

    def test_references_point_to_fixture_users(self):
        users = {user["id"] for user in self.fixture["users"]}
        for task in self.fixture["tasks"]:
            for field in ("contentOwnerId", "editorId", "publisherId"):
                self.assertTrue(task[field] is None or task[field] in users, (task["id"], field))
        self.assertTrue(all(message["authorId"] in users for message in self.fixture["messages"]))

    def test_versions_are_ordered_and_unique_per_task(self):
        for task in self.fixture["tasks"]:
            numbers = [version["number"] for version in task["versions"]]
            self.assertEqual(numbers, sorted(set(numbers)), task["id"])

    def test_fixture_contains_no_live_urls_or_email_addresses(self):
        raw = json.dumps(self.fixture)
        self.assertNotRegex(raw, r"https?://")
        self.assertNotRegex(raw, r"[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}")

    def test_overdue_fixture_remains_unresolved(self):
        as_of = self.fixture["meta"]["asOf"]
        overdue = [task for task in self.fixture["tasks"] if task["targetDate"] < as_of and task["state"] not in ("published", "cancelled")]
        self.assertTrue(overdue)


class WorkbookIntegrationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.workflow = load_json("config/workflow.json")
        cls.fixture = load_json("data/mock-data.json")
        cls.imported = load_json("data/workbook-data.json")

    def test_only_requested_tabs_are_integrated(self):
        expected = {"AI Tracker Main", "Work Plan"}
        self.assertEqual(expected, {sheet["name"] for sheet in self.imported["sheets"]})
        self.assertEqual(expected, {task["source"]["sheet"] for task in self.imported["tasks"]})
        self.assertEqual(2, self.imported["meta"]["sheetCount"])

    def test_integrated_tasks_are_valid_and_source_backed(self):
        tasks = self.imported["tasks"]
        ids = [task["id"] for task in tasks]
        self.assertEqual(self.imported["meta"]["taskCount"], len(tasks))
        self.assertEqual(len(ids), len(set(ids)))
        self.assertTrue(all(re.fullmatch(r"BPE-\d+", task_id) for task_id in ids))
        self.assertTrue(all(task["state"] in self.workflow["states"] for task in tasks))
        self.assertTrue(all(task["source"]["row"] > 1 for task in tasks))

    def test_integrated_user_references_resolve(self):
        users = {user["id"] for user in self.fixture["users"]} | {user["id"] for user in self.imported["users"]}
        for task in self.imported["tasks"]:
            for field in ("contentOwnerId", "editorId", "publisherId"):
                self.assertTrue(task[field] is None or task[field] in users, (task["id"], field))

    def test_import_matches_audited_workbook(self):
        self.assertEqual(
            "A8791DF785F83D90D6B8F27F47F36494F7B61619C34C840067879B9FCBDE80FB",
            self.imported["meta"]["workbookSha256"],
        )


class StaticApplicationTests(unittest.TestCase):
    def test_required_files_exist(self):
        required = [
            "index.html", "styles.css", "app.js", ".env.example", "README.md",
            "sheet-adapter.js", "pdf-store.js", "data/workbook-schema.json", "data/workbook-data.json",
            "docs/workbook-audit.md", "docs/workflow-spec.md", "docs/architecture.md",
            "docs/data-model.md", "docs/testing-plan.md"
        ]
        for path in required:
            self.assertTrue((ROOT / path).is_file(), path)

    def test_application_has_no_external_network_targets(self):
        for path in ("index.html", "styles.css"):
            content = (ROOT / path).read_text(encoding="utf-8")
            self.assertNotRegex(content, r"https?://", path)
        script = (ROOT / "app.js").read_text(encoding="utf-8")
        self.assertNotRegex(script, r"fetch\(['\"]https?://")
        self.assertNotRegex(script, r"\.src\s*=\s*['\"]https?://")
        self.assertNotIn("17LzvdnEhp2Vf3Q8sjKVDL2bmXYB3ZimBNIp8PVIaMgw", script)

    def test_sheet_adapter_is_read_only_and_allowlisted(self):
        adapter = (ROOT / "sheet-adapter.js").read_text(encoding="utf-8")
        self.assertIn("17LzvdnEhp2Vf3Q8sjKVDL2bmXYB3ZimBNIp8PVIaMgw", adapter)
        self.assertIn("/gviz/tq", adapter)
        self.assertNotRegex(adapter.lower(), r"method\s*:\s*['\"](post|put|patch|delete)['\"]")
        self.assertNotIn("/edit", adapter)

    def test_application_loads_local_workbook_snapshot(self):
        script = (ROOT / "app.js").read_text(encoding="utf-8")
        self.assertIn('fetch("data/workbook-data.json")', script)
        self.assertIn("integrateWorkbookData", script)
        self.assertNotIn("loadSheetPreview", script)

    def test_accessibility_landmarks_exist(self):
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        script = (ROOT / "app.js").read_text(encoding="utf-8")
        self.assertIn('aria-live="polite"', html)
        self.assertIn('aria-label="Primary navigation"', script)
        self.assertIn('aria-label="Global search"', script)
        self.assertIn('role="dialog"', script)

    def test_content_brief_accepts_and_preserves_references(self):
        script = (ROOT / "app.js").read_text(encoding="utf-8")
        self.assertIn('name="references"', script)
        self.assertIn('form.get("references")', script)
        self.assertIn("references.length", script)
        self.assertIn("noopener noreferrer", script)
        self.assertIn('url.protocol === "https:"', script)

    def test_brand_approval_hands_off_to_performance(self):
        script = (ROOT / "app.js").read_text(encoding="utf-8")
        self.assertIn('"Approve video send to Perf team"', script)
        self.assertIn('["approved", "ready_for_performance"]', script)
        self.assertIn('appState.page === "brand"', script)
        self.assertIn('appState.page === "edit"', script)

    def test_script_document_is_gated_by_brand_before_edit(self):
        script = (ROOT / "app.js").read_text(encoding="utf-8")
        workflow = load_json("config/workflow.json")
        self.assertIn('data-upload-script', script)
        self.assertIn('purpose: "script"', script)
        self.assertIn('"script_approval_pending"', script)
        self.assertIn('"Send approval to Video Team"', script)
        self.assertNotIn("editing_queue", workflow["transitions"]["draft"])
        self.assertIn("social_research", workflow["transitions"]["draft"])
        self.assertIn("script_approval_pending", workflow["transitions"]["social_research"])
        self.assertIn("editing_queue", workflow["transitions"]["script_approval_pending"])
        self.assertIn("script_changes_requested", workflow["transitions"]["script_approval_pending"])

    def test_brand_intake_fields_and_post_intake_editor_assignment(self):
        script = (ROOT / "app.js").read_text(encoding="utf-8")
        self.assertNotIn('name="brand"', script)
        self.assertNotIn('name="targetDate"', script)
        self.assertIn('name="contentType"', script)
        self.assertIn('name="briefType"', script)
        self.assertIn('<label for="brief-name">Hook name</label>', script)
        self.assertIn('<th>Hook name</th>', script)
        self.assertIn('value="video">Video brief — Work Plan', script)
        self.assertIn('value="ai">AI brief — AI Tracker Main', script)
        for content_type in ("UGC", "AI Hook", "AI Avatar", "Music"):
            self.assertIn(content_type, script)
        self.assertIn('name="additionalDocument"', script)
        self.assertNotIn('id="content-editor"', script)
        self.assertIn('const DEFAULT_EDITOR_ID = "usr-other-editor"', script)
        self.assertIn('appState.page !== "edit"', script)
        self.assertIn('data-assign-editor', script)

    def test_content_types_change_with_brief_type(self):
        script = (ROOT / "app.js").read_text(encoding="utf-8")
        self.assertIn("CONTENT_TYPES_BY_BRIEF", script)
        for ai_type in ("AI Male", "AI Female", "AI Avatar", "AI Hook", "UGC Creator", "Dr. Ojas"):
            self.assertIn(ai_type, script)
        for video_type in ("UGC", "Shorter Cut", "Office Shoot", "Talent", "Regional Music"):
            self.assertIn(video_type, script)
        self.assertIn('updateBriefContentTypes(event.target.value)', script)
        self.assertIn('document.getElementById("brief-kind")?.addEventListener("change"', script)

    def test_category_auto_assignments_and_b2g2(self):
        script = (ROOT / "app.js").read_text(encoding="utf-8")
        fixture = load_json("data/mock-data.json")
        users = {person["id"]: person["name"] for person in fixture["users"]}
        expected_users = {
            "usr-himani": "Himani", "usr-zoha": "Zoha", "usr-tanmay": "Tanmay",
            "usr-sanjeet": "Sanjeet", "usr-ansh": "Ansh",
            "usr-sidhharth": "Sidhharth", "usr-siddhartha": "Siddhartha",
            "usr-sindhura": "Sindhura", "usr-sonali": "Sonali", "usr-shama": "Shama"
        }
        self.assertTrue(expected_users.items() <= users.items())
        for category, script_owner, approvers in (
            ("skin", "usr-himani", ["usr-sanjeet", "usr-ansh"]),
            ("hair", "usr-zoha", ["usr-sidhharth", "usr-siddhartha"]),
            ("nutra", "usr-tanmay", ["usr-sindhura", "usr-sonali"]),
            ("joyun", None, ["usr-shama"]),
        ):
            owner_text = "null" if script_owner is None else f'"{script_owner}"'
            approver_text = ", ".join(f'"{approver}"' for approver in approvers)
            self.assertIn(f'{category}: {{ scriptOwnerId: {owner_text}, brandApproverIds: [{approver_text}] }}', script)
        self.assertIn("<option>B2G2</option>", script)
        self.assertIn("updateBriefAssignments(event.target.value)", script)
        self.assertIn("Content script owner", script)
        self.assertIn("Brand approvers", script)
        self.assertIn("Content scripter ·", script)
        self.assertIn("Brand approvers ·", script)
        self.assertIn("Actual team time and owners", script)

    def test_workbook_tabs_map_to_brief_types_in_all_queues(self):
        script = (ROOT / "app.js").read_text(encoding="utf-8")
        imported = load_json("data/workbook-data.json")
        self.assertTrue(all(task["source"]["sheet"] in {"Work Plan", "AI Tracker Main"} for task in imported["tasks"]))
        self.assertIn('video: { label: "Video brief", sheet: "Work Plan" }', script)
        self.assertIn('ai: { label: "AI brief", sheet: "AI Tracker Main" }', script)
        self.assertIn('<th>Brief type</th>', script)
        self.assertIn('briefTypeMarkup(task)', script)
        self.assertIn('<label>Source sheet</label>', script)

    def test_actual_time_comes_from_stage_history(self):
        script = (ROOT / "app.js").read_text(encoding="utf-8")
        self.assertIn("function actualTaskMinutes", script)
        self.assertIn("function actualTimeMarkup", script)
        self.assertIn("if (openStage) openStage.endedAt = changedAt", script)
        for hidden_label in ("Estimated time", "Total estimate", "Average estimate", "Above estimate"):
            self.assertNotIn(hidden_label, script)

    def test_published_state_is_presented_as_live(self):
        script = (ROOT / "app.js").read_text(encoding="utf-8")
        workflow = json.loads((ROOT / "config" / "workflow.json").read_text(encoding="utf-8"))
        self.assertIn('["published","Live"]', script)
        self.assertEqual(workflow["states"]["published"]["label"], "Live")

    def test_brief_types_have_separate_queue_tabs(self):
        script = (ROOT / "app.js").read_text(encoding="utf-8")
        self.assertIn('briefType: "video"', script)
        self.assertIn('data-brief-queue="video">Video brief queue', script)
        self.assertIn('data-brief-queue="ai">AI brief queue', script)
        self.assertIn('task.briefType === appState.filters.briefType', script)
        self.assertIn('appState.filters.briefType = el.dataset.briefQueue', script)

    def test_perf_queue_order_and_labels(self):
        script = (ROOT / "app.js").read_text(encoding="utf-8")
        workflow = json.loads((ROOT / "config" / "workflow.json").read_text(encoding="utf-8"))
        ordered = '[["ready_for_performance","Ready for live"],["published","Live"],["publishing_in_progress","Rework"],["publishing_failed","Failed / On hold"]]'
        self.assertIn(ordered, script)
        self.assertEqual("Ready for live", workflow["states"]["ready_for_performance"]["label"])
        self.assertEqual("Rework", workflow["states"]["publishing_in_progress"]["label"])
        self.assertEqual("Failed / On hold", workflow["states"]["publishing_failed"]["label"])

    def test_queue_and_task_details_include_actual_time_and_timestamps(self):
        script = (ROOT / "app.js").read_text(encoding="utf-8")
        for label in ("Content type", "References & documents", "Actual time", "Actual team time"):
            self.assertIn(label, script)
        self.assertIn("stageHistory", script)
        self.assertIn("formatTime(a.at)", script)

    def test_video_resources_and_failed_on_hold_labels(self):
        script = (ROOT / "app.js").read_text(encoding="utf-8")
        workflow = json.loads((ROOT / "config" / "workflow.json").read_text(encoding="utf-8"))
        self.assertIn("Video resource", script)
        self.assertIn("No video resource added", script)
        self.assertIn("Failed / On hold", script)
        self.assertEqual("Failed / On hold", workflow["states"]["publishing_failed"]["label"])

    def test_video_team_new_brief_submission_modal(self):
        script = (ROOT / "app.js").read_text(encoding="utf-8")
        for expected in (
            'data-modal="video-brief"',
            'id="video-brief-form"',
            'name="videoLink"',
            'name="comments"',
            "Send to Brand Team",
            'document.getElementById("video-brief-form")?.addEventListener("submit", submitVideoHandoff)',
        ):
            self.assertIn(expected, script)

    def test_ui_has_plain_language_navigation_and_workflow_guide(self):
        script = (ROOT / "app.js").read_text(encoding="utf-8")
        styles = (ROOT / "styles.css").read_text(encoding="utf-8")
        for label in ("Brand Team", "Content Team", "Video team", "Perf team", "How work moves"):
            self.assertIn(label, script)
        self.assertNotIn('["brand", "Approvals", "brand"]', script)
        for step in ("Brand requirements", "Content script", "Brand script approval", "Video production", "Brand video approval", "Perf go-live", "Status Live"):
            self.assertIn(step, script)
        self.assertIn('aria-label="How work moves"', script)
        self.assertIn(".workflow-guide", styles)
        self.assertIn("--accent: #1d1a17", styles)
        self.assertIn("--canvas: #f7f7f7", styles)
        self.assertIn("Plain white operations theme", styles)

    def test_content_team_google_docs_brief_goes_to_brand_approval(self):
        script = (ROOT / "app.js").read_text(encoding="utf-8-sig")
        styles = (ROOT / "styles.css").read_text(encoding="utf-8-sig")
        self.assertIn('appState.page === "content"', script)
        self.assertIn('aria-label="Brand requirements received by Content Team"', script)
        self.assertIn('data-content-script-form', script)
        self.assertIn('data-modal="content-brief"', script)
        self.assertIn('id="content-brief-form"', script)
        self.assertIn('name="scriptLink"', script)
        self.assertIn('name="comments"', script)
        self.assertIn("Send script to Brand Team", script)
        self.assertIn('hostname !== "docs.google.com"', script)
        self.assertIn('transitionTask(task.id, "script_approval_pending", "script_link_submitted")', script)
        self.assertIn('.content-inbox', styles)

    def test_content_team_can_override_category_default_owner(self):
        script = (ROOT / "app.js").read_text(encoding="utf-8-sig")
        workflow = load_json("config/workflow.json")
        fixture = load_json("data/mock-data.json")
        self.assertIn('data-assign-content-owner=', script)
        self.assertIn('function assignContentOwner', script)
        self.assertIn('assign_content_owner', workflow["roleActions"]["content"])
        received = [task for task in fixture["tasks"] if task["state"] in {"social_research", "script_changes_requested"}]
        defaults = {"Skin": "usr-himani", "Hair": "usr-zoha", "Nutra": "usr-tanmay"}
        self.assertEqual(3, len(received))
        self.assertTrue(all(task["scriptOwnerId"] == defaults[task["category"]] for task in received))

    def test_content_script_handoff_is_first_in_drawer(self):
        script = (ROOT / "app.js").read_text(encoding="utf-8-sig")
        workflow = load_json("config/workflow.json")
        self.assertEqual("Script queue", workflow["states"]["social_research"]["label"])
        self.assertIn('["social_research","Script queue"]', script)
        self.assertIn('body = `${appState.page === "content" ? scriptUploadLinkMarkup(task) : ""}<div class="detail-grid drawer-overview-grid">', script)
        self.assertIn('form="drawer-script-form">Send script to Brand Team</button>', script)

    def test_every_board_stage_has_its_own_search(self):
        script = (ROOT / "app.js").read_text(encoding="utf-8-sig")
        styles = (ROOT / "styles.css").read_text(encoding="utf-8-sig")
        self.assertIn('data-stage-search=', script)
        self.assertIn('stageSearch: {}', script)
        self.assertIn('placeholder="Search ${escapeHtml(label.toLowerCase())}"', script)
        self.assertIn('.stage-search', styles)

    def test_new_brief_uses_searchable_official_product_catalogue(self):
        script = (ROOT / "app.js").read_text(encoding="utf-8-sig")
        catalogue = load_json("data/plix-products.json")
        self.assertIn('id="brief-product-search"', script)
        self.assertIn('id="brief-product" name="product" required', script)
        self.assertIn('filterProductCatalog', script)
        self.assertIn('syncCategoryToProduct', script)
        self.assertEqual("https://www.plixlife.com/collection/r-all-products/302", catalogue["meta"]["source"])
        self.assertGreaterEqual(len(catalogue["products"]), 50)

    def test_brand_team_navigation_is_in_teams_section(self):
        script = (ROOT / "app.js").read_text(encoding="utf-8-sig")
        self.assertIn('["brand", "Brand Team", "tasks"]', script)
        self.assertIn('navItems.slice(0,1)', script)
        self.assertIn('navItems.slice(1,5)', script)
        self.assertNotIn("All work", script)

    def test_other_editor_fallback_keeps_pipeline_moving(self):
        script = (ROOT / "app.js").read_text(encoding="utf-8")
        fixture = load_json("data/mock-data.json")
        users = {person["name"]: person for person in fixture["users"]}
        self.assertTrue(users["Pritam"]["isTeamLead"])
        self.assertTrue(users["Yashasvi"]["isTeamLead"])
        self.assertTrue(users["Other"]["isFallback"])
        self.assertIn('const DEFAULT_EDITOR_ID = "usr-other-editor"', script)
        self.assertIn('task.editorId = DEFAULT_EDITOR_ID', script)
        self.assertNotIn("Video Editor not assigned", script)
        self.assertNotIn('name="editorId" required', script)

    def test_post_intake_handoffs_have_change_request_comments(self):
        script = (ROOT / "app.js").read_text(encoding="utf-8")
        self.assertIn('id="change-request-form"', script)
        self.assertIn('name="comments" required', script)
        self.assertIn('data-request-changes=', script)
        self.assertIn("Send video to Brand Team", script)
        self.assertIn("Send approval to Video Team", script)
        self.assertIn("Approve video send to Perf team", script)
        self.assertIn('transitionButton("published", "Go Live", "go_live")', script)
        self.assertIn("lastChangeRequestComment", script)

    def test_video_handoff_precedes_overview_and_accepts_drive_only(self):
        script = (ROOT / "app.js").read_text(encoding="utf-8-sig")
        self.assertIn('<h3>Video link</h3>', script)
        self.assertIn('name="videoLink" type="url" inputmode="url" required', script)
        self.assertNotIn('name="videoFile"', script)
        self.assertNotIn('accept="video/mp4,.mp4"', script)
        self.assertIn('data-video-handoff-form', script)
        self.assertIn('hostname !== "drive.google.com"', script)
        self.assertIn('form="drawer-video-form">Send video to Brand Team</button>', script)
        self.assertIn('appState.page === "edit" ? videoHandoffMarkup(task) + referenceLinksMarkup(task)', script)

    def test_brand_intake_uses_additional_comments_label(self):
        script = (ROOT / "app.js").read_text(encoding="utf-8")
        self.assertIn('<label for="brief-summary">Additional Comments</label>', script)
        self.assertNotIn('<label for="brief-summary">Product details and additional requirements</label>', script)

    def test_original_workbook_checksum_is_unchanged(self):
        workbook = ROOT / "Brand Perf Edit.xlsx"
        digest = hashlib.sha256(workbook.read_bytes()).hexdigest().upper()
        self.assertEqual("A8791DF785F83D90D6B8F27F47F36494F7B61619C34C840067879B9FCBDE80FB", digest)

    def test_all_audited_tabs_are_live_verified_and_read_only(self):
        schema = load_json("data/workbook-schema.json")
        self.assertEqual(13, len(schema["sheets"]))
        self.assertEqual(13, len({sheet["name"] for sheet in schema["sheets"]}))
        self.assertTrue(schema["source"]["liveVerified"])
        self.assertFalse(schema["source"]["writeEnabled"])


if __name__ == "__main__":
    unittest.main()

