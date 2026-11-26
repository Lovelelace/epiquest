import { createDatabase } from "../client.js";
import { getDatabaseUrl, loadRootEnvFile } from "../env.js";
import { importSrd } from "./import.js";
import { SRD_SOURCE } from "./version.js";

loadRootEnvFile();
const { db, close } = createDatabase(getDatabaseUrl());

try {
  await importSrd(db);
  console.info(`SRD ${SRD_SOURCE.srdVersion} importé (${SRD_SOURCE.sourceRef}).`);
} catch (error) {
  console.error("Échec de l'import du SRD :", error);
  process.exitCode = 1;
} finally {
  await close();
}
