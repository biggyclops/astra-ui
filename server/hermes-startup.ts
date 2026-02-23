import fs from "node:fs";
import pathModule from "node:path";
import { log } from "./logger";

const HERMES_LOCAL_PATH = process.env.HERMES_LOCAL_PATH;
const HERMES_EXPECTED_ROOT = process.env.HERMES_EXPECTED_ROOT || "files";

export function runHermesStartupSanityCheck(): void {
  if (!HERMES_LOCAL_PATH) return;

  const bigWarn = (msg: string) => {
    const line = "!".repeat(60);
    console.error(`\n${line}`);
    console.error(`HERMES STARTUP WARNING: ${msg}`);
    console.error(`${line}\n`);
  };

  try {
    const stat = fs.statSync(HERMES_LOCAL_PATH);
    if (!stat.isDirectory()) {
      bigWarn(`HERMES_LOCAL_PATH=${HERMES_LOCAL_PATH} exists but is NOT a directory. Fix or unset HERMES_LOCAL_PATH.`);
      if (process.env.NODE_ENV === "development") {
        throw new Error(`HERMES_LOCAL_PATH must be a directory. Got: ${HERMES_LOCAL_PATH}`);
      }
    }
  } catch (e: any) {
    if (e.code === "ENOENT") {
      bigWarn(`HERMES_LOCAL_PATH=${HERMES_LOCAL_PATH} does not exist. Mount may be down or path is wrong.`);
      if (process.env.NODE_ENV === "development") {
        throw new Error(`HERMES_LOCAL_PATH directory not found. Mount HermesStorage or unset HERMES_LOCAL_PATH.`);
      }
    } else {
      throw e;
    }
  }

  const expectedRoot = pathModule.join(HERMES_LOCAL_PATH, HERMES_EXPECTED_ROOT);
  try {
    const rootStat = fs.statSync(expectedRoot);
    if (!rootStat.isDirectory()) {
      bigWarn(`Expected root ${HERMES_EXPECTED_ROOT}/ at ${expectedRoot} exists but is not a directory.`);
      if (process.env.NODE_ENV === "development") {
        throw new Error(`Hermes mount should contain ${HERMES_EXPECTED_ROOT}/ directory.`);
      }
    }
  } catch (e: any) {
    if (e.code === "ENOENT") {
      bigWarn(`Mounted share has no ${HERMES_EXPECTED_ROOT}/ subtree at ${expectedRoot} — check share points to HermesStorage root.`);
      if (process.env.NODE_ENV === "development") {
        throw new Error(`Expected ${HERMES_EXPECTED_ROOT}/ not found. Wrong share or mount path?`);
      }
    } else {
      throw e;
    }
  }

  log(`[hermes] HERMES_LOCAL_PATH OK: ${HERMES_LOCAL_PATH} contains ${HERMES_EXPECTED_ROOT}/`);
}
