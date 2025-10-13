import { randomUUID } from "crypto";
import fs from "fs-extra";
import path from "path";
const RESERVATIONS_PATH = path.resolve(process.cwd(), "data", "reservations.json");
const ACTIVE_STATUSES = ["stripe_pending", "stripe_confirmed", "virement_en_attente"];
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
    return JSON.parse(raw);
}
async function writeReservations(reservations) {
    await fs.outputJson(RESERVATIONS_PATH, reservations, { spaces: 2 });
}
export async function addReservation(input) {
    const reservations = await readReservations();
    const record = {
        id: randomUUID(),
        createdAt: new Date().toISOString(),
        ...input,
    };
    reservations.push(record);
    await writeReservations(reservations);
    return record;
}
export async function countActiveReservationsBySession(sessionId) {
    const reservations = await readReservations();
    return reservations.filter((reservation) => reservation.sessionId === sessionId && ACTIVE_STATUSES.includes(reservation.status)).length;
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
    };
    reservations[index] = next;
    await writeReservations(reservations);
    return next;
}
export async function listReservations() {
    const reservations = await readReservations();
    return reservations.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
