import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Activity, Editor, Priority, Version, VideoState, VideoTask, WorkspaceData } from "./types";

type SourceUser = {
  id: string;
  name: string;
  role: string;
  initials?: string;
  isTeamLead?: boolean;
  isFallback?: boolean;
};

type SourceTask = Partial<VideoTask> & {
  id: string;
  title?: string;
  state?: string;
  priority?: string;
  contentOwnerId?: string | null;
  scriptOwnerId?: string | null;
};

type SourceData = {
  meta?: { asOf?: string };
  users?: SourceUser[];
  tasks?: SourceTask[];
};

const VIDEO_STATES = new Set<VideoState>([
  "editing_queue",
  "editing_in_progress",
  "changes_requested",
  "blocked",
  "approval_pending"
]);

const VALID_PRIORITIES = new Set<Priority>(["P0", "P1", "P2", "R0"]);

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, "utf8")) as T;
}

function initials(name: string) {
  return name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function normalizeTask(task: SourceTask, users: Map<string, SourceUser>): VideoTask | null {
  if (!VIDEO_STATES.has(task.state as VideoState)) return null;
  const ownerId = task.scriptOwnerId ?? task.contentOwnerId ?? "";
  return {
    id: task.id,
    title: task.title || "Untitled video task",
    product: task.product || "Unspecified product",
    brand: task.brand || "Plix",
    category: task.category || "Global",
    contentType: task.contentType || "Unspecified edit",
    briefType: task.briefType === "ai" ? "ai" : "video",
    sourceSheet: task.sourceSheet || (task.briefType === "ai" ? "AI Tracker Main" : "Work Plan"),
    priority: VALID_PRIORITIES.has(task.priority as Priority) ? task.priority as Priority : "P1",
    state: task.state as VideoState,
    targetDate: task.targetDate || "",
    updatedAt: task.updatedAt || new Date(0).toISOString(),
    editorId: task.editorId || null,
    scriptOwnerName: users.get(ownerId)?.name || "Unassigned",
    progress: Number(task.progress || 0),
    summary: task.summary || "No additional production notes were provided.",
    deliverables: Array.isArray(task.deliverables) ? task.deliverables : [],
    references: Array.isArray(task.references) ? task.references : [],
    versions: Array.isArray(task.versions) ? task.versions as Version[] : [],
    activity: Array.isArray(task.activity) ? task.activity as Activity[] : [],
    videoLink: task.videoLink,
    hasMissingAssets: Boolean(task.hasMissingAssets)
  };
}

export async function getVideoWorkspaceData(): Promise<WorkspaceData> {
  const repositoryRoot = process.env.BRAND_PERF_DATA_ROOT
    ? path.resolve(process.env.BRAND_PERF_DATA_ROOT)
    : path.resolve(process.cwd(), "..");
  const [fixture, workbook] = await Promise.all([
    readJson<SourceData>(path.join(repositoryRoot, "data", "mock-data.json")),
    readJson<SourceData>(path.join(repositoryRoot, "data", "workbook-data.json"))
  ]);

  const allUsers = [...(fixture.users || []), ...(workbook.users || [])];
  const usersById = new Map(allUsers.map((user) => [user.id, user]));
  const seen = new Set<string>();
  const tasks = [...(fixture.tasks || []), ...(workbook.tasks || [])]
    .filter((task) => !seen.has(task.id) && seen.add(task.id))
    .map((task) => normalizeTask(task, usersById))
    .filter((task): task is VideoTask => Boolean(task))
    .sort((a, b) => {
      const priorityOrder: Record<Priority, number> = { P0: 0, P1: 1, P2: 2, R0: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority] || a.targetDate.localeCompare(b.targetDate);
    });

  const editors: Editor[] = allUsers
    .filter((user, index, source) => user.role === "edit" && source.findIndex((item) => item.id === user.id) === index)
    .map((user) => ({
      id: user.id,
      name: user.name,
      initials: user.initials || initials(user.name),
      isTeamLead: user.isTeamLead,
      isFallback: user.isFallback
    }));

  return { tasks, editors, asOf: workbook.meta?.asOf || fixture.meta?.asOf || "2026-10-16" };
}
