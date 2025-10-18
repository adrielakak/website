import { Router } from "express";
import fs from "fs-extra";
import { resolveDataPath } from "../services/storagePaths.js";

const router = Router();
const filePath = resolveDataPath("nknews.json");

router.get("/", async (_req, res) => {
  try {
    const exists = await fs.pathExists(filePath);
    if (!exists) return res.json([]);
    const data = JSON.parse(await fs.readFile(filePath, "utf-8"));
    return res.json(Array.isArray(data) ? data : []);
  } catch (e) {
    console.error("Erreur lecture NKNEWS:", e);
    return res.json([]);
  }
});

router.post("/", async (req, res) => {
  const configuredKey = process.env.ADMIN_API_KEY;
  const providedKey = req.header("x-admin-key");
  if (configuredKey && providedKey !== configuredKey) {
    return res.status(401).json({ message: "Clé administrateur requise." });
  }
  try {
    const newArticle = req.body ?? {};
    const entry = {
      title: newArticle.title ?? "",
      content: newArticle.content ?? "",
      image: newArticle.image ?? "",
      createdAt: new Date().toISOString(),
    };

    const exists = await fs.pathExists(filePath);
    let articles: unknown = [];
    if (exists) {
      articles = JSON.parse(await fs.readFile(filePath, "utf-8"));
    } else {
      await fs.ensureFile(filePath);
    }

    const list = Array.isArray(articles) ? articles : [];
    list.unshift(entry);
    await fs.writeFile(filePath, JSON.stringify(list, null, 2), "utf-8");
    return res.json({ success: true });
  } catch (e) {
    console.error("Erreur écriture NKNEWS:", e);
    return res.status(500).json({ success: false });
  }
});

export default router;
