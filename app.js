import { getTaskDocument, saveTaskDocument } from "./pdf-store.js";

const STORE_KEY = "brand-perf-edit-workflow-v3";
const STORE_VERSION = 4;
const DEFAULT_EDITOR_ID = "usr-other-editor";

const BRIEF_TYPES = {
  video: { label: "Video brief", sheet: "Work Plan" },
  ai: { label: "AI brief", sheet: "AI Tracker Main" }
};

const CONTENT_TYPES_BY_BRIEF = {
  video: ["UGC", "Music", "Shorter Cut", "Hook Change", "Office Shoot", "Talent", "Pack Reduction", "Pack Extension", "Regional Music", "Regional VO", "Ending Offer Add", "Global English", "Other"],
  ai: ["Music", "AI Male", "AI Female", "Priyanta", "Saurov", "Rishubh", "Pack Extension", "AI Avatar", "AI Hook", "Experimental", "Cyrus", "UGC Creator", "Yash", "Ashrafi", "Dr. Ojas"]
};

const CATEGORY_ASSIGNMENTS = {
  skin: { scriptOwnerId: "usr-himani", brandApproverIds: ["usr-sanjeet", "usr-ansh"] },
  hair: { scriptOwnerId: "usr-zoha", brandApproverIds: ["usr-sidhharth", "usr-siddhartha"] },
  nutra: { scriptOwnerId: "usr-tanmay", brandApproverIds: ["usr-sindhura", "usr-sonali"] },
  joyun: { scriptOwnerId: null, brandApproverIds: ["usr-shama"] },
  global: { scriptOwnerId: null, brandApproverIds: [] },
  b2g2: { scriptOwnerId: null, brandApproverIds: [] }
};

const iconPaths = {
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  overview: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  tasks: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  content: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h6"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z"/>',
  brand: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8z"/>',
  performance: '<path d="M3 3v18h18"/><path d="M7 16l4-5 4 3 5-7"/>',
  chat: '<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.7 9a2.5 2.5 0 1 1 3.6 2.2c-.8.4-1.3 1-1.3 1.8M12 17h.01"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  alert: '<path d="M10.3 3.7L2.2 18a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  filter: '<path d="M4 5h16M7 12h10M10 19h4"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  board: '<rect x="3" y="4" width="7" height="16" rx="1"/><rect x="14" y="4" width="7" height="10" rx="1"/>',
  send: '<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1"/>'
};

function icon(name, label = "") {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'}>${iconPaths[name] || ""}</svg>`;
}

const navItems = [
  ["overview", "Home", "overview"], ["brand", "Brand Team", "tasks"],
  ["content", "Content Team", "content"], ["edit", "Video team", "edit"],
  ["performance", "Perf team", "performance"],
  ["sources", "Sheet data", "tasks"], ["chat", "Team chat", "chat"]
];

const pageMeta = {
  overview: ["Good morning", "Here is what your teams need today."],
  tasks: ["Brand Team", "Manage Brand briefs, ownership, approvals, and every workflow status in one place."],
  content: ["Content Team scripts", "Submit Google Docs scripts and send them to the Brand Team for approval."],
  edit: ["Video team", "Create videos only after Brand approves the script."],
  brand: ["Brand intake and approvals", "Provide product requirements, approve scripts, assign the Video team, and approve finished videos."],
  performance: ["Perf team go-live", "Take Brand-approved videos live and record the final Live status."],
  sources: ["Sheet data", "Advanced: browse the audited workbook tabs in read-only mode."],
  chat: ["Team chat", "Keep team, campaign, and task discussions easy to find."]
};

const appState = {
  data: null, workflow: null, page: "overview", view: "table", search: "",
  filters: { priority: "all", state: "all", briefType: "video" }, currentUserId: "usr-admin",
  selectedTaskId: null, detailTab: "overview", activeChannelId: "channel-general",
  popover: null, modal: null, contentBriefTaskId: null, changeRequest: null, sidebarOpen: false, sheetPreview: null,
  stageSearch: {}
};

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[char]));
}

function safeHttpsUrl(value = "") {
  try {
    const url = new URL(String(value).trim());
    return url.protocol === "https:" ? url.href : null;
  } catch (_) {
    return null;
  }
}

function referenceMarkup(reference) {
  const value = String(reference).trim();
  const url = safeHttpsUrl(value);
  if (!url) return `<span class="chip">${icon("link")} ${escapeHtml(value)}</span>`;
  let label = url;
  try { label = new URL(url).hostname.replace(/^www\./, ""); } catch (_) {}
  return `<a class="chip reference-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(url)}">${icon("link")} ${escapeHtml(label)} ↗</a>`;
}

function hydrate(base) {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY));
    if (saved?.fixtureVersion === STORE_VERSION) return { ...base, tasks: (saved.tasks || base.tasks).map(prepareTask), messages: saved.messages || base.messages };
  } catch (_) {}
  return base;
}

function persist() {
  localStorage.setItem(STORE_KEY, JSON.stringify({ fixtureVersion: STORE_VERSION, tasks: appState.data.tasks, messages: appState.data.messages }));
}

function integrateWorkbookData(base, workbookData) {
  const users = [...base.users];
  const knownUsers = new Set(users.map(person => person.id));
  workbookData.users.forEach(person => { if (!knownUsers.has(person.id)) users.push(person); });
  return {
    ...base,
    meta: {
      ...base.meta,
      fixture: false,
      sanitized: false,
      asOf: workbookData.meta.asOf,
      workbookImportedAt: workbookData.meta.importedAt,
      workbookSha256: workbookData.meta.workbookSha256,
      sourceWorkbook: workbookData.meta.source
    },
    users,
    // Keep the small operational inbox fixture alongside the audited workbook
    // snapshot so each team workflow can be exercised without altering source data.
    tasks: [
      ...base.tasks.filter(task => ["social_research", "script_changes_requested", "script_approval_pending"].includes(task.state)).map(prepareTask),
      ...workbookData.tasks.map(prepareTask)
    ],
    workbookData
  };
}

const CONTENT_ESTIMATE_MINUTES = {
  "ugc": 55,
  "ai hook": 45,
  "ai avatar": 60,
  "music": 30,
  "shorter cut": 25,
  "hook change": 30,
  "experimental": 55,
  "office shoot": 60,
  "regional vo": 40,
  "other": 40
};

function estimateTask(task) {
  const type = String(task.contentType || "").trim().toLowerCase();
  const base = CONTENT_ESTIMATE_MINUTES[type] || 40;
  const priorityAdjustment = { P0: -5, P1: 0, P2: 5, R0: 10 }[task.priority] || 0;
  const referenceAdjustment = task.references?.length ? 0 : 5;
  const documentAdjustment = task.documents?.length ? 0 : 5;
  const total = Math.min(60, Math.max(20, base + priorityAdjustment + referenceAdjustment + documentAdjustment));
  const estimates = {
    brand: Math.max(3, Math.round(total * 0.2)),
    social: Math.max(5, Math.round(total * 0.3)),
    edit: Math.max(7, Math.round(total * 0.4)),
    performance: 0
  };
  estimates.performance = total - estimates.brand - estimates.social - estimates.edit;
  estimates.total = total;
  return estimates;
}

function teamForState(state) {
  if (["draft", "script_approval_pending", "approval_pending", "approved"].includes(state)) return "brand";
  if (["social_research", "script_changes_requested"].includes(state)) return "social";
  if (["editing_queue", "editing_in_progress", "changes_requested", "blocked"].includes(state)) return "edit";
  if (["ready_for_performance", "publishing_in_progress", "publishing_failed", "published"].includes(state)) return "performance";
  return "brand";
}

function prepareTask(task) {
  const documents = task.documents || (task.scriptPdf ? [{ id: `doc-${task.id}-legacy`, name: task.scriptPdf.name, size: task.scriptPdf.size, type: task.scriptPdf.type, purpose: "script", status: task.scriptPdf.status, uploadedAt: task.scriptPdf.uploadedAt, local: true }] : []);
  const sourceSheet = task.sourceSheet || task.source?.sheet || task.campaign;
  const briefType = task.briefType || (sourceSheet === BRIEF_TYPES.ai.sheet ? "ai" : "video");
  const assignment = CATEGORY_ASSIGNMENTS[String(task.category || "").trim().toLowerCase()];
  // Preserve a deliberate Content Team reassignment; only fall back to the
  // category owner when a task has never had an owner selected.
  const scriptOwnerId = task.scriptOwnerId ?? task.contentOwnerId ?? assignment?.scriptOwnerId ?? null;
  const needsFallbackEditor = ["editing_queue", "editing_in_progress", "changes_requested", "blocked", "approval_pending", "approved", "ready_for_performance", "publishing_in_progress", "publishing_failed", "published"].includes(task.state);
  const prepared = {
    ...task,
    documents,
    briefType,
    sourceSheet: BRIEF_TYPES[briefType]?.sheet || BRIEF_TYPES.video.sheet,
    contentOwnerId: scriptOwnerId || task.contentOwnerId || null,
    scriptOwnerId,
    editorId: task.editorId || (needsFallbackEditor ? DEFAULT_EDITOR_ID : null),
    brandApproverIds: assignment?.brandApproverIds?.length ? [...assignment.brandApproverIds] : (task.brandApproverIds || [])
  };
  prepared.estimates = estimateTask(prepared);
  prepared.stageHistory = task.stageHistory || [{ id: `stage-${task.id}-import`, team: teamForState(task.state), state: task.state, startedAt: task.updatedAt, endedAt: ["published", "cancelled"].includes(task.state) ? task.updatedAt : null }];
  prepared.estimatedCompletionAt = task.estimatedCompletionAt || new Date(new Date(task.updatedAt).getTime() + prepared.estimates.total * 60000).toISOString();
  return prepared;
}

function formatDuration(minutes) {
  const value = Math.max(0, Math.round(minutes || 0));
  if (value < 60) return `${value}m`;
  const hours = Math.floor(value / 60);
  const remainder = value % 60;
  return `${hours}h${remainder ? ` ${remainder}m` : ""}`;
}

function actualTaskMinutes(task, includeActive = true) {
  return (task.stageHistory || []).reduce((sum, stage) => {
    if (!stage.endedAt && !includeActive) return sum;
    return sum + elapsedMinutes(stage.startedAt, stage.endedAt || undefined);
  }, 0);
}

function actualTimeMarkup(task) {
  const completedMinutes = actualTaskMinutes(task, false);
  if (completedMinutes > 0 || ["published", "cancelled"].includes(task.state)) return `<span class="actual-time">Actual ${formatDuration(completedMinutes)}</span>`;
  return '<span class="actual-time pending">Pending completion</span>';
}

