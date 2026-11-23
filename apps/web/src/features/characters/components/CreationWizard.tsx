"use client";

import type { CharacterDraft, CharacterDraftUpdate, WizardStep } from "@epiquest/schemas";
import { useEffect, useRef, useState } from "react";
import { getDraft, updateDraft } from "../api";
import { WIZARD_STEPS, type StepContext } from "./wizard-steps";

interface CreationWizardProps {
  draftId: string;
}

/** Assistant de création pas à pas. Chaque changement est enregistré dans le brouillon côté serveur. */
export function CreationWizard({ draftId }: CreationWizardProps) {
  const [draft, setDraft] = useState<CharacterDraft | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const hasNavigated = useRef(false);

  useEffect(() => {
    getDraft(draftId)
      .then(setDraft)
      .catch(() => setError("Ce brouillon est introuvable."));
  }, [draftId]);

  const stepIndex = Math.max(
    0,
    WIZARD_STEPS.findIndex((step) => step.id === draft?.step),
  );
  const step = WIZARD_STEPS[stepIndex];

  useEffect(() => {
    // Le focus passe au titre de l'étape après une navigation, pas au premier affichage.
    if (hasNavigated.current) headingRef.current?.focus();
  }, [stepIndex]);

  async function save(update: CharacterDraftUpdate, message = "Brouillon enregistré.") {
    try {
      setDraft(await updateDraft(draftId, update));
      setStatus(message);
      setError(null);
    } catch {
      setError("L'enregistrement a échoué. Vos choix ne sont pas perdus : réessayez.");
    }
  }

  function goTo(target: WizardStep, label: string) {
    hasNavigated.current = true;
    void save({ step: target }, `Étape ${label}.`);
  }

  if (error && !draft) return <p role="alert">{error}</p>;
  if (!draft || !step) return <p>Chargement du brouillon…</p>;

  const context: StepContext = {
    draft,
    update: (choices) => void save({ choices }),
  };
  const previous = WIZARD_STEPS[stepIndex - 1];
  const next = WIZARD_STEPS[stepIndex + 1];
  const canContinue = step.isComplete(draft);
  const position = `${stepIndex + 1} sur ${WIZARD_STEPS.length}`;

  return (
    <div className="grid gap-6">
      <nav aria-label="Étapes de la création">
        <ol className="flex flex-wrap gap-2">
          {WIZARD_STEPS.map((item, index) => (
            <li key={item.id}>
              <span
                aria-current={index === stepIndex ? "step" : undefined}
                className={
                  index === stepIndex
                    ? "rounded bg-blue-800 px-2 py-1 font-semibold text-white"
                    : "rounded px-2 py-1 text-slate-700"
                }
              >
                {index + 1}. {item.label}
              </span>
            </li>
          ))}
        </ol>
      </nav>

      <section aria-labelledby="wizard-step-title" className="grid gap-4">
        <h2 id="wizard-step-title" ref={headingRef} tabIndex={-1} className="text-2xl font-bold">
          Étape {position} : {step.label}
        </h2>
        {step.render(context)}
      </section>

      <div className="flex gap-3">
        {previous && (
          <button
            type="button"
            className="rounded border border-slate-500 px-4 py-2"
            onClick={() =>
              goTo(previous.id, `${stepIndex} sur ${WIZARD_STEPS.length} : ${previous.label}`)
            }
          >
            Précédent : {previous.label}
          </button>
        )}
        {next && (
          <button
            type="button"
            className="rounded bg-blue-800 px-4 py-2 text-white disabled:bg-slate-400"
            disabled={!canContinue}
            aria-describedby={canContinue ? undefined : "wizard-blocked"}
            onClick={() =>
              goTo(next.id, `${stepIndex + 2} sur ${WIZARD_STEPS.length} : ${next.label}`)
            }
          >
            Suivant : {next.label}
          </button>
        )}
      </div>
      {!canContinue && (
        <p id="wizard-blocked" className="text-slate-700">
          {step.blockedMessage}
        </p>
      )}
      {error && <p role="alert">{error}</p>}
      <p role="status" className="sr-only">
        {status}
      </p>
    </div>
  );
}
