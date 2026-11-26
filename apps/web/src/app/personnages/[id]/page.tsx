import { CharacterSheet } from "@/features/characters/components/CharacterSheet";

export default async function CharacterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <CharacterSheet characterId={id} />
    </main>
  );
}
