import { ABILITIES, ABILITY_LABELS, SKILL_LABELS, SKILLS } from "@epiquest/rules";
import type { Character } from "@epiquest/schemas";
import PDFDocument from "pdfkit";

const MARGIN = 50;
const BODY_SIZE = 10;
const HEADING_SIZES = { 1: 20, 2: 14 } as const;
const COIN_LABELS = { cp: "pc", sp: "pa", ep: "pe", gp: "po", pp: "pp" } as const;
const ENCUMBRANCE_LABELS = {
  none: "non encombré",
  encumbered: "encombré",
  "heavily-encumbered": "lourdement encombré",
  overloaded: "surchargé",
} as const;
const PROFICIENCY_LABELS = { none: "", proficient: " (maîtrise)", expertise: " (expertise)" };

/** Attribution exigée par la licence du SRD 5.1. */
export const SRD_ATTRIBUTION =
  "Contenu de jeu issu du System Reference Document 5.1, sous licence Creative Commons " +
  "Attribution 4.0 International (CC BY 4.0).";

function signed(value: number): string {
  return value >= 0 ? `+${value}` : `-${Math.abs(value)}`;
}

export interface PdfOptions {
  /** Désactive la compression des flux (tests : structure lisible dans le fichier). */
  compress?: boolean;
}

/**
 * Fiche de personnage en PDF balisé (Tagged PDF) : texte sélectionnable, titres H1/H2,
 * paragraphes et listes dans l'ordre de lecture, langue et titre du document déclarés.
 * Aucune marque ni logo : seulement les données du personnage et l'attribution du SRD.
 */
export function renderCharacterSheetPdf(
  character: Character,
  options: PdfOptions = {},
): Promise<Buffer> {
  const title = `Fiche de personnage : ${character.name}`;
  const doc = new PDFDocument({
    size: "A4",
    margin: MARGIN,
    pdfVersion: "1.7",
    tagged: true,
    lang: "fr-FR",
    displayTitle: true,
    compress: options.compress ?? true,
    info: { Title: title, Subject: "Fiche de personnage" },
  });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const finished = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const root = doc.struct("Document");
  doc.addStructure(root);
  const heading = (level: 1 | 2, text: string) => {
    if (level === 2) doc.moveDown(0.6);
    doc
      .font("Helvetica-Bold")
      .fontSize(HEADING_SIZES[level])
      .text(text, { structParent: root, structType: `H${level}` });
  };
  const paragraph = (text: string) => {
    doc.font("Helvetica").fontSize(BODY_SIZE).text(text, { structParent: root, structType: "P" });
  };
  const list = (items: string[]) => {
    if (items.length === 0) return paragraph("Aucun.");
    doc.font("Helvetica").fontSize(BODY_SIZE).list(items, { structParent: root });
  };

  const { statistics, state } = character;
  heading(1, character.name);
  paragraph(
    [
      `${character.species.name}, ${character.class.name} niveau ${character.level}`,
      character.subclass ? `(${character.subclass.name})` : "",
      `- historique : ${character.background.name}.`,
    ]
      .filter(Boolean)
      .join(" "),
  );

  heading(2, "Combat");
  list([
    `Classe d'armure : ${statistics.armorClass}${statistics.hasStealthDisadvantage ? " (désavantage en Discrétion)" : ""}`,
    `Points de vie : ${state.currentHitPoints} sur ${statistics.hitPointMaximum}, ${state.temporaryHitPoints} temporaires`,
    `Dés de vie : ${state.hitDiceRemaining} sur ${statistics.hitDice.count} (d${statistics.hitDice.die})`,
    `Initiative : ${signed(statistics.initiative)}`,
    `Vitesse : ${statistics.speed} pieds`,
    `Bonus de maîtrise : ${signed(statistics.proficiencyBonus)}`,
    `Perception passive : ${statistics.passivePerception}`,
  ]);

  heading(2, "Caractéristiques");
  list(
    ABILITIES.map(
      (ability) =>
        `${ABILITY_LABELS[ability]} : ${statistics.abilityScores[ability]} (${signed(statistics.abilityModifiers[ability])})`,
    ),
  );

  heading(2, "Jets de sauvegarde");
  list(
    ABILITIES.map((ability) => {
      const save = statistics.savingThrows[ability];
      return `${ABILITY_LABELS[ability]} : ${signed(save.modifier)}${PROFICIENCY_LABELS[save.proficiency]}`;
    }),
  );

  heading(2, "Compétences");
  list(
    [...SKILLS]
      .sort((left, right) => SKILL_LABELS[left].localeCompare(SKILL_LABELS[right], "fr"))
      .flatMap((skill) => {
        const check = statistics.skills[skill];
        return check
          ? [
              `${SKILL_LABELS[skill]} : ${signed(check.modifier)}${PROFICIENCY_LABELS[check.proficiency]}`,
            ]
          : [];
      }),
  );

  heading(2, "Attaques");
  list(
    character.attacks.map(
      (attack) =>
        `${attack.name} : ${signed(attack.attackBonus)} pour toucher, ${attack.damage} ${attack.damageType}`,
    ),
  );

  if (statistics.spellcasting) {
    const spellcasting = statistics.spellcasting;
    heading(2, "Sorts");
    paragraph(
      `Caractéristique : ${ABILITY_LABELS[spellcasting.ability]}, DD des sauvegardes ${spellcasting.saveDc}, attaque de sort ${signed(spellcasting.attackBonus)}.`,
    );
    const slots = spellcasting.slots.slots.map(
      (count, index) =>
        `niveau ${index + 1} : ${count - (state.spellSlotsUsed[index] ?? 0)} sur ${count}`,
    );
    if (spellcasting.slots.pact) {
      const pact = spellcasting.slots.pact;
      slots.push(
        `magie de pacte (niveau ${pact.slotLevel}) : ${pact.count - state.pactSlotsUsed} sur ${pact.count}`,
      );
    }
    paragraph(`Emplacements restants : ${slots.length > 0 ? slots.join(" ; ") : "aucun"}.`);
    paragraph("Sorts mineurs :");
    list(character.cantrips.map((spell) => spell.name));
    paragraph("Sorts connus ou préparés :");
    list(character.spells.map((spell) => `${spell.name} (niveau ${spell.level})`));
  }

  heading(2, "Capacités");
  list(character.features.map((feature) => `${feature.name} (niveau ${feature.level})`));

  heading(2, "Inventaire");
  list(
    state.inventory.map(
      (item) =>
        `${item.quantity} x ${item.name}, ${item.weight * item.quantity} lb${item.isEquipped ? ", équipé" : ""}`,
    ),
  );
  paragraph(
    `Poids porté : ${statistics.carrying.weight} lb sur ${statistics.carrying.capacity} lb (${ENCUMBRANCE_LABELS[statistics.carrying.encumbrance]}).`,
  );
  paragraph(
    `Argent : ${Object.entries(COIN_LABELS)
      .map(([coin, label]) => `${state.money[coin as keyof typeof COIN_LABELS]} ${label}`) // clés de COIN_LABELS
      .join(", ")}.`,
  );

  if (state.notes.trim()) {
    heading(2, "Notes");
    paragraph(state.notes);
  }

  doc.moveDown(1);
  paragraph(SRD_ATTRIBUTION);
  root.end();
  doc.end();
  return finished;
}
