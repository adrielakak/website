import { randomUUID } from "crypto";
import fs from "fs-extra";

import { resolveDataPath } from "./storagePaths.js";

export type PaymentMethod = "stripe" | "virement";
export type ReservationStatus = "stripe_pending" | "stripe_confirmed" | "virement_en_attente" | "cancelled";

export interface ReservationRecord {
  id: string;
  formationId: string;
  formationTitle: string;
  sessionId: string;
  sessionLabel: string;
  customerName: string;
  customerEmail: string;
  paymentMethod: PaymentMethod;
  status: ReservationStatus;
  stripeSessionId?: string;
  createdAt: string;
}

const RESERVATIONS_PATH = resolveDataPath("reservations.json");
const ACTIVE_STATUSES: ReservationStatus[] = ["stripe_pending", "stripe_confirmed", "virement_en_attente"];
const PENDING_TIMEOUT_MINUTES = Number.parseFloat(process.env.STRIPE_PENDING_TIMEOUT_MINUTES ?? "5");
const PENDING_TIMEOUT_MS = Number.isFinite(PENDING_TIMEOUT_MINUTES) && PENDING_TIMEOUT_MINUTES > 0
  ? PENDING_TIMEOUT_MINUTES * 60 * 1000
  : 5 * 60 * 1000;

async function ensureStorage(): Promise<void> {
  const exists = await fs.pathExists(RESERVATIONS_PATH);
  if (!exists) {
    await fs.outputJson(RESERVATIONS_PATH, [], { spaces: 2 });
  }
}

export async function readReservations(): Promise<ReservationRecord[]> {
  await ensureStorage();
  const raw = await fs.readFile(RESERVATIONS_PATH, "utf-8");
  if (!raw.trim()) {
    return [];
  }
  const reservations = JSON.parse(raw) as ReservationRecord[];
  return await applyPendingTimeout(reservations);
}

async function writeReservations(reservations: ReservationRecord[]): Promise<void> {
  await fs.outputJson(RESERVATIONS_PATH, reservations, { spaces: 2 });
}

async function applyPendingTimeout(reservations: ReservationRecord[]): Promise<ReservationRecord[]> {
  const now = Date.now();
  let changed = false;

  const updated = reservations.map((reservation) => {
    if (reservation.status === "stripe_pending") {
      const createdTime = new Date(reservation.createdAt).getTime();
      if (Number.isFinite(createdTime) && now - createdTime >= PENDING_TIMEOUT_MS) {
        changed = true;
        return {
          ...reservation,
          status: "cancelled",
        };
      }
    }
    return reservation;
  });

  if (changed) {
    await writeReservations(updated);
  }

  return updated;
}

interface ReservationInput {
  formationId: string;
  formationTitle: string;
  sessionId: string;
  sessionLabel: string;
  customerName: string;
  customerEmail: string;
  paymentMethod: PaymentMethod;
  status: ReservationStatus;
  stripeSessionId?: string;
}

export async function addReservation(input: ReservationInput): Promise<ReservationRecord> {
  const reservations = await readReservations();
  const record: ReservationRecord = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    ...input,
  };
  reservations.push(record);
  await writeReservations(reservations);
  return record;
}

export async function countActiveReservationsBySession(sessionId: string): Promise<number> {
  const reservations = await readReservations();
  return reservations.filter(
    (reservation) => reservation.sessionId === sessionId && ACTIVE_STATUSES.includes(reservation.status)
  ).length;
}

interface ReservationUpdate {
  status?: ReservationStatus;
  stripeSessionId?: string;
}

export async function updateReservationByStripeSession(
  stripeSessionId: string,
  updates: ReservationUpdate
): Promise<ReservationRecord | null> {
  if (!stripeSessionId) {
    return null;
  }

  const reservations = await readReservations();
  const index = reservations.findIndex((reservation) => reservation.stripeSessionId === stripeSessionId);

  if (index === -1) {
    return null;
  }

  const current = reservations[index];
  const next: ReservationRecord = {
    ...current,
    ...updates,
  };

  reservations[index] = next;
  await writeReservations(reservations);
  return next;
}

export async function listReservations(): Promise<ReservationRecord[]> {
  const reservations = await readReservations();
  return reservations.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
