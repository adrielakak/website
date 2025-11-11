import { randomUUID } from "crypto";
import fs from "fs-extra";

import { resolveDataPath } from "./storagePaths.js";

export type PaymentMethod = "stripe" | "virement";
export type ReservationStatus =
  | "stripe_pending"
  | "stripe_confirmed"
  | "virement_en_attente"
  | "virement_confirme"
  | "cancelled";

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
  sessionChangeCount?: number;
}

const RESERVATIONS_PATH = resolveDataPath("reservations.json");
const ACTIVE_STATUSES: ReservationStatus[] = [
  "stripe_pending",
  "stripe_confirmed",
  "virement_en_attente",
  "virement_confirme",
];
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
          status: "cancelled" as ReservationStatus,
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
    sessionChangeCount: 0,
    ...input,
  };
  reservations.push(record);
  await writeReservations(reservations);
  return record;
}

export async function countActiveReservationsBySession(
  sessionId: string,
  excludeReservationId?: string
): Promise<number> {
  const reservations = await readReservations();
  return reservations.filter(
    (reservation) =>
      reservation.sessionId === sessionId &&
      ACTIVE_STATUSES.includes(reservation.status) &&
      reservation.id !== excludeReservationId
  ).length;
}

export async function findActiveReservationByEmail(email: string): Promise<ReservationRecord | null> {
  if (!email) {
    return null;
  }
  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  const reservations = await readReservations();
  return (
    reservations.find(
      (reservation) =>
        ACTIVE_STATUSES.includes(reservation.status) &&
        reservation.customerEmail.trim().toLowerCase() === normalized
    ) ?? null
  );
}

export async function findReservationById(id: string): Promise<ReservationRecord | null> {
  if (!id) {
    return null;
  }
  const reservations = await readReservations();
  return reservations.find((reservation) => reservation.id === id) ?? null;
}

export interface ReservationUpdate {
  sessionChangeCount?: number;
  status?: ReservationStatus;
  stripeSessionId?: string;
  sessionId?: string;
  sessionLabel?: string;
  formationId?: string;
  formationTitle?: string;
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
    sessionChangeCount:
      updates.sessionChangeCount !== undefined
        ? updates.sessionChangeCount
        : current.sessionChangeCount ?? 0,
  };

  reservations[index] = next;
  await writeReservations(reservations);
  return next;
}

export async function updateReservationById(
  reservationId: string,
  updates: ReservationUpdate
): Promise<ReservationRecord | null> {
  if (!reservationId) {
    return null;
  }

  const reservations = await readReservations();
  const index = reservations.findIndex((reservation) => reservation.id === reservationId);

  if (index === -1) {
    return null;
  }

  const current = reservations[index];
  const next: ReservationRecord = {
    ...current,
    ...updates,
    sessionChangeCount:
      updates.sessionChangeCount !== undefined
        ? updates.sessionChangeCount
        : current.sessionChangeCount ?? 0,
  };

  reservations[index] = next;
  await writeReservations(reservations);
  return next;
}

export async function listReservations(): Promise<ReservationRecord[]> {
  const reservations = await readReservations();
  return reservations.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function deleteReservationById(id: string): Promise<boolean> {
  if (!id) {
    return false;
  }
  const reservations = await readReservations();
  const index = reservations.findIndex((reservation) => reservation.id === id);
  if (index === -1) {
    return false;
  }
  reservations.splice(index, 1);
  await writeReservations(reservations);
  return true;
}







