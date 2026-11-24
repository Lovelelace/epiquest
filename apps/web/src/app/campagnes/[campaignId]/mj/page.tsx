import type { Metadata } from "next";
import { DEV_IDENTITY_PARAM, devIdentityFrom, GmTableScreen } from "@/features/table";

export const metadata: Metadata = { title: "Vue MJ · EpiQuest" };

export default async function GameMasterPage({
  params,
  searchParams,
}: {
  params: Promise<{ campaignId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { campaignId } = await params;
  const userId = devIdentityFrom(await searchParams);
  const query = new URLSearchParams({ [DEV_IDENTITY_PARAM]: userId });
  return (
    <GmTableScreen
      campaignId={campaignId}
      userId={userId}
      playersViewHref={`/campagnes/${encodeURIComponent(campaignId)}/joueurs?${query.toString()}`}
    />
  );
}
