import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { CommandMapping, addExtraMappings } from "./unixMappings";

export interface SmartshConfig {
  mappings?: CommandMapping[];
}

function readJson(filePath: string): any {
  try {
    const txt = fs.readFileSync(filePath, "utf8");
    return JSON.parse(txt);
  } catch {
    return null;
  }
}

export function initConfig() {
  const home = os.homedir();
  const candidates = [
    path.join(home, ".smartshrc"),
    path.join(home, ".smartshrc.json"),
    path.join(home, ".smartshrc.js"),
    path.join(home, ".smartshrc.cjs")
  ];
  let cfg: SmartshConfig | null = null;
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      if (p.endsWith(".js") || p.endsWith(".cjs")) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const mod = require(p);
          if (typeof mod === "function") {
            cfg = mod({ addExtraMappings });
          } else {
            cfg = mod;
          }
        } catch {
          cfg = null;
        }
      } else {
        cfg = readJson(p);
      }
      if (cfg) break;
    }
  }
  if (cfg?.mappings && Array.isArray(cfg.mappings)) {
    addExtraMappings(cfg.mappings as CommandMapping[]);
  }
} 