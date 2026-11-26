"use client";

import { useTableConnection } from "../use-table-connection";
import { GmTable } from "./GmTable";

/** Vue MJ branchée sur le serveur : salle `gm` de la campagne. */
export function GmTableScreen({
  campaignId,
  userId,
  playersViewHref,
}: {
  campaignId: string;
  userId: string;
  playersViewHref: string;
}) {
  const { status, refusal, snapshot, send } = useTableConnection({
    campaignId,
    userId,
    audience: "gm",
  });
  return (
    <GmTable
      state={snapshot}
      status={status}
      refusal={refusal}
      playersViewHref={playersViewHref}
      send={send}
    />
  );
}
