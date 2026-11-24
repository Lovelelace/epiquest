"use client";

import type { PlayerTableView } from "@epiquest/schemas";
import { useEffect, useRef, useState } from "react";
import { describeChanges } from "../announcements";
import { useTableConnection } from "../use-table-connection";
import { PlayerTable } from "./PlayerTable";

/** Nombre d'annonces gardées dans la zone `aria-live`. */
const MAX_ANNOUNCEMENTS = 5;

/** Vue joueurs branchée sur le serveur : salle `players` de la campagne. */
export function PlayerTableScreen({ campaignId, userId }: { campaignId: string; userId: string }) {
  const { status, refusal, snapshot } = useTableConnection({
    campaignId,
    userId,
    audience: "players",
  });
  const [announcements, setAnnouncements] = useState<string[]>([]);
  const previous = useRef<PlayerTableView | null>(null);

  useEffect(() => {
    if (snapshot === null || snapshot === previous.current) return;
    const messages = describeChanges(previous.current, snapshot);
    previous.current = snapshot;
    if (messages.length > 0)
      setAnnouncements((current) => [...current, ...messages].slice(-MAX_ANNOUNCEMENTS));
  }, [snapshot]);

  return (
    <PlayerTable view={snapshot} status={status} refusal={refusal} announcements={announcements} />
  );
}
