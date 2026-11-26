"use client";

import type { CreationOptions } from "@epiquest/schemas";
import { useEffect, useState } from "react";
import { getCreationOptions } from "./api";

/** Options de création du brouillon, rechargées quand `refreshKey` change. */
export function useCreationOptions(draftId: string, refreshKey: string) {
  const [options, setOptions] = useState<CreationOptions | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let isCurrent = true;
    getCreationOptions(draftId)
      .then((loaded) => {
        if (isCurrent) setOptions(loaded);
      })
      .catch(() => {
        if (isCurrent) setError("Impossible de charger les options. Réessayez plus tard.");
      });
    return () => {
      isCurrent = false;
    };
  }, [draftId, refreshKey]);
  return { options, error };
}
