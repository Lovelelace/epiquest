"use client";

import type { CharacterDraft, DraftChoices } from "@epiquest/schemas";
import { useCreationOptions } from "../use-creation-options";
import { CheckboxGroup } from "./CheckboxGroup";

interface SpellsStepProps {
  draft: CharacterDraft;
  update: (choices: Partial<DraftChoices>) => void;
}

/** Étape des sorts : sorts mineurs et sorts de la liste de la classe, au niveau accessible. */
export function SpellsStep({ draft, update }: SpellsStepProps) {
  const { options, error } = useCreationOptions(draft.id, "spells");
  if (error) return <p role="alert">{error}</p>;
  if (!options) return <p>Chargement des sorts…</p>;
  const spellcasting = options.spellcasting;
  if (!spellcasting || (spellcasting.cantripsKnown === 0 && spellcasting.maxSpells === 0)) {
    return <p>Votre classe ne lance pas de sorts au niveau 1 : passez à l&apos;étape suivante.</p>;
  }
  const toOption = (spell: { slug: string; name: string }) => ({
    value: spell.slug,
    label: spell.name,
    lang: "en",
  });
  return (
    <div className="grid gap-6">
      {spellcasting.cantripsKnown > 0 && (
        <CheckboxGroup
          legend="Sorts mineurs"
          hint={`Choisissez ${spellcasting.cantripsKnown} sorts mineurs`}
          options={spellcasting.spellList.filter((spell) => spell.level === 0).map(toOption)}
          selected={draft.choices.cantrips}
          max={spellcasting.cantripsKnown}
          onChange={(cantrips) => update({ cantrips })}
        />
      )}
      {spellcasting.maxSpells > 0 && (
        <CheckboxGroup
          legend="Sorts du 1er niveau"
          hint={`Choisissez jusqu'à ${spellcasting.maxSpells} sorts`}
          options={spellcasting.spellList.filter((spell) => spell.level > 0).map(toOption)}
          selected={draft.choices.spells}
          max={spellcasting.maxSpells}
          onChange={(spells) => update({ spells })}
        />
      )}
    </div>
  );
}
