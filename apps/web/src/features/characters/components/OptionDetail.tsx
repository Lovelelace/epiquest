"use client";

import { useEffect, useState } from "react";
import { getOption, type OriginEntity, type SrdOptionDetail } from "../api";
import { detailFacts } from "../srd-details";

interface OptionDetailProps {
  entity: OriginEntity;
  slug: string;
  onLoaded?: (detail: SrdOptionDetail) => void;
}

/** Détail de l'option sélectionnée : faits clés et texte de règles du SRD. */
export function OptionDetail({ entity, slug, onLoaded }: OptionDetailProps) {
  const [detail, setDetail] = useState<SrdOptionDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;
    setDetail(null);
    setError(null);
    getOption(entity, slug)
      .then((loaded) => {
        if (!isCurrent) return;
        setDetail(loaded);
        onLoaded?.(loaded);
      })
      .catch(() => {
        if (isCurrent) setError("Impossible de charger le détail. Réessayez plus tard.");
      });
    return () => {
      isCurrent = false;
    };
  }, [entity, slug, onLoaded]);

  if (error) return <p role="alert">{error}</p>;
  if (!detail) return <p>Chargement du détail…</p>;
  const facts = detailFacts(entity, detail.data);
  return (
    <section aria-labelledby={`detail-${slug}`} className="rounded border border-slate-300 p-4">
      <h3 id={`detail-${slug}`} className="text-xl font-semibold">
        {detail.name}
      </h3>
      {facts.length > 0 && (
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          {facts.map((fact) => (
            <div key={fact.label} className="contents">
              <dt className="font-medium">{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {detail.description && (
        <p lang="en" className="mt-3 whitespace-pre-line">
          {detail.description}
        </p>
      )}
    </section>
  );
}
