import { Router } from "express";
import fs from "fs-extra";
import { randomUUID } from "crypto";
import { resolveDataPath } from "../services/storagePaths.js";

const router = Router();
const filePath = resolveDataPath("nknews.json");

async function readList(): Promise<any[]> {
  const exists = await fs.pathExists(filePath);
  if (!exists) return [];
  const raw = await fs.readFile(filePath, "utf-8");
  try {
    const data = JSON.parse(raw);
    const list = Array.isArray(data) ? data : [];
    // Normalize: ensure every entry has an id and createdAt
    let changed = false;
    for (const item of list) {
      if (!item.id) {
        item.id = randomUUID();
        changed = true;
      }
      if (!item.createdAt) {
        item.createdAt = new Date().toISOString();
        changed = true;
      }
    }
    if (changed) {
      await writeList(list);
    }
    return list;
  } catch {
    return [];
  }
}

async function writeList(list: any[]): Promise<void> {
  await fs.ensureFile(filePath);
  await fs.writeFile(filePath, JSON.stringify(list, null, 2), "utf-8");
}

router.get("/", async (_req, res) => {
  try {
    const list = await readList();
    return res.json(list);
  } catch (e) {
    console.error("Erreur lecture NKNEWS:", e);
    return res.json([]);
  }
});

function requireAdmin(req: any, res: any): boolean {
  const configuredKey = process.env.ADMIN_API_KEY;
  const providedKey = req.header("x-admin-key");
  if (configuredKey && providedKey !== configuredKey) {
    res.status(401).json({ message: "Clé administrateur requise." });
    return false;
  }
  return true;
}

router.post("/", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { title = "", content = "", image = "" } = req.body ?? {};
    const entry = { id: randomUUID(), title, content, image, createdAt: new Date().toISOString() };
    const list = await readList();
    list.unshift(entry);
    await writeList(list);
    return res.json({ success: true, article: entry });
  } catch (e) {
    console.error("Erreur écriture NKNEWS:", e);
    return res.status(500).json({ success: false });
  }
});

router.patch("/:id", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { id } = req.params;
  try {
    const list = await readList();
    const index = list.findIndex((it) => it.id === id);
    if (index === -1) return res.status(404).json({ message: "Article introuvable." });
    const { title, content, image } = req.body ?? {};
    list[index] = { ...list[index], ...(title !== undefined ? { title } : {}), ...(content !== undefined ? { content } : {}), ...(image !== undefined ? { image } : {}) };
    await writeList(list);
    return res.json({ success: true, article: list[index] });
  } catch (e) {
    console.error("Erreur mise à jour NKNEWS:", e);
    return res.status(500).json({ success: false });
  }
});

router.delete("/:id", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { id } = req.params;
  try {
    const list = await readList();

    let next = list;
    if (id?.startsWith("index:")) {
      const idx = Number(id.split(":")[1]);
      if (Number.isInteger(idx) && idx >= 0 && idx < list.length) {
        next = [...list.slice(0, idx), ...list.slice(idx + 1)];
      } else {
        return res.status(404).json({ message: "Index invalide." });
      }
    } else {
      next = list.filter((it) => it.id !== id);
      if (next.length === list.length) {
        return res.status(404).json({ message: "Article introuvable." });
      }
    }

    await writeList(next);
    return res.status(204).send();
  } catch (e) {
    console.error("Erreur suppression NKNEWS:", e);
    return res.status(500).json({ success: false });
  }
});

export default router;
