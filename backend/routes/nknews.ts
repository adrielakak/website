import { Router } from "express";
import fs from "fs";
import path from "path";

const router = Router();
const filePath = path.join(process.cwd(), "data", "nknews.json");

router.get("/", (_req, res) => {
  try {
    if (!fs.existsSync(filePath)) return res.json([]);
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    return res.json(Array.isArray(data) ? data : []);
  } catch (e) {
    console.error("Erreur lecture NKNEWS:", e);
    return res.json([]);
  }
});

router.post("/", (req, res) => {
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

    let articles: unknown = [];
    if (fs.existsSync(filePath)) {
      articles = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    } else {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }

    const list = Array.isArray(articles) ? articles : [];
    list.unshift(entry);
    fs.writeFileSync(filePath, JSON.stringify(list, null, 2));
    return res.json({ success: true });
  } catch (e) {
    console.error("Erreur écriture NKNEWS:", e);
    return res.status(500).json({ success: false });
  }
});

export default router;
