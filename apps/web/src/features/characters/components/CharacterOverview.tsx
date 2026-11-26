"use client";

import type { Character } from "@epiquest/schemas";
import { useEffect, useState } from "react";
import { getCharacter } from "../api";
import { StatisticsSummary } from "./StatisticsSummary";

/** Fiche du personnage créé. */
export function CharacterOverview({ characterId }: { characterId: string }) {
  const [character, setCharacter] = useState<Character | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    getCharacter(characterId)
      .then(setCharacter)
      .catch(() => setError("Ce personnage est introuvable."));
  }, [characterId]);
  if (error) return <p role="alert">{error}</p>;
  if (!character) return <p>Chargement du personnage…</p>;
  return (
    <article className="grid gap-6">
      <header>
        <h1 className="text-3xl font-bold">{character.name}</h1>
        <p lang="en">
          {character.species.name} · {character.class.name} {character.level} ·{" "}
          {character.background.name}
        </p>
      </header>
      <StatisticsSummary statistics={character.statistics} />
    </article>
  );
}
