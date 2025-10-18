import fs from "fs-extra";
import { formations as baseFormations } from "../data/formations.js";
import { resolveDataPath } from "./storagePaths.js";
const EXTRA_SESSIONS_PATH = resolveDataPath("extraSessions.json");
async function readExtraSessions() {
    const exists = await fs.pathExists(EXTRA_SESSIONS_PATH);
    if (!exists) {
        return {};
    }
    const raw = await fs.readFile(EXTRA_SESSIONS_PATH, "utf-8");
    if (!raw.trim())
        return {};
    try {
        return JSON.parse(raw);
    }
    catch {
        return {};
    }
}
async function writeExtraSessions(state) {
    await fs.outputJson(EXTRA_SESSIONS_PATH, state, { spaces: 2 });
}
export async function getFormations() {
    const extras = await readExtraSessions();
    return baseFormations.map((f) => ({
        ...f,
        sessions: [...f.sessions, ...(extras[f.id] ?? [])],
    }));
}
export function generateSessionId(formationId, startDate) {
    const cleaned = formationId.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase();
    const datePart = String(startDate).slice(0, 10);
    const rand = Math.random().toString(36).slice(2, 6);
    return `${cleaned}-${datePart}-${rand}`;
}
export async function addSession(formationId, session) {
    const extras = await readExtraSessions();
    const id = session.id?.trim() || generateSessionId(formationId, session.startDate);
    const next = {
        id,
        label: session.label,
        startDate: session.startDate,
        endDate: session.endDate,
    };
    const list = extras[formationId] ?? [];
    // Avoid duplicates by id
    if (list.some((s) => s.id === next.id)) {
        throw new Error("Une session avec cet identifiant existe déjà.");
    }
    list.push(next);
    extras[formationId] = list;
    await writeExtraSessions(extras);
    return next;
}
