export type VideoState =
  | "editing_queue"
  | "editing_in_progress"
  | "changes_requested"
  | "blocked"
  | "approval_pending";

export type Priority = "P0" | "P1" | "P2" | "R0";

export type Editor = {
  id: string;
  name: string;
  initials: string;
  isTeamLead?: boolean;
  isFallback?: boolean;
};

export type Version = {
  id: string;
  number: number;
  label: string;
  submittedAt: string;
  status: string;
};

export type Activity = {
  at: string;
  actor: string;
  team?: string;
  text: string;
};

export type VideoTask = {
  id: string;
  title: string;
  product: string;
  brand: string;
  category: string;
  contentType: string;
  briefType: "video" | "ai";
  sourceSheet: string;
  priority: Priority;
  state: VideoState;
  targetDate: string;
  updatedAt: string;
  editorId: string | null;
  scriptOwnerName: string;
  progress: number;
  summary: string;
  deliverables: string[];
  references: string[];
  versions: Version[];
  activity: Activity[];
  videoLink?: string;
  hasMissingAssets: boolean;
};

export type WorkspaceData = {
  tasks: VideoTask[];
  editors: Editor[];
  asOf: string;
};
