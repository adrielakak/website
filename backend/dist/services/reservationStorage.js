import { randomUUID } from "crypto";
import fs from "fs-extra";
import { resolveDataPath } from "./storagePaths.js";
const RESERVATIONS_PATH = resolveDataPath("reservations.json");
const ACTIVE_STATUSES = [
    "stripe_pending",
    "stripe_confirmed",
    "virement_en_attente",
    "virement_confirme",
];
const PENDING_TIMEOUT_MINUTES = Number.parseFloat(process.env.STRIPE_PENDING_TIMEOUT_MINUTES ?? "5");
const PENDING_TIMEOUT_MS = Number.isFinite(PENDING_TIMEOUT_MINUTES) && PENDING_TIMEOUT_MINUTES > 0
    ? PENDING_TIMEOUT_MINUTES * 60 * 1000
    : 5 * 60 * 1000;
async function ensureStorage() {
    const exists = await fs.pathExists(RESERVATIONS_PATH);
    if (!exists) {
        await fs.outputJson(RESERVATIONS_PATH, [], { spaces: 2 });
    }
}
export async function readReservations() {
    await ensureStorage();
    const raw = await fs.readFile(RESERVATIONS_PATH, "utf-8");
    if (!raw.trim()) {
        return [];
    }
    const reservations = JSON.parse(raw);
    return await applyPendingTimeout(reservations);
}
async function writeReservations(reservations) {
    await fs.outputJson(RESERVATIONS_PATH, reservations, { spaces: 2 });
}
async function applyPendingTimeout(reservations) {
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
export async function addReservation(input) {
    const reservations = await readReservations();
    const record = {
        id: randomUUID(),
        createdAt: new Date().toISOString(),
        sessionChangeCount: 0,
        ...input,
    };
    reservations.push(record);
    await writeReservations(reservations);
    return record;
}
export async function countActiveReservationsBySession(sessionId, excludeReservationId) {
    const reservations = await readReservations();
    return reservations.filter((reservation) => reservation.sessionId === sessionId &&
        ACTIVE_STATUSES.includes(reservation.status) &&
        reservation.id !== excludeReservationId).length;
}
export async function findReservationById(id) {
    if (!id) {
        return null;
    }
    const reservations = await readReservations();
    return reservations.find((reservation) => reservation.id === id) ?? null;
}
export async function updateReservationByStripeSession(stripeSessionId, updates) {
    if (!stripeSessionId) {
        return null;
    }
    const reservations = await readReservations();
    const index = reservations.findIndex((reservation) => reservation.stripeSessionId === stripeSessionId);
    if (index === -1) {
        return null;
    }
    const current = reservations[index];
    const next = {
        ...current,
        ...updates,
        sessionChangeCount: updates.sessionChangeCount !== undefined
            ? updates.sessionChangeCount
            : current.sessionChangeCount ?? 0,
    };
    reservations[index] = next;
    await writeReservations(reservations);
    return next;
}
export async function updateReservationById(reservationId, updates) {
    if (!reservationId) {
        return null;
    }
    const reservations = await readReservations();
    const index = reservations.findIndex((reservation) => reservation.id === reservationId);
    if (index === -1) {
        return null;
    }
    const current = reservations[index];
    const next = {
        ...current,
        ...updates,
        sessionChangeCount: updates.sessionChangeCount !== undefined
            ? updates.sessionChangeCount
            : current.sessionChangeCount ?? 0,
    };
    reservations[index] = next;
    await writeReservations(reservations);
    return next;
}
export async function listReservations() {
    const reservations = await readReservations();
    return reservations.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export async function deleteReservationById(id) {
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
