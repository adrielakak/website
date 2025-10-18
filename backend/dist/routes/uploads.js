import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs-extra";
import { resolveDataPath } from "../services/storagePaths.js";
const router = Router();
const UPLOADS_DIR = resolveDataPath("uploads");
fs.ensureDirSync(UPLOADS_DIR);
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname) || ".png";
        const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]+/g, "-");
        const stamp = Date.now();
        cb(null, `${base}-${stamp}${ext}`);
    },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB max
router.post("/image", upload.single("file"), (req, res) => {
    const configuredKey = process.env.ADMIN_API_KEY;
    const providedKey = req.header("x-admin-key");
    if (configuredKey && providedKey !== configuredKey) {
        return res.status(401).json({ message: "Clé administrateur requise." });
    }
    if (!req.file) {
        return res.status(400).json({ message: "Fichier manquant." });
    }
    const publicUrl = `/uploads/${req.file.filename}`;
    res.json({ url: publicUrl, filename: req.file.filename });
});
export default router;
