"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import type { Editor, Priority, VideoState, VideoTask, WorkspaceData } from "@/lib/types";

const STORAGE_KEY = "brand-perf-video-team-next-v1";

const stateMeta: Record<VideoState, { label: string; short: string }> = {
  editing_queue: { label: "Video queue", short: "Queue" },
  editing_in_progress: { label: "Video production", short: "In progress" },
  changes_requested: { label: "Video changes requested", short: "Changes" },
  blocked: { label: "Blocked", short: "Blocked" },
  approval_pending: { label: "Brand video approval", short: "Brand review" }
};

const boardStates: VideoState[] = [
  "editing_queue",
  "editing_in_progress",
  "changes_requested",
  "blocked",
  "approval_pending"
];

function Icon({ name }: { name: "menu" | "search" | "bell" | "help" | "video" | "board" | "list" | "clock" | "alert" | "check" | "arrow" | "close" }) {
  const paths: Record<string, ReactNode> = {
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    help: <><circle cx="12" cy="12" r="9" /><path d="M9.7 9a2.5 2.5 0 1 1 3.6 2.2c-.8.4-1.3 1-1.3 1.8M12 17h.01" /></>,
    video: <><rect x="3" y="5" width="13" height="14" rx="2" /><path d="m16 10 5-3v10l-5-3" /></>,
    board: <><rect x="3" y="4" width="7" height="16" rx="1" /><rect x="14" y="4" width="7" height="10" rx="1" /></>,
    list: <><path d="M8 6h13M8 12h13M8 18h13" /><path d="M3 6h.01M3 12h.01M3 18h.01" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    alert: <><path d="M10.3 3.7 2.2 18A2 2 0 0 0 3.9 21h16.2a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></>,
    check: <path d="m20 6-11 11-5-5" />,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    close: <path d="m6 6 12 12M18 6 6 18" />
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function formatDate(value: string) {
  if (!value) return "No due date";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(new Date(`${value}T00:00:00`));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function isOverdue(task: VideoTask, asOf: string) {
  return Boolean(task.targetDate && task.targetDate < asOf && task.state !== "approval_pending");
}

function editorName(task: VideoTask, editors: Editor[]) {
  return editors.find((editor) => editor.id === task.editorId)?.name || "Unassigned";
}

function Pill({ task }: { task: VideoTask }) {
  return <span className={`status status-${task.state}`}>{stateMeta[task.state].label}</span>;
}

export function VideoWorkspace({ initialData }: { initialData: WorkspaceData }) {
  const [tasks, setTasks] = useState(initialData.tasks);
  const storageReady = useRef(false);
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState<Priority | "all">("all");
  const [briefType, setBriefType] = useState<"all" | "video" | "ai">("all");
  const [view, setView] = useState<"board" | "list">("board");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    let restoreTimer: number | undefined;
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") as { tasks?: VideoTask[] } | null;
      restoreTimer = window.setTimeout(() => {
        if (saved?.tasks) setTasks(saved.tasks);
        storageReady.current = true;
      }, 0);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      storageReady.current = true;
    }
    return () => window.clearTimeout(restoreTimer);
  }, []);

  useEffect(() => {
    if (!storageReady.current) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ tasks }));
  }, [tasks]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return tasks.filter((task) => {
      const search = [task.id, task.title, task.product, task.category, task.contentType, task.sourceSheet].join(" ").toLowerCase();
      return (!needle || search.includes(needle)) &&
        (priority === "all" || task.priority === priority) &&
        (briefType === "all" || task.briefType === briefType);
    });
  }, [tasks, query, priority, briefType]);

  const selected = tasks.find((task) => task.id === selectedId) || null;
  const unassigned = tasks.filter((task) => task.state !== "approval_pending" && !task.editorId).length;
  const overdue = tasks.filter((task) => isOverdue(task, initialData.asOf)).length;

  function patchTask(taskId: string, patch: Partial<VideoTask>, activity?: string) {
    setTasks((current) => current.map((task) => task.id === taskId ? {
      ...task,
      ...patch,
      updatedAt: new Date().toISOString(),
      activity: activity ? [{ at: new Date().toISOString(), actor: "Video Team", team: "Video Team", text: activity }, ...task.activity] : task.activity
    } : task));
  }

  function assignEditor(taskId: string, editorId: string) {
    const editor = initialData.editors.find((item) => item.id === editorId);
    patchTask(taskId, { editorId: editorId || null }, editor ? `Assigned ${editor.name} as video editor.` : "Removed the video editor assignment.");
    setToast(editor ? `Assigned to ${editor.name}` : "Editor unassigned");
  }

  function startEditing(task: VideoTask) {
    const fallback = initialData.editors.find((editor) => editor.isFallback) || initialData.editors[0];
    patchTask(task.id, { state: "editing_in_progress", progress: Math.max(task.progress, 35), editorId: task.editorId || fallback?.id || null }, "Started video production.");
    setToast("Video moved to production");
  }

  function submitVideo(event: FormEvent<HTMLFormElement>, task: VideoTask) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = String(form.get("videoLink") || "").trim();
    let url: URL;
    try { url = new URL(value); } catch { setToast("Enter a valid Google Drive URL"); return; }
    if (url.protocol !== "https:" || url.hostname !== "drive.google.com") {
      setToast("Use an https://drive.google.com link");
      return;
    }
    const versionNumber = task.versions.length + 1;
    patchTask(task.id, {
      state: "approval_pending",
      progress: 90,
      videoLink: url.href,
      versions: [...task.versions, { id: `ver-${task.id}-${Date.now()}`, number: versionNumber, label: versionNumber === 1 ? "First cut" : `Revision ${versionNumber - 1}`, submittedAt: new Date().toISOString(), status: "In review" }]
    }, "Submitted the video to Brand Team for approval.");
    setToast("Video sent to Brand Team");
  }

  function sendBack(event: FormEvent<HTMLFormElement>, task: VideoTask) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const comment = String(form.get("comment") || "").trim();
    if (!comment) { setToast("Add a reason before sending it back"); return; }
    patchTask(task.id, { state: "blocked" }, `Sent back to Brand Team: ${comment}`);
    setToast("Request sent to Brand Team");
    event.currentTarget.reset();
  }

  function resetLocalChanges() {
    localStorage.removeItem(STORAGE_KEY);
    setTasks(initialData.tasks);
    setSelectedId(null);
    setToast("Local Video Team changes reset");
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand"><span className="brand-mark">B</span><div><strong>Brand Perf Edit</strong><span>Creative operations</span></div></div>
        <div className="workspace-label">Workspace</div>
        <div className="workspace-card"><strong>Creative studio</strong><span>Video Team portal</span></div>
        <nav aria-label="Video Team navigation">
          <span className="nav-label">Production</span>
          <button className="nav-item active"><Icon name="video" /><span>Video team</span><b>{tasks.length}</b></button>
          <button className="nav-item" onClick={() => setToast("Use the filters to focus the queue")}><Icon name="list" /><span>My queue</span></button>
          <button className="nav-item" onClick={() => setToast("Brand review tasks appear in the final column")}><Icon name="check" /><span>Brand review</span></button>
        </nav>
        <div className="sidebar-foot"><span className="live-dot" />Workbook snapshot connected<br /><small>Local team workspace</small></div>
      </aside>

      {sidebarOpen && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}

      <div className="main-shell">
        <header className="topbar">
          <button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setSidebarOpen(true)}><Icon name="menu" /></button>
          <label className="global-search"><Icon name="search" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search video tasks, products, or IDs" /></label>
          <div className="top-actions"><button className="icon-button" aria-label="Help" onClick={() => setToast("Video Team guide coming next")}><Icon name="help" /></button><button className="icon-button notification" aria-label="Notifications"><Icon name="bell" /><i /></button><div className="user"><span>PT</span><div><strong>Pritam</strong><small>Video Team lead</small></div></div></div>
        </header>

        <main>
          <section className="page-head">
            <div><span className="eyebrow">Video production workspace</span><h1>Video team</h1><p>Pick up approved scripts, manage production, and send completed videos to Brand for review.</p></div>
            <button className="secondary-button" onClick={resetLocalChanges}>Reset local changes</button>
          </section>

          <section className="metrics" aria-label="Video Team metrics">
            <article><span>Ready to start</span><strong>{tasks.filter((task) => task.state === "editing_queue").length}</strong><small>Approved scripts in queue</small></article>
            <article><span>In production</span><strong>{tasks.filter((task) => task.state === "editing_in_progress").length}</strong><small>Active edits</small></article>
            <article><span>Changes requested</span><strong>{tasks.filter((task) => task.state === "changes_requested").length}</strong><small>Needs another version</small></article>
            <article className={overdue ? "metric-alert" : ""}><span>Needs attention</span><strong>{overdue + unassigned}</strong><small>{overdue} overdue · {unassigned} unassigned</small></article>
          </section>

          <section className="workflow-strip" aria-label="Video workflow">
            <div><span>1</span><strong>Approved script</strong></div><i /><div><span>2</span><strong>Assign editor</strong></div><i /><div className="current"><span>3</span><strong>Produce video</strong></div><i /><div><span>4</span><strong>Brand review</strong></div>
          </section>

          <section className="controls">
            <div className="queue-tabs"><button className={briefType === "all" ? "active" : ""} onClick={() => setBriefType("all")}>All briefs</button><button className={briefType === "video" ? "active" : ""} onClick={() => setBriefType("video")}>Video briefs</button><button className={briefType === "ai" ? "active" : ""} onClick={() => setBriefType("ai")}>AI briefs</button></div>
            <select aria-label="Filter by priority" value={priority} onChange={(event) => setPriority(event.target.value as Priority | "all")}><option value="all">All priorities</option><option>P0</option><option>P1</option><option>P2</option><option>R0</option></select>
            <span className="result-count">{filtered.length} tasks</span>
            <div className="view-toggle"><button className={view === "board" ? "active" : ""} onClick={() => setView("board")}><Icon name="board" />Board</button><button className={view === "list" ? "active" : ""} onClick={() => setView("list")}><Icon name="list" />List</button></div>
          </section>

          {view === "board" ? (
            <section className="board" aria-label="Video production board">
              {boardStates.map((state) => {
                const items = filtered.filter((task) => task.state === state);
                return <div className="board-column" key={state}><header><strong>{stateMeta[state].short}</strong><span>{items.length}</span></header><div className="cards">{items.map((task) => <TaskCard key={task.id} task={task} editors={initialData.editors} asOf={initialData.asOf} onOpen={() => setSelectedId(task.id)} />)}{!items.length && <div className="empty-column">No tasks</div>}</div></div>;
              })}
            </section>
          ) : <TaskTable tasks={filtered} editors={initialData.editors} asOf={initialData.asOf} onOpen={setSelectedId} onAssign={assignEditor} />}
        </main>
      </div>

      {selected && <TaskDrawer task={selected} editors={initialData.editors} asOf={initialData.asOf} onClose={() => setSelectedId(null)} onAssign={assignEditor} onStart={startEditing} onSubmit={submitVideo} onSendBack={sendBack} />}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

