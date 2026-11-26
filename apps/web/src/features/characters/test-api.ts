import { EMPTY_DRAFT_CHOICES, type CharacterDraft } from "@epiquest/schemas";
import { vi } from "vitest";
import { TEST_CHARACTER } from "./test-character";

/** Faux serveur pour les tests de l'assistant : brouillon en mémoire et quelques entrées du SRD. */
export function mockApi(initial: Partial<CharacterDraft> = {}) {
  let draft: CharacterDraft = {
    id: "11111111-1111-4111-8111-111111111111",
    step: "species",
    choices: { ...EMPTY_DRAFT_CHOICES },
    abilityRolls: null,
    updatedAt: "2026-11-23T10:00:00.000Z",
    ...initial,
  };
  const summary = (slug: string, name: string) => ({
    id: "22222222-2222-4222-8222-222222222222",
    slug,
    name,
  });
  const lists: Record<string, unknown[]> = {
    species: [
      { ...summary("elf", "Elf"), size: "medium", speed: 30 },
      { ...summary("high-elf", "High Elf"), size: null, speed: null },
      { ...summary("human", "Human"), size: "medium", speed: 30 },
    ],
    classes: [
      { ...summary("fighter", "Fighter"), hitDie: 10 },
      { ...summary("wizard", "Wizard"), hitDie: 6 },
    ],
    backgrounds: [summary("acolyte", "Acolyte")],
  };
  const details: Record<string, Record<string, unknown>> = {
    elf: { speed: 30, subraces: [{ index: "high-elf", name: "High Elf" }], ability_bonuses: [] },
    "high-elf": { race: { index: "elf" } },
    human: { speed: 30 },
    fighter: { hit_die: 10 },
    wizard: { hit_die: 6, saving_throws: [{ name: "INT" }, { name: "WIS" }] },
    acolyte: { starting_proficiencies: [{ name: "Skill: Insight" }] },
  };
  const options = {
    skillChoice: { count: 2, options: ["arcana", "history", "insight", "investigation"] },
    grantedSkills: ["perception", "insight", "religion"],
    expertiseCount: 0,
    originBonuses: [
      { ability: "dex", amount: 2, source: "species" },
      { ability: "int", amount: 1, source: "species" },
    ],
    subclass: { level: 2, options: [{ slug: "evocation", name: "Evocation" }] },
    spellcasting: {
      ability: "int",
      cantripsKnown: 2,
      maxSpells: 2,
      maxSpellLevel: 1,
      spellList: [
        { slug: "fire-bolt", name: "Fire Bolt", level: 0 },
        { slug: "light", name: "Light", level: 0 },
        { slug: "mage-hand", name: "Mage Hand", level: 0 },
        { slug: "magic-missile", name: "Magic Missile", level: 1 },
        { slug: "shield", name: "Shield", level: 1 },
        { slug: "sleep", name: "Sleep", level: 1 },
      ],
    },
    fixedEquipment: [{ slug: "spellbook", name: "Spellbook", quantity: 1 }],
    equipmentChoices: [
      {
        description: "(a) a quarterstaff or (b) a dagger",
        options: [
          {
            label: "1 × Quarterstaff",
            items: [{ slug: "quarterstaff", name: "Quarterstaff", quantity: 1 }],
          },
          { label: "1 × Dagger", items: [{ slug: "dagger", name: "Dagger", quantity: 1 }] },
        ],
      },
    ],
  };
  const json = (body: unknown, status = 200) =>
    Promise.resolve(
      new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
      }),
    );

  const rollRequests: object[] = [];
  const actions: object[] = [];
  const fetchMock = vi.fn((input: string, init?: RequestInit) => {
    const url = new URL(input);
    const [, first, second, third] = url.pathname.split("/");
    if (first === "characters" && third === "rolls" && init?.method === "POST") {
      const request = JSON.parse(String(init.body)) as {
        kind: string;
        key?: string;
        visibility: string;
      };
      const isHidden = request.visibility === "hidden";
      const roll = {
        id: crypto.randomUUID(),
        label: request.kind === "skill" && request.key === "arcana" ? "Arcanes" : "Initiative",
        expression: "1d20 + 5",
        dice: isHidden ? [] : [{ sides: 20, value: 11 }],
        modifier: 5,
        total: isHidden ? null : 16,
        visibility: request.visibility,
        rolledAt: "2026-11-23T10:00:00.000Z",
      };
      rollRequests.push(request);
      return json(roll, 201);
    }
    if (first === "characters" && third === "rolls") return json([]);
    if (first === "characters" && third === "history") return json([]);
    if (first === "characters" && third === "actions") {
      const action = JSON.parse(String(init?.body)) as { type: string; amount?: number };
      actions.push(action);
      if (action.type === "money")
        return json(
          { code: "INSUFFICIENT_FUNDS", message: "La bourse ne contient pas assez d'argent." },
          422,
        );
      const current =
        TEST_CHARACTER.state.currentHitPoints -
        (action.type === "damage" ? (action.amount ?? 0) : 0);
      return json({
        ...TEST_CHARACTER,
        state: { ...TEST_CHARACTER.state, currentHitPoints: current },
      });
    }
    if (first === "characters") return json(TEST_CHARACTER);
    if (first === "character-drafts" && third === "options") return json(options);
    if (first === "character-drafts" && third === "preview") {
      const violations = draft.choices.name
        ? []
        : [{ code: "NAME_REQUIRED", message: "Donnez un nom à votre personnage.", path: "name" }];
      return json({ violations, statistics: null });
    }
    if (first === "character-drafts" && third === "character") {
      return draft.choices.name
        ? json(TEST_CHARACTER, 201)
        : json(
            { code: "CHARACTER_INVALID", message: "Le personnage ne respecte pas les règles." },
            422,
          );
    }
    if (first === "character-drafts" && third === "ability-rolls") {
      const abilityRolls = [15, 14, 13, 12, 10, 8].map((total) => ({
        dice: [1, total - 12 > 0 ? 6 : 5, 4, 3],
        total,
      }));
      draft = {
        ...draft,
        abilityRolls,
        choices: { ...draft.choices, abilityMethod: "rolled", baseAbilityScores: null },
      };
      return json(draft, 201);
    }
    if (first === "character-drafts") {
      if (init?.method === "PATCH") {
        const update = JSON.parse(String(init.body)) as {
          step?: CharacterDraft["step"];
          choices?: object;
        };
        draft = {
          ...draft,
          step: update.step ?? draft.step,
          choices: { ...draft.choices, ...update.choices },
        };
      }
      return json(draft);
    }
    if (first === "srd" && second && !third) {
      const items = lists[second] ?? [];
      return json({ items, page: 1, pageSize: 100, total: items.length });
    }
    if (first === "srd" && second && third) {
      const item = (lists[second] ?? []).find(
        (entry) => (entry as { slug: string }).slug === third,
      );
      return json({ ...(item as object), description: "Rules text.", data: details[third] ?? {} });
    }
    return json({ code: "NOT_FOUND", message: "Introuvable" }, 404);
  });
  vi.stubGlobal("fetch", fetchMock);
  return { fetchMock, current: () => draft, rollRequests, actions };
}
