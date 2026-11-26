import { CharacterOverview } from "@/features/characters/components/CharacterOverview";

export default async function CharacterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <CharacterOverview characterId={id} />
    </main>
  );
}