function TaskCard({ task, editors, asOf, onOpen }: { task: VideoTask; editors: Editor[]; asOf: string; onOpen: () => void }) {
  return <button className="task-card" onClick={onOpen}>
    <div className="card-top"><span className={`priority priority-${task.priority}`}>{task.priority}</span><span className={`brief-type ${task.briefType}`}>{task.briefType === "ai" ? "AI brief" : "Video brief"}</span></div>
    <h3>{task.title}</h3><p>{task.product} · {task.contentType}</p>
    <div className="progress"><i style={{ width: `${task.progress}%` }} /><span>{task.progress}%</span></div>
    <div className="card-foot"><span className={isOverdue(task, asOf) ? "overdue" : ""}>{formatDate(task.targetDate)}</span><span>{editorName(task, editors)}</span></div>
  </button>;
}

function TaskTable({ tasks, editors, asOf, onOpen, onAssign }: { tasks: VideoTask[]; editors: Editor[]; asOf: string; onOpen: (id: string) => void; onAssign: (id: string, editorId: string) => void }) {
  return <section className="table-wrap"><table><thead><tr><th>Task</th><th>Priority</th><th>Editor</th><th>Due</th><th>Progress</th><th>Status</th></tr></thead><tbody>{tasks.map((task) => <tr key={task.id} onClick={() => onOpen(task.id)}><td><strong>{task.title}</strong><small>{task.id} · {task.product}</small></td><td><span className={`priority priority-${task.priority}`}>{task.priority}</span></td><td onClick={(event) => event.stopPropagation()}><select value={task.editorId || ""} onChange={(event) => onAssign(task.id, event.target.value)}><option value="">Unassigned</option>{editors.map((editor) => <option value={editor.id} key={editor.id}>{editor.name}</option>)}</select></td><td className={isOverdue(task, asOf) ? "overdue" : ""}>{formatDate(task.targetDate)}</td><td>{task.progress}%</td><td><Pill task={task} /></td></tr>)}</tbody></table>{!tasks.length && <div className="empty-table">No tasks match these filters.</div>}</section>;
}

