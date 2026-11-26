import { createDatabase } from "../client.js";
import { getDatabaseUrl, loadRootEnvFile } from "../env.js";
import { importSrd } from "./import.js";
import { SRD_SOURCE } from "./version.js";

loadRootEnvFile();
const { db, close } = createDatabase(getDatabaseUrl());

try {
  const { monsterAttacks: report } = await importSrd(db);
  console.info(`SRD ${SRD_SOURCE.srdVersion} importé (${SRD_SOURCE.sourceRef}).`);
  const converted = report.full + report.partial;
  const rate = ((100 * converted) / report.attacks).toFixed(1);
  console.info(
    `Attaques de monstres converties : ${converted}/${report.attacks} (${rate} %), ` +
      `dont ${report.partial} avec un effet en plus à appliquer à la main.`,
  );
  for (const { monster, action, reason } of report.unconverted) {
    console.info(`  non convertie : ${monster} / ${action} (${reason})`);
  }
} catch (error) {
  console.error("Échec de l'import du SRD :", error);
  process.exitCode = 1;
} finally {
  await close();
}
