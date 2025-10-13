import { randomUUID } from "crypto";
import fs from "fs-extra";

import { resolveDataPath } from "./storagePaths.js";

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
  status: "new" | "handled";
}

const CONTACT_PATH = resolveDataPath("contactMessages.json");

async function ensureContactStorage(): Promise<void> {
  const exists = await fs.pathExists(CONTACT_PATH);
  if (!exists) {
    await fs.outputJson(CONTACT_PATH, [], { spaces: 2 });
  }
}

export async function addContactMessage(data: Omit<ContactMessage, "id" | "createdAt" | "status">): Promise<ContactMessage> {
  await ensureContactStorage();
  const existingRaw = await fs.readFile(CONTACT_PATH, "utf-8");
  const existingMessages: ContactMessage[] = existingRaw.trim() ? JSON.parse(existingRaw) : [];

  const record: ContactMessage = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    status: "new",
    ...data,
  };

  existingMessages.push(record);
  await fs.outputJson(CONTACT_PATH, existingMessages, { spaces: 2 });

  return record;
}

export async function listContactMessages(): Promise<ContactMessage[]> {
  await ensureContactStorage();
  const existingRaw = await fs.readFile(CONTACT_PATH, "utf-8");
  const messages: ContactMessage[] = existingRaw.trim() ? JSON.parse(existingRaw) : [];
  messages.forEach((message) => {
    if (!message.status) {
      message.status = "new";
    }
  });
  return messages.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateContactMessageStatus(id: string, status: ContactMessage["status"]): Promise<ContactMessage | null> {
  await ensureContactStorage();
  const existingRaw = await fs.readFile(CONTACT_PATH, "utf-8");
  const messages: ContactMessage[] = existingRaw.trim() ? JSON.parse(existingRaw) : [];
  const index = messages.findIndex((message) => message.id === id);

  if (index === -1) {
    return null;
  }

  messages[index] = {
    ...messages[index],
    status,
  };

  await fs.outputJson(CONTACT_PATH, messages, { spaces: 2 });
  return messages[index];
}

export async function deleteContactMessage(id: string): Promise<boolean> {
  await ensureContactStorage();
  const existingRaw = await fs.readFile(CONTACT_PATH, "utf-8");
  const messages: ContactMessage[] = existingRaw.trim() ? JSON.parse(existingRaw) : [];
  const next = messages.filter((message) => message.id !== id);

  if (next.length === messages.length) {
    return false;
  }

  await fs.outputJson(CONTACT_PATH, next, { spaces: 2 });
  return true;
}
