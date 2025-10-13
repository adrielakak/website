import { randomUUID } from "crypto";
import fs from "fs-extra";
import path from "path";
const CONTACT_PATH = path.resolve(process.cwd(), "data", "contactMessages.json");
async function ensureContactStorage() {
    const exists = await fs.pathExists(CONTACT_PATH);
    if (!exists) {
        await fs.outputJson(CONTACT_PATH, [], { spaces: 2 });
    }
}
export async function addContactMessage(data) {
    await ensureContactStorage();
    const existingRaw = await fs.readFile(CONTACT_PATH, "utf-8");
    const existingMessages = existingRaw.trim() ? JSON.parse(existingRaw) : [];
    const record = {
        id: randomUUID(),
        createdAt: new Date().toISOString(),
        ...data,
    };
    existingMessages.push(record);
    await fs.outputJson(CONTACT_PATH, existingMessages, { spaces: 2 });
    return record;
}
