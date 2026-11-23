"use client";

import { useCallback, useEffect, useState } from "react";
import { listOptions, type OriginEntity, type SrdOption, type SrdOptionDetail } from "../api";
import { subspecies } from "../srd-details";
import { OptionDetail } from "./OptionDetail";
import { OptionList } from "./OptionList";

interface OriginStepProps {
  entity: OriginEntity;
  legend: string;
  value: string | null;
  onChange: (slug: string) => void;
}

/** Étape de choix d'une origine (espèce, classe ou historique), avec le détail de l'option. */
export function OriginStep({ entity, legend, value, onChange }: OriginStepProps) {
  const [options, setOptions] = useState<SrdOption[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Pour l'espèce : l'espèce parente affichée, quand le brouillon contient une sous-espèce.
  const [parent, setParent] = useState<string | null>(null);
  const [subOptions, setSubOptions] = useState<SrdOption[]>([]);

  useEffect(() => {
    listOptions(entity)
      .then((items) =>
        // Les sous-espèces n'ont pas de vitesse propre : on n'affiche que les espèces parentes.
        setOptions(
          entity === "species"
            ? items.filter((item) => "speed" in item && item.speed !== null)
            : items,
        ),
      )
      .catch(() => setError("Impossible de charger les options. Réessayez plus tard."));
  }, [entity]);

  const selectedTop =
    entity === "species" && value && options && !options.some((option) => option.slug === value)
      ? parent
      : value;

  const handleParentLoaded = useCallback((detail: SrdOptionDetail) => {
    setSubOptions(subspecies(detail.data));
  }, []);

  const handleSubLoaded = useCallback((detail: SrdOptionDetail) => {
    const race = detail.data.race;
    if (
      typeof race === "object" &&
      race !== null &&
      "index" in race &&
      typeof race.index === "string"
    ) {
      setParent(race.index);
    }
  }, []);

  if (error) return <p role="alert">{error}</p>;
  if (!options) return <p>Chargement des options…</p>;

  const isSubspecies = entity === "species" && value !== null && value !== selectedTop;
  return (
    <div className="grid gap-6">
      <OptionList
        name={entity}
        legend={legend}
        options={options}
        value={selectedTop}
        onChange={(slug) => {
          setParent(slug);
          setSubOptions([]);
          onChange(slug);
        }}
      />
      {isSubspecies && value && !parent && (
        <OptionDetail entity="species" slug={value} onLoaded={handleSubLoaded} />
      )}
      {selectedTop && (
        <OptionDetail
          entity={entity}
          slug={selectedTop}
          {...(entity === "species" ? { onLoaded: handleParentLoaded } : {})}
        />
      )}
      {entity === "species" && subOptions.length > 0 && (
        <>
          <OptionList
            name="subspecies"
            legend="Sous-espèce"
            options={subOptions}
            value={isSubspecies ? value : null}
            onChange={onChange}
          />
          {isSubspecies && value && parent && <OptionDetail entity="species" slug={value} />}
        </>
      )}
    </div>
  );
}
