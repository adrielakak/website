import fs from "fs-extra";
import path from "path";

const RAW_DATA_DIR = process.env.DATA_DIR;

export const DATA_DIR =
  RAW_DATA_DIR && RAW_DATA_DIR.trim().length > 0 ? path.resolve(RAW_DATA_DIR) : path.resolve(process.cwd(), "data");

fs.ensureDirSync(DATA_DIR);

export function resolveDataPath(filename: string): string {
  return path.resolve(DATA_DIR, filename);
}