function elapsedMinutes(startedAt, endedAt = new Date().toISOString()) {
  const start = new Date(startedAt).getTime();
  const end = new Date(endedAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
  return Math.max(0, (end - start) / 60000);
}

function teamTiming(task) {
  const actual = { brand: 0, social: 0, edit: 0, performance: 0 };
  const active = { brand: false, social: false, edit: false, performance: false };
  (task.stageHistory || []).forEach(stage => {
    actual[stage.team] = (actual[stage.team] || 0) + elapsedMinutes(stage.startedAt, stage.endedAt || undefined);
    if (!stage.endedAt) active[stage.team] = true;
  });
  return [
    ["Brand", "brand"],
    ["Content Team", "social"],
    ["Video team", "edit"],
    ["Perf team", "performance"]
  ].map(([label, key]) => ({ label, key, actual: actual[key] || 0, active: active[key] }));
}

function user(id) { return appState.data.users.find(item => item.id === id); }
function currentUser() { return user(appState.currentUserId); }
function canAssignVideoEditor() { const person = currentUser(); return person?.role === "administrator" || Boolean(person?.isTeamLead); }
function canAssignContentOwner() { return ["content", "administrator"].includes(currentUser()?.role); }
function roleLabel(role) { return ({ content: "Content Team", edit: "Video team", brand: "Brand", performance: "Perf team", administrator: "Administrator" })[role] || role; }
function categoryAssignment(category) { return CATEGORY_ASSIGNMENTS[String(category || "").trim().toLowerCase()] || { scriptOwnerId: null, brandApproverIds: [] }; }
function assignedNames(ids = []) { return ids.map(id => user(id)?.name).filter(Boolean); }
function assignmentMarkup(task, compact = false) {
  const scriptOwner = user(task.scriptOwnerId)?.name || "Unassigned";
  const approvers = assignedNames(task.brandApproverIds);
  return `<div class="assignment-summary ${compact ? "compact" : ""}"><span><strong>Content scripter</strong>${escapeHtml(scriptOwner)}</span><span><strong>Brand approvers</strong>${escapeHtml(approvers.join(" & ") || "Unassigned")}</span></div>`;
}
function intakeAssignmentMarkup(category) {
  const assignment = categoryAssignment(category);
  return assignmentMarkup({ scriptOwnerId: assignment.scriptOwnerId, brandApproverIds: assignment.brandApproverIds });
}
function teamOwnerLabel(task, teamKey) {
  if (teamKey === "social") return `Content scripter · ${user(task.scriptOwnerId)?.name || "Unassigned"}`;
  if (teamKey === "brand") return `Brand approvers · ${assignedNames(task.brandApproverIds).join(" & ") || "Unassigned"}`;
  if (teamKey === "edit") return `Video editor · ${user(task.editorId || DEFAULT_EDITOR_ID)?.name || "Other"}`;
  return `Perf owner · ${user(task.publisherId)?.name || "Unassigned"}`;
}
function stateMeta(key) { return appState.workflow.states[key] || { label: key, tone: "neutral" }; }
function formatDate(date) { return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(new Date(`${date}T00:00:00`)); }
function formatTime(value) { return new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" }).format(new Date(value)); }
function isOverdue(task) { return new Date(task.estimatedCompletionAt).getTime() < Date.now() && !["published", "cancelled"].includes(task.state); }
function dateClass(task) { return isOverdue(task) ? "overdue" : ""; }
function isAllowed(action) { return (appState.workflow.roleActions[currentUser().role] || []).includes(action); }

function avatarMarkup(person) {
  if (!person) return '<span class="avatar slate">—</span>';
  return `<span class="avatar ${person.tone}">${escapeHtml(person.initials)}</span>`;
}

function statusMarkup(state) {
  const meta = stateMeta(state);
  return `<span class="status ${meta.tone}">${escapeHtml(meta.label)}</span>`;
}

function briefTypeMeta(task) {
  return BRIEF_TYPES[task.briefType] || BRIEF_TYPES.video;
}

function briefTypeMarkup(task) {
  const meta = briefTypeMeta(task);
  return `<span class="brief-type ${task.briefType === "ai" ? "ai" : "video"}" title="Source: ${escapeHtml(meta.sheet)}">${escapeHtml(meta.label)}</span>`;
}

function taskMatches(task) {
  const haystack = [task.id, task.title, task.brand, task.product, task.campaign, task.category, task.sourceSheet, briefTypeMeta(task).label, stateMeta(task.state).label].join(" ").toLowerCase();
  const queryMatch = !appState.search || haystack.includes(appState.search.toLowerCase());
  const priorityMatch = appState.filters.priority === "all" || task.priority === appState.filters.priority;
  const stateMatch = appState.filters.state === "all" || task.state === appState.filters.state;
  const briefTypeMatch = task.briefType === appState.filters.briefType;
  return queryMatch && priorityMatch && stateMatch && briefTypeMatch;
}

function pageTasks() {
  const filters = {
    tasks: () => true,
    content: task => ["social_research", "script_changes_requested", "script_approval_pending"].includes(task.state),
    edit: task => ["editing_queue", "editing_in_progress", "changes_requested", "blocked"].includes(task.state),
    brand: task => ["draft", "script_approval_pending", "script_changes_requested", "approval_pending", "changes_requested", "approved"].includes(task.state),
    performance: task => ["ready_for_performance", "publishing_in_progress", "publishing_failed", "published"].includes(task.state)
  };
  return appState.data.tasks.filter(filters[appState.page] || (() => true)).filter(taskMatches);
}

function sidebarMarkup() {
  const unread = appState.data.channels.reduce((sum, channel) => sum + channel.unread, 0);
  return `<aside class="sidebar ${appState.sidebarOpen ? "open" : ""}" aria-label="Primary navigation">
    <div class="brand"><span class="brand-mark">B</span><div class="brand-copy"><strong>Brand Perf Edit</strong><span>Content operations</span></div></div>
    <div class="workspace-select"><div class="eyebrow">Workspace</div><button class="workspace-button" data-toast="Workspace switching is simulated"><span><strong>Creative studio</strong><small>All four teams</small></span><span>⌄</span></button></div>
    <nav class="nav">
      <div class="eyebrow">Start here</div>
      ${navItems.slice(0,1).map(([id,label,ico]) => navButton(id,label,ico)).join("")}
      <div class="eyebrow nav-label">Teams</div>
      ${navItems.slice(1,5).map(([id,label,ico]) => navButton(id,label,ico)).join("")}
      <div class="eyebrow nav-label">Advanced</div>
      ${navItems.slice(5,6).map(([id,label,ico]) => navButton(id,label,ico)).join("")}
      <div class="eyebrow nav-label">Talk</div>
      ${navItems.slice(6).map(([id,label,ico]) => navButton(id,label,ico, id === "chat" ? unread : 0)).join("")}
    </nav>
    <div class="sidebar-foot"><span class="safe-dot"></span>Safe prototype<br>Test sheet is read-only</div>
  </aside>`;
}

function navButton(id, label, ico, count = 0) {
  return `<button class="nav-button ${appState.page === id ? "active" : ""}" data-nav="${id}">${icon(ico)}<span>${label}</span>${count ? `<span class="nav-count">${count}</span>` : ""}</button>`;
}

function topbarMarkup() {
  const person = currentUser();
  const unread = appState.data.notifications.filter(n => !n.read).length;
  return `<header class="topbar">
    <button class="icon-button mobile-menu" data-mobile-menu aria-label="Open menu">${icon("menu")}</button>
    <label class="search">${icon("search")}<input id="global-search" type="search" value="${escapeHtml(appState.search)}" placeholder="Search tasks, campaigns, or products" aria-label="Global search"><kbd>⌘ K</kbd></label>
    <div class="top-actions">
      <button class="icon-button" data-toast="Help center is not connected in this prototype" aria-label="Help">${icon("help")}</button>
      <button class="icon-button" data-popover="notifications" aria-label="Notifications">${icon("bell")}${unread ? '<span class="notification-dot"></span>' : ""}</button>
      <button class="user-button" data-popover="roles" aria-label="Current user and role menu">${avatarMarkup(person)}<span class="user-copy"><strong>${escapeHtml(person.name)}</strong><span>${escapeHtml(roleLabel(person.role))}</span></span><span>⌄</span></button>
    </div>
  </header>`;
}

function pageHeadMarkup(extra = "") {
  const [title, description] = pageMeta[appState.page];
  const friendlyTitle = appState.page === "overview" ? `${title}, ${currentUser().name.split(" ")[0]}` : title;
  const brandCreate = (appState.page === "brand" || appState.page === "tasks") && isAllowed("create_brief") ? `<button class="button primary" data-modal="brief">${icon("plus")} New brief</button>` : "";
  const contentCreate = appState.page === "content" && (isAllowed("submit_script") || isAllowed("replace_script")) ? `<button class="button primary" data-modal="content-brief">${icon("plus")} New brief</button>` : "";
  const videoCreate = appState.page === "edit" && isAllowed("submit_version") ? `<button class="button primary" data-modal="video-brief">${icon("plus")} New brief</button>` : "";
  const dateLabel = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long" }).format(new Date(`${appState.data.meta.asOf}T00:00:00`));
  return `<div class="page-head"><div><div class="eyebrow">${dateLabel}</div><h1>${friendlyTitle}</h1><p>${description}</p></div><div class="page-actions">${extra}${brandCreate}${contentCreate}${videoCreate}</div></div>`;
}

function overviewMarkup() {
  const tasks = appState.data.tasks;
  const metrics = [
    ["Open work", tasks.filter(t => !["published","cancelled"].includes(t.state)).length, "Across all four teams", "tasks"],
    ["Content scripts", tasks.filter(t => t.state === "social_research").length, "Based on Brand requirements", "clock"],
    ["Awaiting Brand", tasks.filter(t => ["script_approval_pending", "approval_pending"].includes(t.state)).length, "Scripts and edits", "brand"],
    ["Ready for live", tasks.filter(t => ["ready_for_performance","publishing_failed"].includes(t.state)).length, "Brand-approved videos", "performance"]
  ];
  const attention = tasks.filter(t => t.priority === "P0" || ["blocked","publishing_failed"].includes(t.state)).slice(0,5);
  return `${pageHeadMarkup('<button class="button" data-nav="tasks">View Brand Team</button>')}
    <section class="metric-grid" aria-label="Key metrics">${metrics.map(([label,value,note,ico]) => `<article class="metric-card"><div class="metric-top"><span>${label}</span><span class="metric-icon">${icon(ico)}</span></div><div class="metric-value">${value}</div><div class="metric-note"><span class="delta">Live mock data</span> · ${note}</div></article>`).join("")}</section>
    <div class="dashboard-grid">
      <section class="panel"><div class="panel-head"><div><h2>Weekly throughput</h2><p>Completed work and review load</p></div><button class="button small" data-toast="Date range controls are illustrative">This week ⌄</button></div><div class="panel-body"><div class="throughput" aria-label="Weekly throughput chart">${[["Mon",52,22],["Tue",68,14],["Wed",84,20],["Thu",60,32],["Fri",76,18]].map(([d,h,r]) => `<div class="bar-group"><div class="bar-stack" style="--height:${h};--review:${r}"></div><span>${d}</span></div>`).join("")}</div><div class="legend"><span><i></i> Completed</span><span><i class="review"></i> In review</span></div></div></section>
      <section class="panel"><div class="panel-head"><div><h2>Needs attention</h2><p>Priority, blockers, and failed work</p></div></div><div class="attention-list">${attention.map(task => `<article class="attention-item" data-task="${task.id}"><span class="priority ${task.priority}">${task.priority}</span><div class="attention-copy"><strong>${escapeHtml(task.title)}</strong><span>${stateMeta(task.state).label} · ${escapeHtml(task.contentType)}</span></div>${actualTimeMarkup(task)}</article>`).join("")}</div></section>
    </div>`;
}

function filtersMarkup(tasks) {
  const stateOptions = Object.entries(appState.workflow.states).map(([key,meta]) => `<option value="${key}" ${appState.filters.state === key ? "selected" : ""}>${meta.label}</option>`).join("");
  return `<div class="toolbar"><div class="segmented brief-queue-tabs" aria-label="Choose brief queue"><button class="${appState.filters.briefType === "video" ? "active" : ""}" data-brief-queue="video">Video brief queue</button><button class="${appState.filters.briefType === "ai" ? "active" : ""}" data-brief-queue="ai">AI brief queue</button></div><select class="filter-control" data-filter="priority" aria-label="Filter by priority"><option value="all">All priorities</option>${["P0","P1","P2","R0"].map(p => `<option value="${p}" ${appState.filters.priority === p ? "selected" : ""}>${p}</option>`).join("")}</select><select class="filter-control" data-filter="state" aria-label="Filter by status"><option value="all">All statuses</option>${stateOptions}</select><span class="result-count">${tasks.length} ${appState.filters.briefType === "ai" ? "AI" : "video"} tasks</span><div class="segmented view-switch" aria-label="Choose task view"><button class="${appState.view === "table" ? "active" : ""}" data-view="table">${icon("list")} List</button><button class="${appState.view === "board" ? "active" : ""}" data-view="board">${icon("board")} Board</button></div></div>`;
}

function taskAssetsMarkup(task) {
  const references = task.references || [];
  const documents = task.documents || [];
  const firstReference = references.length ? referenceMarkup(references[0]) : '<span class="unassigned">No refs</span>';
  const firstDocument = documents.length ? `<span class="document-count" title="${escapeHtml(documents[0].name)}">${escapeHtml(documents[0].name)}${documents.length > 1 ? ` +${documents.length - 1}` : ""}</span>` : '<span class="unassigned">No docs</span>';
  return `<div class="asset-summary">${firstReference}${firstDocument}</div>`;
}

function editorSelectMarkup(task, compact = false) {
  if (appState.page !== "edit") return `<span class="assigned-editor">${escapeHtml(user(task.editorId || DEFAULT_EDITOR_ID)?.name || "Other")}</span>`;
  const editors = appState.data.users.filter(person => person.role === "edit" && !person.isTeamLead);
  const disabled = !canAssignVideoEditor() ? "disabled" : "";
  return `<select class="editor-select ${compact ? "compact" : ""}" data-assign-editor="${task.id}" aria-label="Assign video editor to ${escapeHtml(task.title)}" ${disabled}><option value="">Unassigned</option>${editors.map(person => `<option value="${person.id}" ${task.editorId === person.id ? "selected" : ""}>${escapeHtml(person.name)}</option>`).join("")}</select>`;
}

function editorQueueOwnerMarkup(task) {
  return task.editorId && user(task.editorId) ? avatarMarkup(user(task.editorId)) : '<span class="assigned-editor">Other</span>';
}

function contentOwnerSelectMarkup(task, showLabel = true) {
  const writers = appState.data.users.filter(person => person.role === "content");
  const defaultOwner = categoryAssignment(task.category).scriptOwnerId;
  const disabled = canAssignContentOwner() ? "" : "disabled";
  const select = `<select class="content-owner-select" data-assign-content-owner="${task.id}" aria-label="Assign content writer to ${escapeHtml(task.title)}" ${disabled}>${writers.map(person => `<option value="${person.id}" ${task.scriptOwnerId === person.id ? "selected" : ""}>${escapeHtml(person.name)}${person.id === defaultOwner ? " · Default" : ""}</option>`).join("")}</select>`;
  return showLabel ? `<label class="compact-field"><span>Assigned writer</span>${select}</label>` : select;
}

function contentQueueMarkup(tasks) {
  if (!tasks.length) return emptyMarkup();
  return `<section class="content-inbox" aria-label="Brand requirements received by Content Team">${tasks.map(task => {
    const canSubmit = ["social_research", "script_changes_requested"].includes(task.state);
    return `<article class="requirement-card" data-task="${task.id}">
      <header class="requirement-head"><div><div class="card-labels"><span class="priority ${task.priority}">${task.priority}</span>${briefTypeMarkup(task)}${statusMarkup(task.state)}</div><h3>${escapeHtml(task.title)}</h3><p>${escapeHtml(task.product)} · ${escapeHtml(task.category)} · ${escapeHtml(task.contentType)}</p></div><span class="requirement-id">${task.id}</span></header>
      <div class="requirement-body"><div class="requirement-copy"><span class="eyebrow">Requirements from Brand Team</span><p>${escapeHtml(task.summary || "No additional requirements provided.")}</p>${taskAssetsMarkup(task)}</div><div class="assignment-control">${contentOwnerSelectMarkup(task)}<small>Defaults by category: Skin → Himani, Hair → Zoha, Nutra → Tanmay. Change this if the assigned writer is unavailable.</small></div></div>
      <form class="script-handoff" data-content-script-form data-task-id="${task.id}">
        <input type="hidden" name="taskId" value="${task.id}">
        <label><span>Google Docs script link</span><input name="scriptLink" type="url" inputmode="url" required placeholder="https://docs.google.com/document/d/..." ${canSubmit ? "" : "disabled"}></label>
        <label class="script-note"><span>Note for Brand (optional)</span><input name="comments" type="text" placeholder="What should the approver check?" ${canSubmit ? "" : "disabled"}></label>
        <button class="button primary" type="submit" ${canSubmit ? "" : "disabled"}>Send script to Brand Team ${icon("arrow")}</button>
      </form>
    </article>`;
  }).join("")}</section>`;
}

function tableMarkup(tasks) {
  if (!tasks.length) return emptyMarkup();
  return `<section class="panel table-wrap"><table class="task-table workflow-table"><thead><tr><th>Hook name</th><th>Brief type</th><th>Team owners</th><th>Priority</th><th>Content type</th><th>References & documents</th><th>Assigned editor</th><th>Actual time</th><th>Status</th></tr></thead><tbody>${tasks.map(task => `<tr data-task="${task.id}"><td class="task-title"><strong>${escapeHtml(task.title)}</strong><span>${task.id} · ${escapeHtml(task.product)} · ${escapeHtml(task.category)}</span></td><td>${briefTypeMarkup(task)}<span class="source-sheet">${escapeHtml(task.sourceSheet)}</span></td><td>${assignmentMarkup(task, true)}</td><td><span class="priority ${task.priority}">${task.priority}</span></td><td><span class="content-type">${escapeHtml(task.contentType)}</span></td><td>${taskAssetsMarkup(task)}</td><td>${editorSelectMarkup(task, true)}</td><td>${actualTimeMarkup(task)}</td><td>${statusMarkup(task.state)}</td></tr>`).join("")}</tbody></table></section>`;
}

function boardMarkup(tasks) {
  if (!tasks.length) return emptyMarkup();
  const columns = appState.page === "brand" ? [["draft","Brand intake"],["script_approval_pending","Script approval"],["approval_pending","Video approval"],["changes_requested","Video changes"],["approved","Approved"]] : appState.page === "content" ? [["social_research","Script queue"],["script_changes_requested","Script changes"],["script_approval_pending","Brand approval"]] : appState.page === "performance" ? [["ready_for_performance","Ready for live"],["published","Live"],["publishing_in_progress","Rework"],["publishing_failed","Failed / On hold"]] : [["editing_queue","Video queue"],["editing_in_progress","Video production"],["approval_pending","Brand approval"],["blocked","Blocked"]];
  return `<div class="kanban">${columns.map(([state,label]) => {
    const items = tasks.filter(task => task.state === state);
    const searchKey = `${appState.page}:${state}`;
    const query = String(appState.stageSearch[searchKey] || "").toLowerCase();
    const visibleItems = items.filter(task => [task.id, task.title, task.product, task.category, task.contentType, user(task.scriptOwnerId)?.name].join(" ").toLowerCase().includes(query));
    return `<section class="kanban-column"><div class="kanban-head">${label}<span>${visibleItems.length}${query ? `/${items.length}` : ""}</span></div><label class="stage-search">${icon("search")}<input type="search" data-stage-search="${searchKey}" value="${escapeHtml(appState.stageSearch[searchKey] || "")}" placeholder="Search ${escapeHtml(label.toLowerCase())}" aria-label="Search ${escapeHtml(label)}"></label><div class="stage-cards">${visibleItems.map(task => `<article class="task-card" data-task="${task.id}"><div class="task-card-top"><div class="card-labels"><span class="priority ${task.priority}">${task.priority}</span>${briefTypeMarkup(task)}</div>${actualTimeMarkup(task)}</div><h3>${escapeHtml(task.title)}</h3><p>${escapeHtml(task.contentType)} · ${escapeHtml(task.product)}</p>${assignmentMarkup(task, true)}${taskAssetsMarkup(task)}<div class="task-card-foot"><span>${task.id}</span>${editorQueueOwnerMarkup(task)}</div></article>`).join("") || `<div class="empty"><span>${items.length ? "No matching tasks" : "No tasks"}</span></div>`}</div></section>`;
  }).join("")}</div>`;
}

function emptyMarkup() { return '<section class="panel empty"><strong>No matching tasks</strong><span>Try clearing a filter or changing your search.</span></section>'; }

function teamHeroMarkup(tasks) {
  const config = {
    content: ["Prepare and send scripts", "Content Team receives Brand requirements, prepares the script, and sends it to Brand for approval.", "Scripts to prepare", tasks.filter(t => t.state === "social_research").length, "Script changes", tasks.filter(t => t.state === "script_changes_requested").length],
    edit: ["Create the approved video", "The Video team receives scripts only after Brand approval and sends finished videos back to Brand.", "Videos in progress", tasks.filter(t => t.state === "editing_in_progress").length, "Unassigned", tasks.filter(t => !t.editorId).length],
    brand: ["Own requirements and approvals", "Brand provides requirements, approves the script, assigns the Video team, and approves the finished video.", "Script approval", tasks.filter(t => t.state === "script_approval_pending").length, "Video approval", tasks.filter(t => t.state === "approval_pending").length],
    performance: ["Take approved videos live", "The Perf team receives only Brand-approved videos and records the final Live status.", "Ready for live", tasks.filter(t => t.state === "ready_for_performance").length, "Failed / On hold", tasks.filter(t => t.state === "publishing_failed").length]
  }[appState.page];
  const timedTasks = tasks.filter(task => actualTaskMinutes(task, false) > 0 || ["published", "cancelled"].includes(task.state));
  const averageActual = timedTasks.length ? timedTasks.reduce((sum, task) => sum + actualTaskMinutes(task, false), 0) / timedTasks.length : 0;
  return `<div class="team-hero"><section class="queue-card"><div class="eyebrow">${appState.page} desk</div><h2>${config[0]}</h2><p>${config[1]}</p><div class="queue-stats"><div><strong>${tasks.length}</strong><span>Visible tasks</span></div><div><strong>${timedTasks.length}</strong><span>With recorded time</span></div></div></section><div class="mini-stack"><article class="mini-card"><span>${config[2]}</span><strong>${config[3]}</strong></article><article class="mini-card"><span>${config[4]}</span><strong>${config[5]}</strong></article><article class="mini-card"><span>Average actual time</span><strong>${timedTasks.length ? formatDuration(averageActual) : "—"}</strong></article><article class="mini-card"><span>P0 priority</span><strong>${tasks.filter(t => t.priority === "P0").length}</strong></article></div></div>`;
}

function workflowGuideMarkup() {
  const steps = [
    ["brand", "Brand requirements"],
    ["content", "Content script"],
    ["brand", "Brand script approval"],
    ["edit", "Video production"],
    ["brand", "Brand video approval"],
    ["performance", "Perf go-live"],
    ["performance", "Status Live"]
  ];
  const activeSteps = {
    content: [1], edit: [3], brand: [0, 2, 4], performance: [5, 6]
  }[appState.page] || [];
  return `<section class="workflow-guide" aria-label="How work moves"><div class="workflow-guide-copy"><strong>How work moves</strong><span>Follow the highlighted step for this team</span></div><ol class="workflow-steps">${steps.map(([page, label], index) => `<li class="workflow-step ${activeSteps.includes(index) ? "active" : ""}"><button type="button" data-nav="${page}" aria-label="Open ${label}"><span>${index + 1}</span>${label}</button></li>`).join("")}</ol></section>`;
}

function taskPageMarkup() {
  const tasks = pageTasks();
  const queue = appState.page === "content" && appState.view === "table" ? contentQueueMarkup(tasks) : appState.view === "table" ? tableMarkup(tasks) : boardMarkup(tasks);
  return `${pageHeadMarkup()}${appState.page !== "tasks" ? workflowGuideMarkup() + teamHeroMarkup(tasks) : ""}${filtersMarkup(tasks)}${queue}`;
}

function chatMarkup() {
  const channel = appState.data.channels.find(c => c.id === appState.activeChannelId);
  const messages = appState.data.messages.filter(m => m.channelId === channel.id && (!appState.search || m.body.toLowerCase().includes(appState.search.toLowerCase()) || (m.taskId || "").toLowerCase().includes(appState.search.toLowerCase())));
  return `${pageHeadMarkup()}<section class="panel chat-layout"><aside class="channel-list" aria-label="Conversation channels">${appState.data.channels.map(c => `<button class="channel ${c.id === channel.id ? "active" : ""}" data-channel="${c.id}"><span class="avatar slate">#</span><span class="channel-copy"><strong>${escapeHtml(c.name)}</strong><span>${escapeHtml(c.scope)}</span></span>${c.unread ? `<span class="unread">${c.unread}</span>` : ""}</button>`).join("")}</aside><div class="chat-main"><header class="chat-head"><strong># ${escapeHtml(channel.name)}</strong><span>${escapeHtml(channel.scope)} conversation · mock local persistence</span></header><div class="messages">${messages.length ? messages.map(messageMarkup).join("") : '<div class="empty"><strong>No matching messages</strong></div>'}</div><form class="composer" id="chat-form"><div class="composer-box"><textarea name="message" placeholder="Write a message… Use @ to mention a teammate" aria-label="Message" required></textarea><button class="button primary" type="submit" aria-label="Send message">${icon("send")}</button></div><div class="composer-note">Messages persist in this browser only. No notification is sent.</div></form></div></section>`;
}

function sourcesMarkup() {
  const schema = appState.data.workbookSchema;
  const imported = appState.data.workbookData;
  const query = appState.search.toLowerCase();
  const sheets = schema.sheets.filter(sheet => imported.sheets.some(source => source.name === sheet.name)).filter(sheet => !query || [sheet.name, sheet.purpose, ...sheet.fields, ...sheet.features].join(" ").toLowerCase().includes(query));
  return `${pageHeadMarkup()}<section class="source-banner"><div><span class="status green">Workbook integrated</span><h2>${imported.meta.taskCount} records from 2 tabs are loaded</h2><p>Only AI Tracker Main and Work Plan drive the task queues and source browser. The workbook remains unchanged, and imported updates stay in this browser.</p></div><dl><div><dt>Imported</dt><dd>16 Oct 2026</dd></div><div><dt>Tasks</dt><dd>${imported.meta.taskCount}</dd></div><div><dt>Source tabs</dt><dd>2</dd></div></dl></section>${sheetPreviewMarkup()}<div class="sheet-grid">${sheets.map((sheet,index) => { const source = imported.sheets.find(item => item.name === sheet.name); return `<article class="sheet-card"><header><span class="sheet-index">${String(index + 1).padStart(2,"0")}</span><div><h2>${escapeHtml(sheet.name)}</h2><p>${escapeHtml(sheet.purpose)}</p></div><span class="row-count">${source.populatedRowCount} rows</span></header><div class="sheet-section"><strong>Observed fields</strong><div class="chip-list">${sheet.fields.map(field => `<span class="chip">${escapeHtml(field)}</span>`).join("")}</div></div><div class="sheet-section"><strong>Workbook features</strong><ul>${sheet.features.map(feature => `<li>${escapeHtml(feature)}</li>`).join("")}</ul></div><button class="button small source-open" data-source-sheet="${escapeHtml(sheet.name)}">Open integrated data ${icon("arrow")}</button></article>`; }).join("") || emptyMarkup()}</div>`;
}

function sheetPreviewMarkup() {
  const preview = appState.sheetPreview;
  if (!preview) return "";
  if (preview.error) return `<section class="panel source-preview"><div class="empty"><strong>Could not load ${escapeHtml(preview.name)}</strong><span>${escapeHtml(preview.error)}</span></div></section>`;
  const data = preview.data;
  return `<section class="panel source-preview"><div class="panel-head"><div><h2>${escapeHtml(data.sheetName)}</h2><p>${data.rows.length} populated rows loaded from the local workbook snapshot</p></div><button class="button small" data-close-source-preview>Close</button></div><div class="table-wrap"><table class="task-table source-table"><thead><tr>${data.columns.map(column => `<th>${escapeHtml(column)}</th>`).join("")}</tr></thead><tbody>${data.rows.map(row => `<tr>${row.map(cell => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></div></section>`;
}

function messageMarkup(message) {
  const author = user(message.authorId) || currentUser();
  return `<article class="message">${avatarMarkup(author)}<div class="message-body"><div class="message-meta"><strong>${escapeHtml(author.name)}</strong><time>${formatTime(message.at)}</time></div><p>${escapeHtml(message.body)}</p>${message.taskId ? `<button class="task-link" data-task="${message.taskId}">${message.taskId} ${icon("arrow")}</button>` : ""}</div></article>`;
}

function mainMarkup() {
  const body = appState.page === "overview" ? overviewMarkup() : appState.page === "chat" ? chatMarkup() : appState.page === "sources" ? sourcesMarkup() : taskPageMarkup();
  return `<div class="main-shell">${topbarMarkup()}<main class="content">${body}</main></div>`;
}

function popoverMarkup() {
  if (appState.popover === "notifications") return `<div class="popover" role="dialog" aria-label="Notifications"><div class="popover-head"><strong>Notifications</strong><button class="button small" data-mark-read>Mark all read</button></div>${appState.data.notifications.map(n => `<article class="notification ${n.read ? "read" : ""}"><i></i><div><strong>${escapeHtml(n.title)}</strong><span>${escapeHtml(n.detail)}</span></div><time>${n.at}</time></article>`).join("")}</div>`;
  if (appState.popover === "roles") return `<div class="popover role-menu" role="dialog" aria-label="Switch simulated user"><div class="popover-head"><strong>View as</strong><button class="button small" data-reset>Reset demo</button></div>${appState.data.users.map(person => `<button class="role-option ${person.id === appState.currentUserId ? "active" : ""}" data-role-user="${person.id}">${avatarMarkup(person)}<span><strong>${escapeHtml(person.name)}</strong><span>${escapeHtml(roleLabel(person.role))}</span></span></button>`).join("")}</div>`;
  return "";
}

function actionButtons(task) {
  const buttons = [];
  const role = currentUser().role;
  const transitionButton = (next, label, special = "") => `<button class="button primary" data-transition="${next}" data-task-id="${task.id}"${special ? ` data-special="${special}"` : ""}>${label}</button>`;
  const changesButton = (next, targetTeam) => `<button class="button danger" data-request-changes="${task.id}" data-next-state="${next}" data-target-team="${targetTeam}">Request changes</button>`;
  if (appState.page === "brand" && task.state === "draft" && isAllowed("submit_brief")) buttons.push(transitionButton("social_research", "Send requirements to Content Team", "brand_handoff"));
  if (appState.page === "content" && ["social_research", "script_changes_requested"].includes(task.state) && (isAllowed("submit_script") || isAllowed("replace_script"))) {
    buttons.push(`<button class="button primary" type="submit" form="drawer-script-form">Send script to Brand Team</button>`);
    buttons.push(changesButton("draft", "Brand Team"));
  }
  if (appState.page === "brand" && task.state === "script_approval_pending") {
    if (isAllowed("approve_script")) buttons.push(transitionButton("editing_queue", "Send approval to Video Team", "script_approved"));
    if (isAllowed("request_script_changes")) buttons.push(changesButton("script_changes_requested", "Content Team"));
  }
  if (appState.page === "edit" && ["editing_queue", "editing_in_progress", "changes_requested"].includes(task.state)) {
    if (isAllowed("submit_version") || isAllowed("start_editing")) buttons.push(`<button class="button primary" type="submit" form="drawer-video-form">Send video to Brand Team</button>`);
    if (isAllowed("start_editing") || isAllowed("block_task")) buttons.push(changesButton("script_approval_pending", "Brand Team"));
  }
  if (appState.page === "brand" && task.state === "approval_pending") {
    if (isAllowed("approve")) buttons.push(transitionButton("ready_for_performance", "Approve video send to Perf team", "approval_handoff"));
    if (isAllowed("request_changes")) buttons.push(changesButton("changes_requested", "Video Team"));
  }
  if (appState.page === "brand" && task.state === "approved" && ["brand","administrator"].includes(role)) {
    buttons.push(transitionButton("ready_for_performance", "Approve video send to Perf team"));
    buttons.push(changesButton("changes_requested", "Video Team"));
  }
  if (appState.page === "performance" && ["ready_for_performance", "publishing_in_progress", "publishing_failed"].includes(task.state)) {
    if (isAllowed("start_publishing") || isAllowed("record_publish_result")) buttons.push(transitionButton("published", "Go Live", "go_live"));
    if (isAllowed("record_publish_result")) buttons.push(changesButton("changes_requested", "Video Team"));
  }
  return buttons.join("");
}

function documentsMarkup(task) {
  if (!task.documents?.length) return `<section class="section"><div class="section-title"><h3>Video resource</h3></div><span class="unassigned">No video resource added</span></section>`;
  return `<section class="section"><div class="section-title"><h3>Video resource</h3><span class="eyebrow">${task.documents.length} attached</span></div><div class="document-list">${task.documents.map(document => { const size = document.size ? `${(document.size / 1024 / 1024).toFixed(1)} MB` : "Workbook reference"; const extension = document.name?.split(".").pop()?.slice(0, 4).toUpperCase() || "DOC"; return `<article class="pdf-card"><span class="pdf-icon">${escapeHtml(extension)}</span><div><strong>${escapeHtml(document.name)}</strong><span>${escapeHtml(document.purpose || "additional")} · ${size}${document.status ? ` · ${escapeHtml(document.status)}` : ""}</span></div>${document.local ? `<button class="button small" data-open-document="${task.id}" data-document-id="${document.id}">Open</button>` : ""}</article>`; }).join("")}</div></section>`;
}

function scriptUploadLinkMarkup(task) {
  const canSubmit = ["social_research", "script_changes_requested"].includes(task.state);
  if (!canSubmit) {
    return `<section class="section"><div class="section-title"><h3>Script upload link</h3><span class="eyebrow">Google Docs</span></div>${task.scriptLink ? `<div class="chip-list">${referenceMarkup(task.scriptLink)}</div>` : '<span class="unassigned">No Google Docs script submitted</span>'}</section>`;
  }
  return `<section class="section"><div class="section-title"><h3>Script upload link</h3><span class="eyebrow">Google Docs</span></div><form id="drawer-script-form" class="drawer-script-form" data-content-script-form data-task-id="${task.id}"><input type="hidden" name="taskId" value="${task.id}"><label><span>Paste the completed script link</span><input name="scriptLink" type="url" inputmode="url" required value="${escapeHtml(task.scriptLink || "")}" placeholder="https://docs.google.com/document/d/..."></label><label><span>Note for Brand Team (optional)</span><textarea name="comments" placeholder="Add anything the approvers should check"></textarea></label><small>Only Google Docs links are accepted. Use the button below to send it for Brand approval.</small></form></section>`;
}

function referenceLinksMarkup(task) {
  return `<section class="section"><div class="section-title"><h3>Reference links</h3><span class="eyebrow">${task.references.length} attached</span></div><div class="chip-list">${task.references.length ? task.references.map(referenceMarkup).join("") : '<span class="unassigned">No references attached</span>'}</div></section>`;
}

function videoHandoffMarkup(task) {
  return `<section class="section"><div class="section-title"><h3>Video link</h3><span class="eyebrow">Google Drive</span></div><form id="drawer-video-form" class="drawer-script-form video-handoff-form" data-video-handoff-form data-task-id="${task.id}"><input type="hidden" name="taskId" value="${task.id}"><label><span>Google Drive video link</span><input name="videoLink" type="url" inputmode="url" required value="${escapeHtml(task.videoLink || "")}" placeholder="https://drive.google.com/file/d/..."></label><small>Paste a shareable Google Drive link, then send the video to Brand Team for approval.</small></form></section>`;
}

function timingMarkup(task) {
  return `<section class="section"><div class="section-title"><h3>Actual team time and owners</h3><span class="eyebrow">${actualTimeMarkup(task)}</span></div><div class="timing-grid">${teamTiming(task).map(team => `<article class="timing-row"><div><strong>${team.label}</strong><span>${escapeHtml(teamOwnerLabel(task, team.key))}</span></div><div><label>${team.active ? "Awaiting completion" : "Actual time"}</label><strong>${team.actual ? formatDuration(team.actual) : team.active ? "Pending" : "—"}</strong></div></article>`).join("")}</div></section>`;
}

function drawerTopAssetsMarkup(task) {
  if (appState.page === "content") return scriptUploadLinkMarkup(task) + referenceLinksMarkup(task);
  if (appState.page === "edit") return videoHandoffMarkup(task) + referenceLinksMarkup(task);
  return documentsMarkup(task) + referenceLinksMarkup(task);
}

function drawerMarkup() {
  const task = appState.data.tasks.find(t => t.id === appState.selectedTaskId);
  if (!task) return '<div class="drawer-backdrop"></div><aside class="drawer" aria-hidden="true"></aside>';
  const tabs = ["overview","versions","activity","comments"];
  let body = "";
  if (appState.detailTab === "overview") body = `${drawerTopAssetsMarkup(task)}<div class="detail-grid drawer-overview-grid"><div class="detail-field"><label>Status</label><div>${statusMarkup(task.state)}</div></div><div class="detail-field"><label>Priority</label><div><span class="priority ${task.priority}">${task.priority}</span></div></div><div class="detail-field"><label>Product</label><div>${escapeHtml(task.product)}</div></div><div class="detail-field"><label>Brief type</label><div>${briefTypeMarkup(task)}</div></div><div class="detail-field"><label>Content script owner</label><div>${appState.page === "content" ? contentOwnerSelectMarkup(task, false) : escapeHtml(user(task.scriptOwnerId)?.name || "Unassigned")}</div></div><div class="detail-field"><label>Brand approvers</label><div>${escapeHtml(assignedNames(task.brandApproverIds).join(" & ") || "Unassigned")}</div></div><div class="detail-field"><label>Source sheet</label><div>${escapeHtml(task.sourceSheet)}</div></div><div class="detail-field"><label>Content type</label><div>${escapeHtml(task.contentType)}</div></div><div class="detail-field"><label>Assigned video editor</label><div>${editorSelectMarkup(task)}</div></div><div class="detail-field"><label>Actual time</label><div>${actualTimeMarkup(task)}</div></div></div><section class="section"><div class="section-title"><h3>Product details and requirements</h3></div><div class="summary-box">${escapeHtml(task.summary)}</div></section>${timingMarkup(task)}${task.hasMissingAssets ? '<section class="section"><div class="summary-box" style="background:var(--rose-soft);color:var(--rose)"><strong>Missing requirement:</strong> add a reference link or supporting document before production.</div></section>' : ""}`;
  if (appState.detailTab === "versions") body = `<section class="section"><div class="section-title"><h3>Asset versions</h3><span class="eyebrow">${task.versions.length} total</span></div>${task.versions.length ? [...task.versions].reverse().map(v => `<article class="version-card"><span class="version-number">v${v.number}</span><div><strong>${escapeHtml(v.label)}</strong><span>${formatTime(v.submittedAt)}</span></div><span class="status ${v.status === "Approved" ? "green" : v.status === "Changes requested" ? "rose" : "amber"}">${escapeHtml(v.status)}</span></article>`).join("") : '<div class="empty"><strong>No submitted versions</strong><span>The first edit has not been submitted yet.</span></div>'}</section>`;
  if (appState.detailTab === "activity") body = `<section class="section"><div class="timeline">${task.activity.map(a => `<article class="timeline-item"><strong>${escapeHtml(a.actor)}${a.team ? ` · ${escapeHtml(a.team)}` : ""}</strong><p>${escapeHtml(a.text)}</p><time>${formatTime(a.at)}</time></article>`).join("")}</div></section>`;
  if (appState.detailTab === "comments") { const messages = appState.data.messages.filter(m => m.taskId === task.id); body = `<section class="section"><div class="messages" style="padding:0">${messages.length ? messages.map(messageMarkup).join("") : '<div class="empty"><strong>No task comments yet</strong></div>'}</div><form class="composer" id="task-comment-form" data-task-id="${task.id}" style="padding:14px 0 0"><div class="composer-box"><textarea name="message" placeholder="Add feedback tied to this task…" required></textarea><button class="button primary" type="submit">${icon("send")}</button></div></form></section>`; }
  return `<div class="drawer-backdrop open" data-close-drawer></div><aside class="drawer open" role="dialog" aria-modal="true" aria-label="Task details"><header class="drawer-head"><div class="drawer-head-copy"><div class="drawer-kicker"><span class="eyebrow">${task.id} · ${escapeHtml(task.category)}</span><span class="priority ${task.priority}">${task.priority}</span></div><h2>${escapeHtml(task.title)}</h2><p>${briefTypeMeta(task).label} · ${escapeHtml(task.contentType)} · Legacy: ${escapeHtml(task.legacyStatus)}</p></div><button class="drawer-close" data-close-drawer aria-label="Close details">×</button></header><div class="drawer-scroll"><nav class="detail-tabs" aria-label="Task detail sections">${tabs.map(tab => `<button class="${appState.detailTab === tab ? "active" : ""}" data-detail-tab="${tab}">${tab[0].toUpperCase()+tab.slice(1)}${tab === "versions" ? ` (${task.versions.length})` : ""}</button>`).join("")}</nav>${body}</div><footer class="drawer-actions">${actionButtons(task) || '<span class="time-label">No actions available for this role and state.</span>'}</footer></aside>`;
}

function productOptionsMarkup() {
  const products = appState.data.plixProducts?.products || [];
  const categories = ["Skin", "Hair", "Nutra"];
  return `<option value="">Select a Plix product</option>${categories.map(category => `<optgroup label="${category}">${products.filter(product => product.category === category).map(product => `<option value="${escapeHtml(product.name)}" data-product-search="${escapeHtml(`${product.name} ${category}`.toLowerCase())}">${escapeHtml(product.name)}</option>`).join("")}</optgroup>`).join("")}`;
}

function modalMarkup() {
  if (appState.modal === "change-request" && appState.changeRequest) {
    const task = appState.data.tasks.find(item => item.id === appState.changeRequest.taskId);
    if (!task) return "";
    return `<div class="modal-backdrop" data-close-modal><form class="modal" id="change-request-form" role="dialog" aria-modal="true" aria-labelledby="change-request-title"><header class="modal-head"><div><div class="eyebrow">Request changes</div><h2 id="change-request-title">Send back to ${escapeHtml(appState.changeRequest.targetTeam)}</h2></div><button type="button" class="drawer-close" data-close-modal>×</button></header><div class="modal-body"><div class="form-grid"><div class="field full"><label>Task</label><div class="summary-box"><strong>${escapeHtml(task.title)}</strong><br>${escapeHtml(task.product)} · ${escapeHtml(task.contentType)}</div></div><div class="field full"><label for="change-request-comment">Change request comments</label><textarea id="change-request-comment" name="comments" required placeholder="Explain exactly what needs to be redone"></textarea><small>This comment will be sent to ${escapeHtml(appState.changeRequest.targetTeam)} and saved in the task history.</small></div></div></div><footer class="modal-actions"><button type="button" class="button" data-close-modal>Cancel</button><button type="submit" class="button danger">Send request to ${escapeHtml(appState.changeRequest.targetTeam)}</button></footer></form></div>`;
  }
  if (appState.modal === "content-brief") {
    const eligibleTasks = appState.data.tasks.filter(task => ["social_research", "script_changes_requested"].includes(task.state));
    const activeTaskId = appState.contentBriefTaskId || eligibleTasks[0]?.id;
    const taskOptions = eligibleTasks.map(task => `<option value="${escapeHtml(task.id)}" ${task.id === activeTaskId ? "selected" : ""}>${escapeHtml(task.title)} — ${escapeHtml(task.product)} (${escapeHtml(task.category)})</option>`).join("");
    return `<div class="modal-backdrop" data-close-modal>
      <form class="modal" id="content-brief-form" role="dialog" aria-modal="true" aria-labelledby="content-brief-title">
        <header class="modal-head"><div><div class="eyebrow">Content Team</div><h2 id="content-brief-title">Submit a script brief</h2></div><button type="button" class="drawer-close" data-close-modal>×</button></header>
        <div class="modal-body"><div class="form-grid">
          <div class="field full"><label for="content-task">Brand brief</label><select id="content-task" name="taskId" required ${eligibleTasks.length ? "" : "disabled"}>${taskOptions || '<option value="">No briefs are ready for a script</option>'}</select><small>Select the Brand Team request this script answers.</small></div>
          <div class="field full"><label for="content-script-link">Google Docs link</label><input id="content-script-link" name="scriptLink" type="url" inputmode="url" required placeholder="https://docs.google.com/document/d/..."></div>
          <div class="field full"><label for="content-comments">Additional comments</label><textarea id="content-comments" name="comments" placeholder="Add context, notes, or instructions for Brand Team approval"></textarea></div>
        </div></div>
        <footer class="modal-actions"><button type="button" class="button" data-close-modal>Cancel</button><button type="submit" class="button primary" ${eligibleTasks.length ? "" : "disabled"}>Send script to Brand Team</button></footer>
      </form>
    </div>`;
  }
  if (appState.modal === "video-brief") {
    const eligibleTasks = appState.data.tasks.filter(task => ["editing_queue", "editing_in_progress", "changes_requested"].includes(task.state));
    const taskOptions = eligibleTasks.map(task => `<option value="${escapeHtml(task.id)}">${escapeHtml(task.title)} — ${escapeHtml(task.product)} (${escapeHtml(task.contentType)})</option>`).join("");
    return `<div class="modal-backdrop" data-close-modal>
      <form class="modal" id="video-brief-form" role="dialog" aria-modal="true" aria-labelledby="video-brief-title">
        <header class="modal-head"><div><div class="eyebrow">Video Team</div><h2 id="video-brief-title">Send video to Brand Team</h2></div><button type="button" class="drawer-close" data-close-modal>×</button></header>
        <div class="modal-body"><div class="form-grid">
          <div class="field full"><label for="video-task">Video task</label><select id="video-task" name="taskId" required ${eligibleTasks.length ? "" : "disabled"}>${taskOptions || '<option value="">No video tasks are ready to send</option>'}</select><small>Select the video task that this Drive link completes.</small></div>
          <div class="field full"><label for="video-drive-link">Google Drive link</label><input id="video-drive-link" name="videoLink" type="url" inputmode="url" required placeholder="https://drive.google.com/file/d/..."><small>Paste the shareable Google Drive link for the completed video.</small></div>
          <div class="field full"><label for="video-comments">Additional comments <span class="optional-label">(optional)</span></label><textarea id="video-comments" name="comments" placeholder="Add notes for the Brand Team"></textarea></div>
        </div></div>
        <footer class="modal-actions"><button type="button" class="button" data-close-modal>Cancel</button><button type="submit" class="button primary" ${eligibleTasks.length ? "" : "disabled"}>Send to Brand Team</button></footer>
      </form>
    </div>`;
  }
  if (appState.modal !== "brief") return "";
  const contentTypes = CONTENT_TYPES_BY_BRIEF.video;
  return `<div class="modal-backdrop" data-close-modal><form class="modal" id="brief-form" role="dialog" aria-modal="true" aria-labelledby="brief-title"><header class="modal-head"><div><div class="eyebrow">Brand intake</div><h2 id="brief-title">Create a new brief</h2></div><button type="button" class="drawer-close" data-close-modal>×</button></header><div class="modal-body"><div class="form-grid"><div class="field full"><label for="brief-kind">Brief type</label><select id="brief-kind" name="briefType" required><option value="video">Video brief — Work Plan</option><option value="ai">AI brief — AI Tracker Main</option></select><small>This determines the source sheet and is shown throughout every team queue.</small></div><div class="field full"><label for="brief-name">Hook name</label><input id="brief-name" name="title" required placeholder="Enter the hook name"></div><div class="field full product-picker"><label for="brief-product-search">Product</label><div class="product-search">${icon("search")}<input id="brief-product-search" type="search" placeholder="Search Plix products" autocomplete="off" aria-controls="brief-product"></div><select id="brief-product" name="product" required size="7" aria-label="Select a Plix product">${productOptionsMarkup()}</select><small><span id="product-result-count">${appState.data.plixProducts?.products?.length || 0} products</span> from the Plix official catalogue.</small></div><div class="field"><label for="brief-category">Category</label><select id="brief-category" name="category"><option>Hair</option><option>Skin</option><option>Nutra</option><option>Global</option><option>Joyun</option><option>B2G2</option></select></div><div class="field full assignment-preview-wrap"><label>Automatic assignments</label><div id="brief-assignment-preview">${intakeAssignmentMarkup("Hair")}</div><small>Script and Brand approval owners are assigned from the selected category.</small></div><div class="field"><label for="brief-priority">Priority</label><select id="brief-priority" name="priority"><option>P0</option><option selected>P1</option><option>P2</option><option>R0</option></select></div><div class="field"><label for="brief-type">Content type</label><select id="brief-type" name="contentType" required>${contentTypes.map(type => `<option>${type}</option>`).join("")}</select><small id="brief-type-help">Options for Video brief and Work Plan.</small></div><div class="field full"><label for="brief-document">Additional document</label><input id="brief-document" name="additionalDocument" type="file" accept=".pdf,.doc,.docx,.txt,.xlsx,.xls,.ppt,.pptx,image/*"><small>Optional product pack, requirement document, image, or supporting file. Maximum 20 MB; stored in this browser.</small></div><div class="field full"><label for="brief-references">Reference links and asset folders</label><textarea id="brief-references" name="references" placeholder="Paste one HTTPS link per line&#10;https://drive.google.com/...&#10;https://www.instagram.com/..."></textarea><small>Content Team can add the final reference content and script before Brand approval.</small></div><div class="field full"><label for="brief-summary">Additional Comments</label><textarea id="brief-summary" name="summary" required placeholder="Add product requirements, claims, audience notes, format, constraints, or other comments"></textarea></div></div></div><footer class="modal-actions"><button type="button" class="button" data-close-modal>Cancel</button><button type="submit" name="intent" value="draft" class="button">Save intake</button><button type="submit" name="intent" value="submit" class="button primary">Send to Content Team</button></footer></form></div>`;
}

function updateBriefContentTypes(briefType) {
  const type = briefType === "ai" ? "ai" : "video";
  const select = document.getElementById("brief-type");
  if (!select) return;
  select.innerHTML = CONTENT_TYPES_BY_BRIEF[type].map(contentType => `<option>${escapeHtml(contentType)}</option>`).join("");
  const help = document.getElementById("brief-type-help");
  if (help) help.textContent = `Options for ${BRIEF_TYPES[type].label} and ${BRIEF_TYPES[type].sheet}.`;
}

function updateBriefAssignments(category) {
  const preview = document.getElementById("brief-assignment-preview");
  if (preview) preview.innerHTML = intakeAssignmentMarkup(category);
}

function filterProductCatalog(query = "") {
  const select = document.getElementById("brief-product");
  if (!select) return;
  const selected = select.value;
  const normalized = String(query).trim().toLowerCase();
  const products = (appState.data.plixProducts?.products || []).filter(product => `${product.name} ${product.category}`.toLowerCase().includes(normalized));
  select.innerHTML = `<option value="">${products.length ? "Select a Plix product" : "No matching products"}</option>${["Skin", "Hair", "Nutra"].map(category => {
    const matches = products.filter(product => product.category === category);
    return matches.length ? `<optgroup label="${category}">${matches.map(product => `<option value="${escapeHtml(product.name)}">${escapeHtml(product.name)}</option>`).join("")}</optgroup>` : "";
  }).join("")}`;
  if (products.some(product => product.name === selected)) select.value = selected;
  const count = document.getElementById("product-result-count");
  if (count) count.textContent = `${products.length} product${products.length === 1 ? "" : "s"}`;
}

function syncCategoryToProduct(productName) {
  const product = appState.data.plixProducts?.products?.find(item => item.name === productName);
  const categorySelect = document.getElementById("brief-category");
  if (!product || !categorySelect) return;
  categorySelect.value = product.category;
  updateBriefAssignments(product.category);
}

function render() {
  document.getElementById("app").innerHTML = `${sidebarMarkup()}${mainMarkup()}${popoverMarkup()}${drawerMarkup()}${modalMarkup()}`;
  bindEvents();
}

function bindEvents() {
  document.querySelectorAll("[data-nav]").forEach(el => el.addEventListener("click", () => { appState.page = el.dataset.nav; appState.popover = null; appState.sidebarOpen = false; render(); }));
  document.querySelectorAll("[data-task]").forEach(el => el.addEventListener("click", () => { appState.selectedTaskId = el.dataset.task; appState.detailTab = "overview"; render(); }));
  document.querySelectorAll("[data-close-drawer]").forEach(el => el.addEventListener("click", () => { appState.selectedTaskId = null; render(); }));
  document.querySelectorAll("[data-detail-tab]").forEach(el => el.addEventListener("click", () => { appState.detailTab = el.dataset.detailTab; render(); }));
  document.querySelectorAll("[data-view]").forEach(el => el.addEventListener("click", () => { appState.view = el.dataset.view; render(); }));
  document.querySelectorAll("[data-brief-queue]").forEach(el => el.addEventListener("click", () => { appState.filters.briefType = el.dataset.briefQueue; render(); }));
  document.querySelectorAll("[data-filter]").forEach(el => el.addEventListener("change", () => { appState.filters[el.dataset.filter] = el.value; render(); }));
  document.querySelectorAll("[data-popover]").forEach(el => el.addEventListener("click", event => { event.stopPropagation(); appState.popover = appState.popover === el.dataset.popover ? null : el.dataset.popover; render(); }));
  document.querySelectorAll("[data-toast]").forEach(el => el.addEventListener("click", () => showToast(el.dataset.toast)));
  document.querySelectorAll("[data-modal]").forEach(el => el.addEventListener("click", () => { appState.contentBriefTaskId = null; appState.modal = el.dataset.modal; render(); }));
  document.querySelectorAll("[data-content-brief-task]").forEach(el => el.addEventListener("click", () => { appState.contentBriefTaskId = el.dataset.contentBriefTask; appState.modal = "content-brief"; render(); }));
  document.querySelectorAll("[data-close-modal]").forEach(el => el.addEventListener("click", event => { if (event.target === el || el.tagName === "BUTTON") { appState.modal = null; appState.contentBriefTaskId = null; appState.changeRequest = null; render(); } }));
  document.getElementById("brief-kind")?.addEventListener("change", event => updateBriefContentTypes(event.target.value));
  document.getElementById("brief-category")?.addEventListener("change", event => updateBriefAssignments(event.target.value));
  document.getElementById("brief-product-search")?.addEventListener("input", event => filterProductCatalog(event.target.value));
  document.getElementById("brief-product")?.addEventListener("change", event => syncCategoryToProduct(event.target.value));
  document.querySelectorAll("[data-stage-search]").forEach(el => el.addEventListener("input", event => {
    const key = event.target.dataset.stageSearch;
    const value = event.target.value;
    appState.stageSearch[key] = value;
    render();
    const replacement = [...document.querySelectorAll("[data-stage-search]")].find(input => input.dataset.stageSearch === key);
    replacement?.focus();
    replacement?.setSelectionRange(value.length, value.length);
  }));
  document.querySelectorAll("[data-request-changes]").forEach(el => el.addEventListener("click", () => { appState.changeRequest = { taskId: el.dataset.requestChanges, nextState: el.dataset.nextState, targetTeam: el.dataset.targetTeam }; appState.modal = "change-request"; render(); }));
  document.querySelectorAll("[data-role-user]").forEach(el => el.addEventListener("click", () => { appState.currentUserId = el.dataset.roleUser; appState.popover = null; render(); showToast(`Viewing as ${currentUser().role}`); }));
  document.querySelectorAll("[data-channel]").forEach(el => el.addEventListener("click", () => { appState.activeChannelId = el.dataset.channel; const channel = appState.data.channels.find(c => c.id === el.dataset.channel); channel.unread = 0; render(); }));
  document.querySelectorAll("[data-source-sheet]").forEach(el => el.addEventListener("click", () => openSourceSheet(el.dataset.sourceSheet)));
  document.querySelectorAll("[data-open-document]").forEach(el => el.addEventListener("click", event => { event.stopPropagation(); openDocument(el.dataset.openDocument, el.dataset.documentId); }));
  document.querySelectorAll("[data-upload-script]").forEach(el => el.addEventListener("click", () => uploadScriptDocument(el.dataset.uploadScript)));
  document.querySelectorAll("[data-assign-editor]").forEach(el => el.addEventListener("click", event => event.stopPropagation()));
  document.querySelectorAll("[data-assign-editor]").forEach(el => el.addEventListener("change", event => assignEditor(el.dataset.assignEditor, event.target.value)));
  document.querySelectorAll("[data-assign-content-owner]").forEach(el => el.addEventListener("click", event => event.stopPropagation()));
  document.querySelectorAll("[data-assign-content-owner]").forEach(el => el.addEventListener("change", event => assignContentOwner(el.dataset.assignContentOwner, event.target.value)));
  document.querySelectorAll("[data-content-script-form]").forEach(el => {
    el.addEventListener("click", event => event.stopPropagation());
    el.addEventListener("submit", submitContentBrief);
  });
  document.querySelectorAll("[data-video-handoff-form]").forEach(el => {
    el.addEventListener("click", event => event.stopPropagation());
    el.addEventListener("submit", submitVideoHandoff);
  });
  document.querySelectorAll(".reference-link").forEach(el => el.addEventListener("click", event => event.stopPropagation()));
  document.querySelector("[data-close-source-preview]")?.addEventListener("click", () => { appState.sheetPreview = null; render(); });
  document.querySelectorAll("[data-transition]").forEach(el => el.addEventListener("click", () => transitionTask(el.dataset.taskId, el.dataset.transition, el.dataset.special)));
  document.querySelector("[data-mobile-menu]")?.addEventListener("click", () => { appState.sidebarOpen = !appState.sidebarOpen; render(); });
  document.querySelector("[data-mark-read]")?.addEventListener("click", () => { appState.data.notifications.forEach(n => n.read = true); appState.popover = null; render(); });
  document.querySelector("[data-reset]")?.addEventListener("click", () => { localStorage.removeItem(STORE_KEY); location.reload(); });
  const search = document.getElementById("global-search");
  search?.addEventListener("input", () => { appState.search = search.value; window.clearTimeout(search._timer); search._timer = window.setTimeout(render, 180); });
  document.getElementById("chat-form")?.addEventListener("submit", submitChat);
  document.getElementById("task-comment-form")?.addEventListener("submit", submitTaskComment);
  document.getElementById("brief-form")?.addEventListener("submit", submitBrief);
  document.getElementById("content-brief-form")?.addEventListener("submit", submitContentBrief);
  document.getElementById("video-brief-form")?.addEventListener("submit", submitVideoHandoff);
  document.getElementById("change-request-form")?.addEventListener("submit", submitChangeRequest);
}

function validateDocument(file, required = false) {
  if (!file || !file.name || !file.size) return required ? "Choose a script document before submitting." : "";
  if (file.size > 20 * 1024 * 1024) return "Documents must be 20 MB or smaller.";
  return "";
}

async function openDocument(taskId, documentId) {
  try {
    const file = await getTaskDocument(taskId, documentId);
    if (!file) return showToast("Document unavailable", "Reattach it from the task details");
    const url = URL.createObjectURL(file);
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (!opened) showToast("Allow pop-ups to open the document");
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch (error) {
    showToast("Could not open document", error.message);
  }
}

function uploadScriptDocument(taskId) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".pdf,.doc,.docx,.txt";
  input.addEventListener("change", async () => {
    const file = input.files?.[0];
    const error = validateDocument(file, true);
    if (error) return showToast(error);
    const task = appState.data.tasks.find(item => item.id === taskId);
    const wasRevision = task.state === "script_changes_requested";
    const documentId = `doc-${task.id}-${Date.now()}`;
    try {
      await saveTaskDocument(taskId, documentId, file);
      task.documents.push({ id: documentId, name: file.name, size: file.size, type: file.type || "application/octet-stream", purpose: "script", status: "pending", uploadedAt: new Date().toISOString(), local: true });
      transitionTask(taskId, "script_approval_pending", "script_submitted");
      showToast(wasRevision ? "Revised script sent to Brand" : "Script sent to Brand");
    } catch (storageError) {
      showToast("Could not store document", storageError.message);
    }
  });
  input.click();
}

function assignEditor(taskId, editorId) {
  const task = appState.data.tasks.find(item => item.id === taskId);
  if (!task || appState.page !== "edit" || !canAssignVideoEditor()) return;
  task.editorId = editorId || null;
  task.updatedAt = new Date().toISOString();
  const editor = editorId ? user(editorId) : null;
  task.activity.unshift({ at: task.updatedAt, actor: currentUser().name, team: "Video Team", text: editor ? `${currentUser().name} assigned ${editor.name} as Video Editor from the Video Team portal.` : `${currentUser().name} removed the Video Editor assignment.` });
  persist(); render(); showToast(editor ? `Assigned to ${editor.name}` : "Editor unassigned");
}

function assignContentOwner(taskId, ownerId) {
  const task = appState.data.tasks.find(item => item.id === taskId);
  const owner = user(ownerId);
  if (!task || appState.page !== "content" || !canAssignContentOwner() || owner?.role !== "content") return;
  task.scriptOwnerId = ownerId;
  task.contentOwnerId = ownerId;
  task.updatedAt = new Date().toISOString();
  task.activity.unshift({ at: task.updatedAt, actor: currentUser().name, team: "Content Team", text: `${currentUser().name} reassigned the script to ${owner.name}.` });
  persist(); render(); showToast(`Script assigned to ${owner.name}`);
}

function openSourceSheet(name) {
  const source = appState.data.workbookData.sheets.find(sheet => sheet.name === name);
  appState.sheetPreview = source
    ? { name, data: { sheetName: source.name, columns: source.columns, rows: source.rows } }
    : { name, error: "This tab was not found in the imported workbook snapshot." };
  render();
  document.querySelector(".source-preview")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function transitionTask(taskId, nextState, special = "") {
  const task = appState.data.tasks.find(t => t.id === taskId);
  const previous = task.state;
  if (["script_approved", "video_handoff"].includes(special) && !task.editorId) task.editorId = DEFAULT_EDITOR_ID;
  const videoPath = previous === "editing_in_progress" ? ["approval_pending"] : ["editing_in_progress", "approval_pending"];
  const goLivePath = previous === "publishing_in_progress" ? ["published"] : ["publishing_in_progress", "published"];
  const path = special === "approval_handoff" ? ["approved", "ready_for_performance"] : special === "go_live" ? goLivePath : special === "video_handoff" ? videoPath : [nextState];
  let cursor = previous;
  for (const state of path) {
    const allowed = appState.workflow.transitions[cursor] || [];
    if (!allowed.includes(state)) return showToast("Transition rejected", `${stateMeta(cursor).label} → ${stateMeta(state).label}`);
    cursor = state;
  }
  const changedAt = new Date().toISOString();
  const openStage = [...(task.stageHistory || [])].reverse().find(stage => !stage.endedAt);
  if (openStage) openStage.endedAt = changedAt;
  task.state = nextState;
  task.updatedAt = changedAt;
  task.progress = { draft: 0, social_research: 10, script_approval_pending: 25, script_changes_requested: 20, editing_queue: 35, editing_in_progress: 60, approval_pending: 85, changes_requested: 75, approved: 95, ready_for_performance: 95, publishing_in_progress: 98, publishing_failed: 98, published: 100 }[nextState] ?? task.progress;
  if (!["published", "cancelled"].includes(nextState)) task.stageHistory.push({ id: `stage-${task.id}-${Date.now()}`, team: teamForState(nextState), state: nextState, startedAt: changedAt, endedAt: null });
  if (nextState === "editing_in_progress" && !task.editorId) task.editorId = DEFAULT_EDITOR_ID;
  if (nextState === "approval_pending") {
    const number = task.versions.length + 1;
    task.versions.push({ id: `ver-${task.id}-${number}`, number, label: number === 1 ? "First cut" : `Revision ${number-1}`, submittedAt: task.updatedAt, status: "In review" });
    task.progress = Math.max(task.progress, 90);
  }
  if (nextState === "changes_requested" && task.versions.length) task.versions.at(-1).status = "Changes requested";
  if ((nextState === "approved" || special === "approval_handoff") && task.versions.length) { task.versions.at(-1).status = "Approved"; task.progress = 100; }
  const latestScript = [...(task.documents || [])].reverse().find(document => document.purpose === "script");
  if (special === "script_approved" && latestScript) latestScript.status = "approved";
  if (["script_changes", "changes_to_content"].includes(special) && latestScript) latestScript.status = "changes_requested";
  if (special === "script_submitted" && latestScript) latestScript.status = "pending";
  if (nextState === "published") task.progress = 100;
  const specialActivity = { brand_handoff: "Brand completed the brief and sent requirements to the Content Team.", approval_handoff: "Brand approved the video and sent the complete task to the Perf team.", script_approved: "Brand approved the script and sent it to the Video Team with Other as the fallback Video Editor.", script_changes: "Brand requested script changes from the Content Team.", script_submitted: "The Content Team submitted a script document to Brand for approval.", script_link_submitted: "The Content Team submitted a Google Docs script link to Brand for approval.", video_handoff: "The Video Team submitted the completed video to Brand Team for approval.", changes_to_brand: `Requested changes from Brand Team: ${task.lastChangeRequestComment || "See task comments."}`, changes_to_content: `Requested changes from Content Team: ${task.lastChangeRequestComment || "See task comments."}`, changes_to_video: `Requested changes from Video Team: ${task.lastChangeRequestComment || "See task comments."}`, go_live: "The Perf team moved the approved video to Live." };
  task.activity.unshift({ at: task.updatedAt, actor: currentUser().name, team: currentUser().role === "content" ? "Content Team" : currentUser().role[0].toUpperCase() + currentUser().role.slice(1), text: specialActivity[special] || `Changed status from ${stateMeta(previous).label} to ${stateMeta(nextState).label}.` });
  const specialToast = { brand_handoff: "Requirements sent to Content Team", approval_handoff: "Video approved and sent to Perf team", script_approved: "Script approved and sent to Video Team", script_changes: "Script returned to Content Team", script_submitted: "Script sent to Brand approval", script_link_submitted: "Script sent to Brand Team approval", video_handoff: "Video sent to Brand Team approval", changes_to_brand: "Change request sent to Brand Team", changes_to_content: "Change request sent to Content Team", changes_to_video: "Change request sent to Video Team", go_live: "Status changed to Live" };
  persist(); render(); showToast(specialToast[special] || "Task updated", stateMeta(nextState).label);
}

function submitChat(event) {
  event.preventDefault();
  const body = new FormData(event.currentTarget).get("message").trim();
  if (!body) return;
  appState.data.messages.push({ id: `msg-${Date.now()}`, channelId: appState.activeChannelId, authorId: appState.currentUserId, body, at: new Date().toISOString(), taskId: null });
  persist(); render(); showToast("Message saved locally");
}

function submitTaskComment(event) {
  event.preventDefault();
  const body = new FormData(event.currentTarget).get("message").trim();
  if (!body) return;
  appState.data.messages.push({ id: `msg-${Date.now()}`, channelId: "channel-general", authorId: appState.currentUserId, body, at: new Date().toISOString(), taskId: event.currentTarget.dataset.taskId });
  persist(); render(); showToast("Comment attached to task");
}

function submitChangeRequest(event) {
  event.preventDefault();
  const request = appState.changeRequest;
  const comments = String(new FormData(event.currentTarget).get("comments") || "").trim();
  const task = appState.data.tasks.find(item => item.id === request?.taskId);
  if (!task || !request || !comments) return showToast("Add a comment before requesting changes");
  const changedAt = new Date().toISOString();
  appState.data.messages.push({ id: `msg-${Date.now()}`, channelId: "channel-general", authorId: appState.currentUserId, body: `Change request for ${request.targetTeam}: ${comments}`, at: changedAt, taskId: task.id });
  task.lastChangeRequestComment = comments;
  const special = request.targetTeam === "Brand Team" ? "changes_to_brand" : request.targetTeam === "Content Team" ? "changes_to_content" : "changes_to_video";
  appState.modal = null;
  appState.changeRequest = null;
  appState.selectedTaskId = task.id;
  transitionTask(task.id, request.nextState, special);
}

function submitContentBrief(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const taskId = String(form.get("taskId") || "");
  const scriptLink = String(form.get("scriptLink") || "").trim();
  const comments = String(form.get("comments") || "").trim();
  const task = appState.data.tasks.find(item => item.id === taskId);
  if (!task || !["social_research", "script_changes_requested"].includes(task.state)) return showToast("Choose a brief that is ready for Content Team work");
  const url = safeHttpsUrl(scriptLink);
  let hostname = "";
  try { hostname = new URL(url || "").hostname.toLowerCase(); } catch (_) {}
  if (!url || hostname !== "docs.google.com") return showToast("Enter a valid Google Docs link", "Use an https://docs.google.com/document/... link");
  if (!task.references.includes(url)) task.references.push(url);
  task.scriptLink = url;
  task.hasMissingAssets = false;
  if (comments) appState.data.messages.push({ id: `msg-${Date.now()}`, channelId: "channel-general", authorId: appState.currentUserId, body: comments, at: new Date().toISOString(), taskId: task.id });
  appState.modal = null;
  appState.contentBriefTaskId = null;
  appState.selectedTaskId = task.id;
  transitionTask(task.id, "script_approval_pending", "script_link_submitted");
}

function submitVideoHandoff(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const taskId = String(form.get("taskId") || "");
  const videoLink = String(form.get("videoLink") || "").trim();
  const comments = String(form.get("comments") || "").trim();
  const task = appState.data.tasks.find(item => item.id === taskId);
  if (!task || !["editing_queue", "editing_in_progress", "changes_requested"].includes(task.state)) return showToast("Choose a task that is ready for Video Team work");
  const url = safeHttpsUrl(videoLink);
  let hostname = "";
  try { hostname = new URL(url || "").hostname.toLowerCase(); } catch (_) {}
  if (!url || hostname !== "drive.google.com") return showToast("Enter a valid Google Drive link", "Use an https://drive.google.com/... link");
  task.videoLink = url;
  if (!task.references.includes(url)) task.references.push(url);
  task.hasMissingAssets = false;
  if (comments) appState.data.messages.push({ id: `msg-${Date.now()}`, channelId: "channel-general", authorId: appState.currentUserId, body: comments, at: new Date().toISOString(), taskId: task.id });
  appState.modal = null;
  appState.selectedTaskId = task.id;
  transitionTask(task.id, "approval_pending", "video_handoff");
}

async function submitBrief(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const intent = event.submitter?.value || "draft";
  const documentFile = form.get("additionalDocument");
  const documentError = validateDocument(documentFile, false);
  if (documentError) return showToast(documentError);
  const maxId = Math.max(...appState.data.tasks.map(t => Number(t.id.split("-")[1])));
  const references = String(form.get("references") || "").split(/\r?\n/).map(item => item.trim()).filter(Boolean);
  const createdAt = new Date().toISOString();
  const id = `BPE-${maxId + 1}`;
  const documentId = documentFile?.size ? `doc-${id}-${Date.now()}` : null;
  const documents = documentId ? [{ id: documentId, name: documentFile.name, size: documentFile.size, type: documentFile.type || "application/octet-stream", purpose: "additional", status: "provided", uploadedAt: createdAt, local: true }] : [];
  const briefType = form.get("briefType") === "ai" ? "ai" : "video";
  const sourceSheet = BRIEF_TYPES[briefType].sheet;
  const category = form.get("category");
  const assignment = categoryAssignment(category);
  const taskBase = {
    id, title: form.get("title"), brand: category === "Joyun" ? "Joyun" : "Plix", product: form.get("product"), campaign: sourceSheet, briefType, sourceSheet, source: { sheet: sourceSheet, row: null, origin: "application" }, category, contentType: form.get("contentType"), priority: form.get("priority"), state: intent === "submit" ? "social_research" : "draft", legacyStatus: "Created in application", editorId: null, contentOwnerId: assignment.scriptOwnerId, scriptOwnerId: assignment.scriptOwnerId, brandApproverIds: [...assignment.brandApproverIds], publisherId: null, progress: intent === "submit" ? 10 : 0, platform: "Unassigned", hasMissingAssets: references.length === 0 && documents.length === 0, updatedAt: createdAt, summary: form.get("summary"), deliverables: [form.get("contentType")], references, documents, versions: [], activity: [{ at: createdAt, actor: currentUser().name, team: "Brand", text: intent === "submit" ? `Created a ${BRIEF_TYPES[briefType].label} for ${sourceSheet}, auto-assigned the ${category} owners, and sent requirements to Content Team with ${references.length} reference${references.length === 1 ? "" : "s"}.` : `Saved the ${BRIEF_TYPES[briefType].label} for ${sourceSheet} with ${category} owners.` }]
  };
  const estimates = estimateTask(taskBase);
  const estimatedCompletion = new Date(new Date(createdAt).getTime() + estimates.total * 60000);
  const task = prepareTask({ ...taskBase, estimates, targetDate: estimatedCompletion.toISOString().slice(0, 10), estimatedCompletionAt: estimatedCompletion.toISOString() });
  if (documentFile?.size) {
    try { await saveTaskDocument(task.id, documentId, documentFile); }
    catch (storageError) { return showToast("Could not store document", storageError.message); }
  }
  appState.data.tasks.unshift(task); appState.modal = null; appState.selectedTaskId = task.id; persist(); render(); showToast(intent === "submit" ? "Requirements sent to Content Team" : "Brand intake saved");
}

function showToast(message, detail = "") {
  document.querySelector(".toast")?.remove();
  const toast = document.createElement("div"); toast.className = "toast"; toast.innerHTML = `${escapeHtml(message)}${detail ? `<span>${escapeHtml(detail)}</span>` : ""}`; document.body.append(toast); window.setTimeout(() => toast.remove(), 2600);
}

document.addEventListener("keydown", event => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); document.getElementById("global-search")?.focus(); }
  if (event.key === "Escape") { appState.selectedTaskId = null; appState.popover = null; appState.modal = null; render(); }
});

Promise.all([fetch("data/mock-data.json").then(r => r.json()), fetch("data/workbook-data.json").then(r => r.json()), fetch("config/workflow.json").then(r => r.json()), fetch("data/workbook-schema.json").then(r => r.json()), fetch("data/plix-products.json").then(r => r.json())])
  .then(([data, workbookData, workflow, workbookSchema, plixProducts]) => { appState.data = hydrate({ ...integrateWorkbookData(data, workbookData), workbookSchema, plixProducts }); appState.data.workbookSchema = workbookSchema; appState.data.plixProducts = plixProducts; appState.workflow = workflow; render(); })
  .catch(error => { document.getElementById("app").innerHTML = `<div class="loading-state"><span class="brand-mark">!</span><p>Could not load local fixtures. Serve this folder over HTTP.</p><code>${escapeHtml(error.message)}</code></div>`; });