type DrawerProps = {
  task: VideoTask;
  editors: Editor[];
  asOf: string;
  onClose: () => void;
  onAssign: (id: string, editorId: string) => void;
  onStart: (task: VideoTask) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>, task: VideoTask) => void;
  onSendBack: (event: FormEvent<HTMLFormElement>, task: VideoTask) => void;
};

function TaskDrawer({ task, editors, asOf, onClose, onAssign, onStart, onSubmit, onSendBack }: DrawerProps) {
  const editable = ["editing_queue", "editing_in_progress", "changes_requested"].includes(task.state);
  return <><button className="drawer-scrim" aria-label="Close task details" onClick={onClose} /><aside className="drawer" role="dialog" aria-modal="true" aria-label={`Task details for ${task.title}`}>
    <header><div><span className="eyebrow">{task.id} · {task.category}</span><h2>{task.title}</h2><p>{task.product} · {task.contentType}</p></div><button className="icon-button" aria-label="Close details" onClick={onClose}><Icon name="close" /></button></header>
    <div className="drawer-body">
      <div className="drawer-status"><Pill task={task} /><span className={`priority priority-${task.priority}`}>{task.priority}</span>{isOverdue(task, asOf) && <span className="overdue"><Icon name="alert" />Overdue</span>}</div>

      <section className="handoff-panel"><div className="section-heading"><div><span className="eyebrow">Production handoff</span><h3>Send video to Brand Team</h3></div><Icon name="video" /></div>
        {editable ? <form onSubmit={(event) => onSubmit(event, task)}><label>Google Drive video link<input name="videoLink" type="url" required defaultValue={task.videoLink || ""} placeholder="https://drive.google.com/file/d/..." /></label><small>Only secure Google Drive links are accepted.</small><button className="primary-button" type="submit">Send to Brand review <Icon name="arrow" /></button></form> : <div className="submitted-link"><Icon name="check" /><div><strong>Video submitted for review</strong><span>{task.videoLink || "The latest version is with Brand Team."}</span></div></div>}
      </section>

      <section><div className="section-heading"><div><span className="eyebrow">Ownership</span><h3>Assigned video editor</h3></div></div><select className="full-select" value={task.editorId || ""} onChange={(event) => onAssign(task.id, event.target.value)} disabled={task.state === "approval_pending"}><option value="">Unassigned</option>{editors.map((editor) => <option value={editor.id} key={editor.id}>{editor.name}{editor.isTeamLead ? " · Lead" : ""}</option>)}</select>{["editing_queue", "changes_requested"].includes(task.state) && <button className="secondary-button full-button" onClick={() => onStart(task)}>Start production</button>}</section>

      <section><div className="section-heading"><div><span className="eyebrow">Brief</span><h3>Production requirements</h3></div></div><p className="summary">{task.summary}</p><dl className="detail-grid"><div><dt>Script owner</dt><dd>{task.scriptOwnerName}</dd></div><div><dt>Source</dt><dd>{task.sourceSheet}</dd></div><div><dt>Due date</dt><dd>{formatDate(task.targetDate)}</dd></div><div><dt>Brief type</dt><dd>{task.briefType === "ai" ? "AI brief" : "Video brief"}</dd></div></dl></section>

      <section><div className="section-heading"><div><span className="eyebrow">Output</span><h3>Deliverables</h3></div></div><div className="chip-list">{task.deliverables.length ? task.deliverables.map((item) => <span key={item}>{item}</span>) : <span>No deliverables listed</span>}</div></section>
      <section><div className="section-heading"><div><span className="eyebrow">Inputs</span><h3>Reference assets</h3></div></div><div className="chip-list">{task.references.length ? task.references.map((item) => <span key={item}>{item}</span>) : <span>No reference assets</span>}</div>{task.hasMissingAssets && <div className="warning"><Icon name="alert" />This task is missing a required production asset.</div>}</section>

      <section><div className="section-heading"><div><span className="eyebrow">History</span><h3>Activity</h3></div></div><div className="timeline">{task.activity.map((item, index) => <article key={`${item.at}-${index}`}><i /><strong>{item.actor}{item.team ? ` · ${item.team}` : ""}</strong><p>{item.text}</p><time>{formatDateTime(item.at)}</time></article>)}</div></section>

      {editable && <section className="return-panel"><div className="section-heading"><div><span className="eyebrow">Missing information?</span><h3>Send back to Brand Team</h3></div></div><form onSubmit={(event) => onSendBack(event, task)}><textarea name="comment" required placeholder="Explain what the Video Team needs before production can continue" /><button className="danger-button" type="submit">Request clarification</button></form></section>}
    </div>
  </aside></>;
}
