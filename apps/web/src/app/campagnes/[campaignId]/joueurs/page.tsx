import type { Metadata } from "next";
import { devIdentityFrom, PlayerTableScreen } from "@/features/table";

export const metadata: Metadata = { title: "Vue joueurs · EpiQuest" };

export default async function PlayersPage({
  params,
  searchParams,
}: {
  params: Promise<{ campaignId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { campaignId } = await params;
  return <PlayerTableScreen campaignId={campaignId} userId={devIdentityFrom(await searchParams)} />;
}
