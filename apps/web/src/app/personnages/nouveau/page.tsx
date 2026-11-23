"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createDraft } from "@/features/characters/api";

/** Crée un brouillon côté serveur puis ouvre l'assistant. */
export default function NewCharacterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;
    createDraft()
      .then((draft) => router.replace(`/personnages/brouillons/${draft.id}`))
      .catch(() => setError("Impossible de commencer la création. Réessayez plus tard."));
  }, [router]);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-3xl font-bold">Nouveau personnage</h1>
      {error ? <p role="alert">{error}</p> : <p role="status">Préparation du brouillon…</p>}
    </main>
  );
}
