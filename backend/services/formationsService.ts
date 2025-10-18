import fs from "fs-extra";

import { formations as baseFormations } from "../data/formations.js";
import type { Formation, SessionOption } from "../data/formations.js";
import { resolveDataPath } from "./storagePaths.js";

type ExtraSessionsState = Record<string, SessionOption[]>; // key: formationId

const EXTRA_SESSIONS_PATH = resolveDataPath("extraSessions.json");

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

export async function getFormations(): Promise<Formation[]> {
  const extras = await readExtraSessions();
  return baseFormations.map((f) => ({
    ...f,
    sessions: [...f.sessions, ...(extras[f.id] ?? [])],
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

