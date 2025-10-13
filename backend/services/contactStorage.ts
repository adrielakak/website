import { randomUUID } from "crypto";
import fs from "fs-extra";
import path from "path";

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
}

const CONTACT_PATH = path.resolve(process.cwd(), "data", "contactMessages.json");

async function ensureContactStorage(): Promise<void> {
  const exists = await fs.pathExists(CONTACT_PATH);
  if (!exists) {
    await fs.outputJson(CONTACT_PATH, [], { spaces: 2 });
  }
}

export async function addContactMessage(data: Omit<ContactMessage, "id" | "createdAt">): Promise<ContactMessage> {
  await ensureContactStorage();
  const existingRaw = await fs.readFile(CONTACT_PATH, "utf-8");
  const existingMessages: ContactMessage[] = existingRaw.trim() ? JSON.parse(existingRaw) : [];

  const record: ContactMessage = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    ...data,
  };

  existingMessages.push(record);
  await fs.outputJson(CONTACT_PATH, existingMessages, { spaces: 2 });

  return record;
}
