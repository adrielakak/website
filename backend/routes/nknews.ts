import { Router } from "express";
import fs from "fs-extra";
import { randomUUID } from "crypto";
import { resolveDataPath } from "../services/storagePaths.js";

const router = Router();
const filePath = resolveDataPath("nknews.json");

const DEFAULT_ARTICLES = [
  {
    id: "nknews-default-tf1-barbamama",
    title: "TF1 – Voix de Barbamama",
    content:
      "Retrouvez Nathalie Karsenti derrière la voix de Barbamama dans les rediffusions de Barbapapa en Famille sur TF1 et MyTF1.",
    image: "",
    createdAt: "2024-01-15T09:00:00.000Z",
  },
  {
    id: "nknews-default-netflix-peches",
    title: "Netflix – Série \"Péchés inavouables\"",
    content:
      "Dans la mini-série britannique Péchés inavouables (Obsession), Nathalie prête sa voix à la version française de ce thriller psychologique disponible sur Netflix.",
    image: "",
    createdAt: "2024-03-10T09:00:00.000Z",
  },
  {
    id: "nknews-default-netflix-fall-for-me",
    title: "Netflix – Film \"Fall for Me\"",
    content:
      "Nathalie Karsenti intervient sur le doublage VF du film romantique Fall for Me en apportant des voix additionnelles qui accompagnent les personnages secondaires.",
    image: "",
    createdAt: "2024-04-05T09:00:00.000Z",
  },
  {
    id: "nknews-default-netflix-intimidation",
    title: "Netflix – Thriller \"Intimidation\"",
    content:
      "Dans l’adaptation du roman d’Harlan Coben Intimidation, Nathalie participe au casting voix français et incarne plusieurs personnages clés tout au long de la série.",
    image: "",
    createdAt: "2024-05-18T09:00:00.000Z",
  },
  {
    id: "nknews-default-netflix-effet-veuf",
    title: "Netflix – Série documentaire \"L'effet veuf\"",
    content:
      "Pour la série documentaire L'effet veuf, Nathalie Karsenti assure la narration française de plusieurs épisodes consacrés aux grandes affaires criminelles.",
    image: "",
    createdAt: "2024-06-02T09:00:00.000Z",
  },
  {
    id: "nknews-default-apple-defending-jacob",
    title: "Apple TV+ – Série \"Defending Jacob\"",
    content:
      "Sur Apple TV+, Nathalie prête sa voix à la version française de Defending Jacob, la mini-série policière portée par Chris Evans.",
    image: "",
    createdAt: "2024-07-12T09:00:00.000Z",
  },
  {
    id: "nknews-default-apple-presume-innocent",
    title: "Apple TV+ – Série \"Présumé innocent\"",
    content:
      "Elle fait également partie du casting VF de Présumé innocent, la série événement produite par David E. Kelley pour Apple TV+.",
    image: "",
    createdAt: "2024-08-20T09:00:00.000Z",
  },
  {
    id: "nknews-default-canal-billions",
    title: "Canal+ – Série \"Billions\"",
    content:
      "Dans la saison finale de Billions diffusée sur Canal+ Séries, Nathalie renforce la version française avec de nouvelles voix additionnelles.",
    image: "",
    createdAt: "2024-09-15T09:00:00.000Z",
  },
];

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

function mergeWithDefaults(list: any[]): any[] {
  const seen = new Set(list.map((item: any) => item.id));
  const merged = [...list];
  for (const article of DEFAULT_ARTICLES) {
    if (!seen.has(article.id)) {
      merged.push(article);
    }
  }
  return merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

router.get("/", async (_req, res) => {
  try {
    const list = await readList();
    return res.json(mergeWithDefaults(list));
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
    list[index] = {
      ...list[index],
      ...(title !== undefined ? { title } : {}),
      ...(content !== undefined ? { content } : {}),
      ...(image !== undefined ? { image } : {}),
    };
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
