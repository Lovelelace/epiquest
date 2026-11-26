import type { CharacterDraft, DraftChoices, WizardStep } from "@epiquest/schemas";
import type { ReactNode } from "react";
import { AbilitiesStep } from "./AbilitiesStep";
import { OriginStep } from "./OriginStep";

export interface StepContext {
  draft: CharacterDraft;
  update: (choices: Partial<DraftChoices>) => void;
  /** Tirage 4d6 des caractéristiques, fait par le serveur. */
  rollAbilities: () => void;
}

export interface WizardStepDefinition {
  id: WizardStep;
  label: string;
  /** Peut-on passer à l'étape suivante ? */
  isComplete: (draft: CharacterDraft) => boolean;
  blockedMessage: string;
  render: (context: StepContext) => ReactNode;
}

/** Étapes de l'assistant, dans l'ordre. Les étapes suivantes s'ajoutent ici. */
export const WIZARD_STEPS: WizardStepDefinition[] = [
  {
    id: "species",
    label: "Espèce",
    isComplete: (draft) => draft.choices.species !== null,
    blockedMessage: "Choisissez une espèce (et sa sous-espèce s'il y en a une) pour continuer.",
    render: ({ draft, update }) => (
      <OriginStep
        entity="species"
        legend="Espèce"
        value={draft.choices.species}
        onChange={(species) => update({ species })}
      />
    ),
  },
  {
    id: "class",
    label: "Classe",
    isComplete: (draft) => draft.choices.class !== null,
    blockedMessage: "Choisissez une classe pour continuer.",
    render: ({ draft, update }) => (
      <OriginStep
        entity="classes"
        legend="Classe"
        value={draft.choices.class}
        onChange={(characterClass) => update({ class: characterClass })}
      />
    ),
  },
  {
    id: "background",
    label: "Historique",
    isComplete: (draft) => draft.choices.background !== null,
    blockedMessage: "Choisissez un historique pour continuer.",
    render: ({ draft, update }) => (
      <OriginStep
        entity="backgrounds"
        legend="Historique"
        value={draft.choices.background}
        onChange={(background) => update({ background })}
      />
    ),
  },
  {
    id: "abilities",
    label: "Caractéristiques",
    isComplete: (draft) => draft.choices.baseAbilityScores !== null,
    blockedMessage: "Répartissez les six valeurs de caractéristique pour continuer.",
    render: ({ draft, update, rollAbilities }) => (
      <AbilitiesStep
        key={draft.choices.abilityMethod ?? "none"}
        draft={draft}
        update={update}
        roll={rollAbilities}
      />
    ),
  },
];
