import fs from "fs-extra";

import { formations as baseFormations } from "../data/formations.js";
import type { Formation, SessionOption } from "../data/formations.js";
import { resolveDataPath } from "./storagePaths.js";

type ExtraSessionsState = Record<string, SessionOption[]>; // key: formationId

const EXTRA_SESSIONS_PATH = resolveDataPath("extraSessions.json");
const REMOVED_SESSIONS_PATH = resolveDataPath("removedSessions.json");

async function readExtraSessions(): Promise<ExtraSessionsState> {
  const exists = await fs.pathExists(EXTRA_SESSIONS_PATH);
  if (!exists) {
    return {};
  }
  const raw = await fs.readFile(EXTRA_SESSIONS_PATH, "utf-8");
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw) as ExtraSessionsState;
  } catch {
    return {};
  }
}

async function writeExtraSessions(state: ExtraSessionsState): Promise<void> {
  await fs.outputJson(EXTRA_SESSIONS_PATH, state, { spaces: 2 });
}

async function readRemovedSessions(): Promise<Set<string>> {
  const exists = await fs.pathExists(REMOVED_SESSIONS_PATH);
  if (!exists) return new Set<string>();
  const raw = await fs.readFile(REMOVED_SESSIONS_PATH, "utf-8");
  if (!raw.trim()) return new Set<string>();
  try {
    const arr = JSON.parse(raw) as string[];
    return new Set(arr);
  } catch {
    return new Set<string>();
  }
}

async function writeRemovedSessions(ids: Set<string>): Promise<void> {
  await fs.outputJson(REMOVED_SESSIONS_PATH, Array.from(ids), { spaces: 2 });
}

export async function getFormations(): Promise<Formation[]> {
  const extras = await readExtraSessions();
  const removed = await readRemovedSessions();
  return baseFormations.map((f) => ({
    ...f,
    sessions: [...f.sessions, ...(extras[f.id] ?? [])].filter((s) => !removed.has(s.id)),
  }));
}

export function generateSessionId(formationId: string, startDate: string): string {
  const cleaned = formationId.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase();
  const datePart = String(startDate).slice(0, 10);
  const rand = Math.random().toString(36).slice(2, 6);
  return `${cleaned}-${datePart}-${rand}`;
}

export async function addSession(
  formationId: string,
  session: Omit<SessionOption, "id"> & { id?: string }
): Promise<SessionOption> {
  const extras = await readExtraSessions();
  const id = session.id?.trim() || generateSessionId(formationId, session.startDate);
  const next: SessionOption = {
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

export async function removeSession(sessionId: string): Promise<boolean> {
  // Try to remove from extras first
  const extras = await readExtraSessions();
  let removed = false;
  for (const [formationId, list] of Object.entries(extras)) {
    const idx = list.findIndex((s) => s.id === sessionId);
    if (idx !== -1) {
      list.splice(idx, 1);
      extras[formationId] = list;
      await writeExtraSessions(extras);
      removed = true;
      break;
    }
  }

  if (removed) return true;

  // If not in extras, tombstone a base session
  const removedSet = await readRemovedSessions();
  if (!removedSet.has(sessionId)) {
    removedSet.add(sessionId);
    await writeRemovedSessions(removedSet);
    return true;
  }
  return false;
}
