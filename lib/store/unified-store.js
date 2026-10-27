import { EventEmitter } from "node:events";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { filterTasksForTeam, transitionTask } from "../workflow/engine";
import { getSupabaseAdmin, isSupabaseConfigured } from "../supabase/server";

const DATA_DIR = path.join(process.cwd(), ".data");
const STATE_FILE = path.join(DATA_DIR, "unified-state.json");
const SUPABASE_STATE_TABLE = "plix_app_state";
const SUPABASE_STATE_ID = process.env.SUPABASE_STATE_ID || "plix-ops-main";

const runtime = globalThis.__plixUnifiedRuntime || {
  emitter: new EventEmitter(),
  writeQueue: Promise.resolve(),
  supabaseChannel: null,
  subscriberCount: 0,
};
runtime.emitter.setMaxListeners(300);
globalThis.__plixUnifiedRuntime = runtime;
runtime.subscriberCount = runtime.subscriberCount || 0;
runtime.supabaseChannel = runtime.supabaseChannel || null;

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function writeStateFile(state) {
  await mkdir(DATA_DIR, { recursive: true });
  const temporaryFile = `${STATE_FILE}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(temporaryFile, JSON.stringify(state, null, 2), "utf8");
  await rename(temporaryFile, STATE_FILE);
}

async function readSupabaseState() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(SUPABASE_STATE_TABLE)
    .select("payload, revision, updated_at, updated_by")
    .eq("id", SUPABASE_STATE_ID)
    .maybeSingle();

  if (error) {
    throw new Error(`Supabase state read failed: ${error.message}`);
  }

  if (data) {
    return {
      ...data.payload,
      revision: Number(data.revision),
      updatedAt: data.updated_at,
      updatedBy: data.updated_by,
    };
  }

  const seeded = await createSeedState();
  const { error: insertError } = await supabase.from(SUPABASE_STATE_TABLE).insert({
    id: SUPABASE_STATE_ID,
    payload: seeded,
    revision: seeded.revision,
    updated_at: seeded.updatedAt,
    updated_by: "Initial seed",
  });

  if (insertError && insertError.code !== "23505") {
    throw new Error(`Supabase state initialization failed: ${insertError.message}`);
  }

  // A concurrent instance may have inserted first; always return the winning row.
  if (insertError?.code === "23505") return readSupabaseState();
  return seeded;
}

/**
 * Initializes state from mock-data and workbook-data if state file doesn't exist.
 */
async function createSeedState() {
  const [mockData, workbookData] = await Promise.all([
    readJson(path.join(process.cwd(), "data", "mock-data.json")),
    readJson(path.join(process.cwd(), "data", "workbook-data.json")),
  ]);

  const tasksMap = new Map();

  // Load operational fixture tasks first
  for (const task of mockData.tasks || []) {
    tasksMap.set(task.id, {
      ...task,
      hookName: task.hookName || task.title,
      stageDurations: task.stageDurations || [
        {
          stage: "brand_intake",
          team: "brand",
          iteration: 1,
          startedAt: task.updatedAt || new Date().toISOString(),
          completedAt: task.updatedAt || new Date().toISOString(),
          durationSeconds: 120,
          durationHours: 0.1,
        },
      ],
    });
  }

  // Load workbook tasks
  for (const task of workbookData.tasks || []) {
    if (!tasksMap.has(task.id)) {
      tasksMap.set(task.id, {
        ...task,
        hookName: task.hookName || task.title,
        stageDurations: task.stageDurations || [
          {
            stage: "brand_intake",
            team: "brand",
            iteration: 1,
            startedAt: task.updatedAt || new Date().toISOString(),
            completedAt: task.updatedAt || new Date().toISOString(),
            durationSeconds: 300,
            durationHours: 0.2,
          },
        ],
      });
    }
  }

  return {
    version: 1,
    revision: 1,
    updatedAt: new Date().toISOString(),
    tasks: Array.from(tasksMap.values()),
    users: mockData.users || [],
    notifications: mockData.notifications || [],
  };
}

export async function getState() {
  if (isSupabaseConfigured()) {
    return readSupabaseState();
  }

  try {
    return await readJson(STATE_FILE);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    const seeded = await createSeedState();
    await writeStateFile(seeded);
    return seeded;
  }
}

/**
 * Mutates state atomically within a queue and emits a realtime change event.
 */
export async function mutateState(mutator, actor = "System") {
  const operation = runtime.writeQueue.then(async () => {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();

      // Optimistic revision checks prevent two managers from overwriting each other.
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const current = await readSupabaseState();
        const tasks = structuredClone(current.tasks || []);
        const users = structuredClone(current.users || []);
        const notifications = structuredClone(current.notifications || []);
        const result = await mutator({ tasks, users, notifications, current });
        const now = new Date().toISOString();
        const nextState = {
          version: 1,
          revision: Number(current.revision || 1) + 1,
          updatedAt: now,
          updatedBy: actor,
          tasks,
          users,
          notifications,
        };

        const { data, error } = await supabase
          .from(SUPABASE_STATE_TABLE)
          .update({
            payload: nextState,
            revision: nextState.revision,
            updated_at: now,
            updated_by: actor,
          })
          .eq("id", SUPABASE_STATE_ID)
          .eq("revision", current.revision)
          .select("revision")
          .maybeSingle();

        if (error) throw new Error(`Supabase state write failed: ${error.message}`);
        if (!data) continue;

        runtime.emitter.emit("change", {
          type: "state.updated",
          revision: nextState.revision,
          updatedAt: now,
          actor,
          source: "supabase",
        });
        return { state: nextState, result };
      }

      throw new Error("Supabase state changed repeatedly; please retry the action");
    }

    const current = await getState();
    const tasks = structuredClone(current.tasks);
    const users = structuredClone(current.users);
    const notifications = structuredClone(current.notifications);

    const result = await mutator({ tasks, users, notifications, current });

    const nextState = {
      version: 1,
      revision: (current.revision || 1) + 1,
      updatedAt: new Date().toISOString(),
      updatedBy: actor,
      tasks,
      users,
      notifications,
    };

    await writeStateFile(nextState);

    runtime.emitter.emit("change", {
      type: "state.updated",
      revision: nextState.revision,
      updatedAt: nextState.updatedAt,
      actor,
    });

    return { state: nextState, result };
  });

  runtime.writeQueue = operation.catch(() => {});
  return operation;
}

export function subscribeToChanges(listener) {
  runtime.emitter.on("change", listener);
  runtime.subscriberCount += 1;

  if (isSupabaseConfigured() && !runtime.supabaseChannel) {
    const supabase = getSupabaseAdmin();
    runtime.supabaseChannel = supabase
      .channel(`plix-app-state-${SUPABASE_STATE_ID}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "plix_state_events",
          filter: `state_id=eq.${SUPABASE_STATE_ID}`,
        },
        (payload) => {
          runtime.emitter.emit("change", {
            type: "state.updated",
            revision: payload.new?.revision,
            updatedAt: payload.new?.created_at,
            actor: payload.new?.updated_by,
            source: "supabase-realtime",
          });
        }
      )
      .subscribe();
  }

  return () => {
    runtime.emitter.off("change", listener);
    runtime.subscriberCount = Math.max(0, runtime.subscriberCount - 1);
    if (runtime.subscriberCount === 0 && runtime.supabaseChannel) {
      const supabase = getSupabaseAdmin();
      supabase?.removeChannel(runtime.supabaseChannel);
      runtime.supabaseChannel = null;
    }
  };
}

