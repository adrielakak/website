import fs from "fs-extra";
import { resolveDataPath } from "./storagePaths.js";
const DEFAULT_CAPACITY = Number(process.env.DEFAULT_SESSION_CAPACITY ?? 12);
const AVAILABILITY_PATH = resolveDataPath("availability.json");
async function ensureStorage() {
    const exists = await fs.pathExists(AVAILABILITY_PATH);
    if (!exists) {
        await fs.outputJson(AVAILABILITY_PATH, {}, { spaces: 2 });
    }
}
export async function readAvailabilityState() {
    await ensureStorage();
    const raw = await fs.readFile(AVAILABILITY_PATH, "utf-8");
    if (!raw.trim()) {
        return {};
    }
    return JSON.parse(raw);
}
async function writeAvailabilityState(state) {
    await fs.outputJson(AVAILABILITY_PATH, state, { spaces: 2 });
}
export async function ensureAvailabilityDefaults(formations) {
    const state = await readAvailabilityState();
    let changed = false;
    for (const formation of formations) {
        for (const session of formation.sessions) {
            if (!state[session.id]) {
                state[session.id] = {
                    sessionId: session.id,
                    capacity: DEFAULT_CAPACITY,
                    isOpen: true,
                    isCancelled: false,
                };
                changed = true;
            }
        }
    }
    const knownSessionIds = new Set(formations.flatMap((formation) => formation.sessions.map((session) => session.id)));
    for (const sessionId of Object.keys(state)) {
        if (!knownSessionIds.has(sessionId)) {
            delete state[sessionId];
            changed = true;
        }
        if (state[sessionId] && typeof state[sessionId].isCancelled !== "boolean") {
            state[sessionId].isCancelled = false;
            changed = true;
        }
        if (state[sessionId]?.isCancelled && state[sessionId].isOpen) {
            state[sessionId].isOpen = false;
            changed = true;
        }
    }
    if (changed) {
        await writeAvailabilityState(state);
    }
}
export async function getSessionAvailability(sessionId) {
    const state = await readAvailabilityState();
    return (state[sessionId] ?? {
        sessionId,
        capacity: DEFAULT_CAPACITY,
        isOpen: true,
        isCancelled: false,
    });
}
export async function upsertSessionAvailability(sessionId, updates) {
    const state = await readAvailabilityState();
    const current = state[sessionId] ?? {
        sessionId,
        capacity: DEFAULT_CAPACITY,
        isOpen: true,
        isCancelled: false,
    };
    const next = {
        ...current,
        ...updates,
        capacity: typeof updates.capacity === "number" && updates.capacity >= 0 ? Math.floor(updates.capacity) : current.capacity,
        isCancelled: typeof updates.isCancelled === "boolean" ? updates.isCancelled : current.isCancelled,
    };
    if (next.isCancelled) {
        next.isOpen = false;
    }
    else if (updates.isCancelled === false && current.isCancelled && updates.isOpen === undefined) {
        next.isOpen = true;
    }
    state[sessionId] = next;
    await writeAvailabilityState(state);
    return next;
}
export async function getAvailabilityList(formations) {
    const state = await readAvailabilityState();
    return formations.flatMap((formation) => formation.sessions.map((session) => ({
        formationId: formation.id,
        formationTitle: formation.title,
        sessionId: session.id,
        sessionLabel: session.label,
        startDate: session.startDate,
        endDate: session.endDate,
        capacity: state[session.id]?.capacity ?? DEFAULT_CAPACITY,
        isCancelled: state[session.id]?.isCancelled ?? false,
        isOpen: state[session.id]?.isCancelled ?? false
            ? false
            : state[session.id]?.isOpen ?? true,
    })));
}
