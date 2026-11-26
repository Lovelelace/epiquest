"use client";

import type { Skill } from "@epiquest/rules";
import type { CharacterDraft, DraftChoices } from "@epiquest/schemas";
import { SKILL_NAMES } from "../skill-names";
import { useCreationOptions } from "../use-creation-options";
import { CheckboxGroup } from "./CheckboxGroup";

interface SkillsStepProps {
  draft: CharacterDraft;
  update: (choices: Partial<DraftChoices>) => void;
}

/** Étape des compétences : seules celles proposées par la classe sont cochables. */
export function SkillsStep({ draft, update }: SkillsStepProps) {
  const { options, error } = useCreationOptions(draft.id, "skills");
  if (error) return <p role="alert">{error}</p>;
  if (!options) return <p>Chargement des compétences…</p>;
  const granted = options.grantedSkills;
  const choosable = options.skillChoice.options.filter((skill) => !granted.includes(skill));
  const proficient: Skill[] = [...granted, ...draft.choices.chosenSkills];
  return (
    <div className="grid gap-6">
      <section aria-labelledby="granted-skills">
        <h3 id="granted-skills" className="text-lg font-semibold">
          Compétences déjà maîtrisées (espèce et historique)
        </h3>
        <p>
          {granted.length > 0 ? granted.map((skill) => SKILL_NAMES[skill]).join(", ") : "Aucune."}
        </p>
      </section>
      <CheckboxGroup
        legend="Compétences de classe"
        hint={`Choisissez ${options.skillChoice.count} compétences`}
        options={choosable.map((skill) => ({ value: skill, label: SKILL_NAMES[skill] }))}
        selected={draft.choices.chosenSkills}
        max={options.skillChoice.count}
        onChange={(chosen) => update({ chosenSkills: chosen as Skill[], expertise: [] })}
      />
      {options.expertiseCount > 0 && (
        <CheckboxGroup
          legend="Expertise"
          hint={`Doublez le bonus de maîtrise de ${options.expertiseCount} compétences maîtrisées`}
          options={proficient.map((skill) => ({ value: skill, label: SKILL_NAMES[skill] }))}
          selected={draft.choices.expertise}
          max={options.expertiseCount}
          onChange={(expertise) => update({ expertise: expertise as Skill[] })}
        />
      )}
    </div>
  );
}
